import { Service } from 'typedi';
import { EntityManager } from 'typeorm';
import { InjectRepository } from '../../typeorm-typedi-extensions';
import { UpgradeLogger } from '../../lib/logger/UpgradeLogger';
import { BinaryRewardAllowedValue, CACHE_PREFIX, EXPERIMENT_STATE } from 'upgrade_types';
import { ThompsonSamplingRewardRepository } from '../repositories/ThompsonSamplingRewardRepository';
import { ConditionPosteriorStateRepository } from '../repositories/ConditionPosteriorStateRepository';
import { ThompsonSamplingExperimentConfigRepository } from '../repositories/ThompsonSamplingExperimentConfigRepository';
import { IndividualEnrollmentRepository } from '../repositories/IndividualEnrollmentRepository';
import { ThompsonSamplingExperimentConfig } from '../models/ThompsonSamplingExperimentConfig';
import { ConditionPosteriorState } from '../models/ConditionPosteriorState';
import { CacheService } from './CacheService';
import { RewardValidator } from '../controllers/validators/RewardValidator';
import { RequestedExperimentUser } from '../controllers/validators/ExperimentUserValidator';

export interface IThompsonSamplingRewardResponse {
  message: string;
  request: RewardValidator;
}

/**
 * Thrown internally to unwind out of processReward() once a failure has already been logged via
 * logAndAbort() — nothing downstream is waiting on this rejection (see acceptReward()), so it
 * exists purely for control flow, not to be reported anywhere else.
 */
class RewardProcessingAborted extends Error {}

@Service()
export class ThompsonSamplingRewardService {
  constructor(
    @InjectRepository()
    private tsRewardRepository: ThompsonSamplingRewardRepository,
    @InjectRepository()
    private posteriorStateRepository: ConditionPosteriorStateRepository,
    @InjectRepository()
    private tsConfigRepository: ThompsonSamplingExperimentConfigRepository,
    @InjectRepository()
    private individualEnrollmentRepository: IndividualEnrollmentRepository,
    private cacheService: CacheService
  ) {}

  /**
   * Acknowledges the reward immediately and does the actual work (config/enrollment lookups, the
   * audit write, posterior updates) in the background. Nothing on the client side is waiting on
   * this to make a UI decision, so there's no reason to hold the connection — and make the caller
   * pay for however many DB round trips recording and batching take — before responding. A failure
   * only surfaces in the server logs; see processReward()/logAndAbort().
   */
  public acceptReward(
    user: RequestedExperimentUser,
    request: RewardValidator,
    logger: UpgradeLogger
  ): IThompsonSamplingRewardResponse {
    this.processReward(user, request, logger).catch((error) => {
      if (!(error instanceof RewardProcessingAborted)) {
        logger.error({
          message: `Unexpected error processing Thompson Sampling reward (userId: ${user.id}, experimentId: ${
            request.experimentId ?? 'not provided'
          }).`,
          error,
          request,
        });
      }
    });

    return { message: 'Reward received and is being processed.', request };
  }

  private async processReward(
    user: RequestedExperimentUser,
    request: RewardValidator,
    logger: UpgradeLogger
  ): Promise<void> {
    const { experimentId, context, decisionPoint, rewardValue } = request;
    const success = rewardValue === BinaryRewardAllowedValue.SUCCESS;

    const config = experimentId
      ? await this.findConfigById(experimentId, request, logger)
      : await this.findConfigByDecisionPoint(context, decisionPoint, request, logger);

    if (config.experiment.state !== EXPERIMENT_STATE.ENROLLING) {
      this.logAndAbort(
        `Experiment ${config.experimentId} is not actively enrolling (state: ${config.experiment.state}), reward not recorded.`,
        request,
        logger
      );
    }

    const enrollments = await this.individualEnrollmentRepository.findEnrollments(user.id, [config.experimentId]);

    if (!enrollments.length || enrollments.length > 1) {
      this.logAndAbort(
        `Could not find unique enrollment for user ${user.id} in experiment ${config.experimentId}, reward not recorded.`,
        request,
        logger
      );
    }

    const { conditionId } = enrollments[0];

    await this.tsRewardRepository.save({
      experimentId: config.experimentId,
      conditionId,
      userId: user.id,
      success,
    });

    const state = await this.posteriorStateRepository.findByConditionId(conditionId);

    if (!state) {
      this.logAndAbort(
        `No posterior state found for condition ${conditionId} in experiment ${config.experimentId}, reward not recorded.`,
        request,
        logger
      );
    }

    await this.applyOrBufferReward(state, success, config.batchSize);

    logger.info({
      message: 'Thompson Sampling reward recorded',
      experimentId: config.experimentId,
      conditionId,
      userId: user.id,
      success,
    });
  }

