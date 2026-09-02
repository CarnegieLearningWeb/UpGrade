import { Service } from 'typedi';
import { HttpError } from 'routing-controllers';
import { InjectRepository } from '../../typeorm-typedi-extensions';
import { UpgradeLogger } from '../../lib/logger/UpgradeLogger';
import { BinaryRewardAllowedValue, EXPERIMENT_STATE, SERVER_ERROR } from 'upgrade_types';
import { ThompsonSamplingRewardRepository } from '../repositories/ThompsonSamplingRewardRepository';
import { ConditionPosteriorStateRepository } from '../repositories/ConditionPosteriorStateRepository';
import { ThompsonSamplingExperimentConfigRepository } from '../repositories/ThompsonSamplingExperimentConfigRepository';
import { IndividualEnrollmentRepository } from '../repositories/IndividualEnrollmentRepository';
import { ThompsonSamplingExperimentConfig } from '../models/ThompsonSamplingExperimentConfig';
import { RewardValidator } from '../controllers/validators/RewardValidator';
import { RequestedExperimentUser } from '../controllers/validators/ExperimentUserValidator';

export interface IThompsonSamplingRewardResponse {
  message: string;
  request: RewardValidator;
}

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
    private individualEnrollmentRepository: IndividualEnrollmentRepository
  ) {}

  public async recordReward(
    user: RequestedExperimentUser,
    request: RewardValidator,
    logger: UpgradeLogger
  ): Promise<IThompsonSamplingRewardResponse> {
    const { experimentId, context, decisionPoint, rewardValue } = request;
    const success = rewardValue === BinaryRewardAllowedValue.SUCCESS;

    try {
      const config = experimentId
        ? await this.findConfigById(experimentId, request, logger)
        : await this.findConfigByDecisionPoint(context, decisionPoint, request, logger);

      if (config.experiment.state !== EXPERIMENT_STATE.ENROLLING) {
        this.throwConflictError(
          `Experiment ${config.experimentId} is not actively enrolling (state: ${config.experiment.state}), reward not recorded.`,
          request,
          logger
        );
      }

      const enrollments = await this.individualEnrollmentRepository.findEnrollments(user.id, [config.experimentId]);

      if (!enrollments.length || enrollments.length > 1) {
        this.throwConflictError(
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
        this.throwConflictError(
          `No posterior state found for condition ${conditionId} in experiment ${config.experimentId}, reward not recorded.`,
          request,
          logger
        );
      }

      await this.applyOrBufferReward(state.id, success, config.batchSize);

      logger.info({
        message: 'Thompson Sampling reward recorded',
        experimentId: config.experimentId,
        conditionId,
        userId: user.id,
        success,
      });

      return { message: 'Reward recorded successfully.', request };
    } catch (error) {
      if (error instanceof HttpError) throw error;
      this.throwConflictError(
        `Failed to record reward (userId: ${user.id}, experimentId: ${experimentId ?? 'not provided'}).`,
        request,
        logger
      );
    }
  }

  /**
   * Fold a reward into the posterior (successCount/totalCount), or buffer it as pending until
   * batchSize reward observations have accumulated for this condition. The raw event is always
   * persisted to ThompsonSamplingReward regardless of batching — batching only delays when a
   * reward affects which condition gets sampled next, it never drops data.
   */
  private async applyOrBufferReward(stateId: string, success: boolean, batchSize?: number): Promise<void> {
    const effectiveBatchSize = batchSize && batchSize > 1 ? batchSize : 1;

    if (effectiveBatchSize <= 1) {
      await this.posteriorStateRepository.increment({ id: stateId }, 'totalCount', 1);
      if (success) {
        await this.posteriorStateRepository.increment({ id: stateId }, 'successCount', 1);
      } else {
        await this.posteriorStateRepository.increment({ id: stateId }, 'failureCount', 1);
      }
      return;
    }

    await this.posteriorStateRepository.increment({ id: stateId }, 'pendingTotalCount', 1);
    if (success) {
      await this.posteriorStateRepository.increment({ id: stateId }, 'pendingSuccessCount', 1);
    } else {
      await this.posteriorStateRepository.increment({ id: stateId }, 'pendingFailureCount', 1);
    }

    const refreshedState = await this.posteriorStateRepository.findOne({ where: { id: stateId } });

    if (refreshedState.pendingTotalCount >= effectiveBatchSize) {
      await this.flushPendingRewards(
        stateId,
        refreshedState.pendingSuccessCount,
        refreshedState.pendingFailureCount,
        refreshedState.pendingTotalCount
      );
    }
  }

  private async flushPendingRewards(
    stateId: string,
    pendingSuccessCount: number,
    pendingFailureCount: number,
    pendingTotalCount: number
  ): Promise<void> {
    await this.posteriorStateRepository.increment({ id: stateId }, 'totalCount', pendingTotalCount);
    if (pendingSuccessCount > 0) {
      await this.posteriorStateRepository.increment({ id: stateId }, 'successCount', pendingSuccessCount);
    }
    if (pendingFailureCount > 0) {
      await this.posteriorStateRepository.increment({ id: stateId }, 'failureCount', pendingFailureCount);
    }
    await this.posteriorStateRepository.update(
      { id: stateId },
      { pendingSuccessCount: 0, pendingFailureCount: 0, pendingTotalCount: 0 }
    );
  }

  private async findConfigById(
    experimentId: string,
    request: RewardValidator,
    logger: UpgradeLogger
  ): Promise<ThompsonSamplingExperimentConfig> {
    const config = await this.tsConfigRepository.findOne({
      where: { experimentId },
      relations: { experiment: true },
    });

    if (!config) {
      this.throwConflictError(
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
    const configs = await this.tsConfigRepository.findByDecisionPoint(context, site, target);

    if (configs.length === 0) {
      this.throwConflictError(
        `No active Thompson Sampling experiment found for decision point (context: ${context}, site: ${site}, target: ${target}).`,
        request,
        logger
      );
    }

    if (configs.length > 1) {
      this.throwConflictError(
        `Multiple active Thompson Sampling experiments found for decision point (context: ${context}, site: ${site}, target: ${target}); use experimentId to disambiguate.`,
        request,
        logger
      );
    }

    return configs[0];
  }

  private throwConflictError(message: string, request: RewardValidator, logger: UpgradeLogger): never {
    logger.error({ message, request });
    const error = new HttpError(409, message);
    (error as any).type = SERVER_ERROR.ASSIGNMENT_ERROR;
    throw error;
  }
}