  /**
   * Fold a reward into the posterior (successCount/totalCount), or buffer it as pending until
   * batchSize reward observations have accumulated across the whole experiment. The raw event is
   * always persisted to ThompsonSamplingReward regardless of batching (in processReward(), before
   * this is called) — batching only delays when a reward affects which condition gets sampled
   * next, it never drops data. An unset/≤1 batchSize applies the reward immediately.
   *
   * Everything below runs inside one transaction that takes a pessimistic write lock on every
   * ConditionPosteriorState row for this config up front (ordered by id, to avoid deadlocking
   * against a concurrent reward that locks the same rows). batchSize paces how often posteriors
   * move for the experiment as a whole, and a reward for any condition is evidence toward that
   * same shared cadence, so the "is the batch ready" check has to see a consistent snapshot across
   * every condition, not just the one that just received a reward — without the lock, two rewards
   * arriving close together could both read the same pending totals and double-apply them, or one
   * could have its just-buffered increment silently overwritten by the other's flush-reset. Once
   * the shared total reaches batchSize, every condition's pending buffer is flushed, not just the
   * one that tipped it over, so a low-volume condition still gets its pending counts folded in as
   * soon as the batch closes.
   */
  private async applyOrBufferReward(
    state: Pick<ConditionPosteriorState, 'id' | 'configId'>,
    success: boolean,
    batchSize?: number
  ): Promise<void> {
    const effectiveBatchSize = batchSize && batchSize > 1 ? batchSize : 1;

    await this.posteriorStateRepository.manager.transaction(async (manager) => {
      const experimentStates = await manager
        .createQueryBuilder(ConditionPosteriorState, 'state')
        .where('state.configId = :configId', { configId: state.configId })
        .orderBy('state.id', 'ASC')
        .setLock('pessimistic_write')
        .getMany();

      const current = experimentStates.find((s) => s.id === state.id);
      if (!current) {
        return;
      }

      current.pendingTotalCount += 1;
      if (success) {
        current.pendingSuccessCount += 1;
      } else {
        current.pendingFailureCount += 1;
      }

      if (effectiveBatchSize <= 1) {
        await this.flushPendingRewards(manager, current);
        return;
      }

      await manager.save(current);

      const totalPending = experimentStates.reduce((sum, s) => sum + s.pendingTotalCount, 0);
      if (totalPending < effectiveBatchSize) {
        return;
      }

      await Promise.all(
        experimentStates.filter((s) => s.pendingTotalCount > 0).map((s) => this.flushPendingRewards(manager, s))
      );
    });
  }

  private async flushPendingRewards(manager: EntityManager, state: ConditionPosteriorState): Promise<void> {
    state.totalCount += state.pendingTotalCount;
    state.successCount += state.pendingSuccessCount;
    state.failureCount += state.pendingFailureCount;
    state.pendingTotalCount = 0;
    state.pendingSuccessCount = 0;
    state.pendingFailureCount = 0;
    await manager.save(state);
  }

  /**
   * Config lookups are cached — warmupThreshold/minimumDrawDifference/batchSize and the
   * experiment's enrolling state change only on an admin edit (ThompsonSamplingExperimentCrudService
   * invalidates on write), while a reward can arrive for the same experiment far more often. This
   * keeps a burst of rewards from re-querying the DB for data that hasn't moved. Same read-only
   * contract as ExperimentService.getCachedValidExperiments(): the returned object is shared across
   * callers, never mutate it.
   *
   * Note: an experiment's enrolling state can also change via ExperimentService.updateState()
   * (start/stop), which this cache does not invalidate — that state change is tolerated as
   * TTL-bounded staleness, the same tradeoff already accepted by getCachedValidExperiments for the
   * assignment path.
   */
  private async findConfigById(
    experimentId: string,
    request: RewardValidator,
    logger: UpgradeLogger
  ): Promise<ThompsonSamplingExperimentConfig> {
    const config = await this.cacheService.wrap(
      CACHE_PREFIX.THOMPSON_SAMPLING_CONFIG_KEY_PREFIX + 'id:' + experimentId,
      () =>
        this.tsConfigRepository.findOne({
          where: { experimentId },
          relations: { experiment: true },
        })
    );

    if (!config) {
      this.logAndAbort(
        `No Thompson Sampling config found for experiment ${experimentId}, reward not recorded.`,
        request,
        logger
      );
    }

    return config;
  }

  private async findConfigByDecisionPoint(
    context: string,
    decisionPoint: { site: string; target: string },
    request: RewardValidator,
    logger: UpgradeLogger
  ): Promise<ThompsonSamplingExperimentConfig> {
    const { site, target } = decisionPoint;
    const configs = await this.cacheService.wrap(
      CACHE_PREFIX.THOMPSON_SAMPLING_CONFIG_KEY_PREFIX + `dp:${context}:${site}:${target}`,
      () => this.tsConfigRepository.findByDecisionPoint(context, site, target)
    );

    if (configs.length === 0) {
      this.logAndAbort(
        `No active Thompson Sampling experiment found for decision point (context: ${context}, site: ${site}, target: ${target}).`,
        request,
        logger
      );
    }

    if (configs.length > 1) {
      this.logAndAbort(
        `Multiple active Thompson Sampling experiments found for decision point (context: ${context}, site: ${site}, target: ${target}); use experimentId to disambiguate.`,
        request,
        logger
      );
    }

    return configs[0];
  }

  private logAndAbort(message: string, request: RewardValidator, logger: UpgradeLogger): never {
    logger.error({ message, request });
    throw new RewardProcessingAborted(message);
  }
}
