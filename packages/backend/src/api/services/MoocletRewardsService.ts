import { UpgradeLogger } from '../../lib/logger/UpgradeLogger';
import {
  EXPERIMENT_STATE,
  SERVER_ERROR,
  BinaryRewardValueMap,
  MoocletTSConfigurablePolicyParametersDTO,
  Prior,
} from 'upgrade_types';
import { RequestedExperimentUser } from '../controllers/validators/ExperimentUserValidator';
import { MoocletExperimentRef } from '../models/MoocletExperimentRef';
import { MoocletDataService } from './MoocletDataService';
import { MoocletExperimentRefRepository } from '../repositories/MoocletExperimentRefRepository';
import { IndividualEnrollment } from '../models/IndividualEnrollment';
import { IndividualEnrollmentRepository } from '../repositories/IndividualEnrollmentRepository';
import { Service } from 'typedi';
import { InjectRepository } from '../../typeorm-typedi-extensions';
import { HttpError } from 'routing-controllers';
import {
  MoocletPaginatedResponse,
  MoocletRewardCountRequestBody,
  MoocletValueRequestBody,
  MoocletValueResponseDetails,
} from '../../types/Mooclet';
import { RewardValidator } from '../controllers/validators/RewardValidator';
import { ExperimentRewardsByCondition, ExperimentRewardsSummary } from 'upgrade_types';
import { MoocletExperimentService } from './MoocletExperimentService';

export interface IRewardResponse {
  message: string;
  request: RewardValidator;
  reward: MoocletValueRequestBody;
}

@Service()
export class MoocletRewardsService {
  constructor(
    @InjectRepository()
    private moocletExperimentRefRepository: MoocletExperimentRefRepository,
    @InjectRepository()
    private individualEnrollmentRepository: IndividualEnrollmentRepository,
    private moocletDataService: MoocletDataService,
    private moocletExperimentService: MoocletExperimentService
  ) {}

  /**
   * Attempt to send a reward to the external mooclet API.
   * This is intended to be a "fire-and-forget" operation; we do not wait for
   * confirmation that the reward was received successfully.
   *
   * Several criteria must be met to validate that a reward can be sent:
   *
   * 1. Mooclets feature must be currently enabled
   *
   * 2. The unique experiment must be ascertained before sending a reward.
   * `experimentId` is preferred, but if not provided, `context`, `site`, and `target` can
   * be used to identify the experiment.
   *
   * 3. A complete synced Mooclet experiment reference must exist.
   *
   * 4. The user must have marked and have a unique enrollment.
   *
   * 5. The condition enrolled must match a `version` in the mooclet experiment ref.
   *
   * - If any of these criteria are not met, a 409 data-conflict error is thrown.
   */
  public async sendReward(
    user: RequestedExperimentUser,
    request: RewardValidator,
    logger: UpgradeLogger
  ): Promise<IRewardResponse> {
    const { experimentId, context, decisionPoint, rewardValue } = request;

    try {
      // Find the mooclet experiment ref by ID or decision point
      const moocletExperimentRef = experimentId
        ? await this.findMoocletExperimentRefById(experimentId, request, logger)
        : await this.findMoocletExperimentRefByDecisionPoint(context, decisionPoint, request, logger);

      // Find user's enrollment
      const enrollments = await this.individualEnrollmentRepository.findEnrollments(user.id, [
        moocletExperimentRef.experimentId,
      ]);

      if (!enrollments.length || enrollments.length > 1) {
        this.throwConflictError(
          `Could not find unique user enrollment for experiment (userId: ${user.id}, enrollments: ${enrollments}), no reward sent.`,
          request,
          logger
        );
      }

      // Get version ID for the user's condition
      const enrollment = enrollments[0];
      const versionId = this.getVersionIdByConditionId(enrollment, moocletExperimentRef, request, logger);

      if (!versionId) {
        this.throwConflictError(
          `Could not find version id for user enrollment (userId: ${user.id}, experimentId: ${moocletExperimentRef.experimentId}, conditionId: ${enrollment.conditionId}).`,
          request,
          logger
        );
      }

      // Prepare and send reward
      const reward: MoocletValueRequestBody = {
        variable: moocletExperimentRef.outcomeVariableName,
        value: BinaryRewardValueMap[rewardValue],
        mooclet: moocletExperimentRef.moocletId,
        version: versionId,
        learner: user.id,
      };

      logger.info({ message: 'Sending reward to mooclet', reward, user });

      // Fire-and-forget operation
      // NOTE: in the future we may want to batch these, the mooclet API technically supports it by adding "/create_many" to an endpoint but it's not documented
      this.moocletDataService.postNewReward(reward, logger);

      return { message: `Reward sent to mooclet successfully.`, request, reward };
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }

      // Log and wrap unexpected errors
      this.throwConflictError(
        `Failed to process reward request due to unexpected error (userId: ${user.id}, experimentId: ${
          experimentId || 'not provided'
        }, rewardValue: ${rewardValue}).`,
        request,
        logger
      );
    }
  }

  /**
   * Finds mooclet experiment ref by experiment ID
   */
  private async findMoocletExperimentRefById(
    experimentId: string,
    request: RewardValidator,
    logger: UpgradeLogger
  ): Promise<MoocletExperimentRef> {
    const moocletExperimentRef = await this.moocletExperimentRefRepository.findOne({
      where: { experimentId },
      relations: ['versionConditionMaps', 'versionConditionMaps.experimentCondition', 'experiment'],
    });

    if (!moocletExperimentRef) {
      this.throwConflictError(
        `No active mooclet experiment ref found for experiment id: ${experimentId}, could not send reward.`,
        request,
        logger
      );
    }

    if (moocletExperimentRef.experiment.state !== EXPERIMENT_STATE.ENROLLING) {
      this.throwConflictError(
        `Experiment with id: ${experimentId} is not actively enrolling (current state: ${moocletExperimentRef.experiment.state}), could not send reward.`,
        request,
        logger
      );
    }

    return moocletExperimentRef;
  }

  /**
   * Finds mooclet experiment ref by decision point
   */
  private async findMoocletExperimentRefByDecisionPoint(
    context: string,
    decisionPoint: { site: string; target: string },
    request: RewardValidator,
    logger: UpgradeLogger
  ): Promise<MoocletExperimentRef> {
    const { site, target } = decisionPoint;
    const moocletExperimentRefs =
      await this.moocletExperimentRefRepository.findActivelyEnrollingMoocletExperimentsByContextSiteTarget(
        context,
        site,
        target
      );

    if (moocletExperimentRefs.length === 0) {
      this.throwConflictError(
        `No active experiment found for decision point (context: ${context}, site: ${site}, target: ${target}), could not send reward.`,
        request,
        logger
      );
    }

    // TODO: this is a spot where we want to use shared-decision-point pooling logic,
    // but for now if there are competing experiments, it will be required to use experimentId
    if (moocletExperimentRefs.length > 1) {
      this.throwConflictError(
        `Multiple active experiments found for decision point (context: ${context}, site: ${site}, target: ${target}), cannot determine which to send reward to.`,
        request,
        logger
      );
    }

    return moocletExperimentRefs[0];
  }

  private getVersionIdByConditionId(
    enrollment: IndividualEnrollment,
    moocletExperimentRef: MoocletExperimentRef,
    request: RewardValidator,
    logger: UpgradeLogger
  ): number | null {
    const map = moocletExperimentRef.versionConditionMaps.find(
      (map) => enrollment.conditionId === map.experimentConditionId
    );
    if (!map) {
      this.throwConflictError(`Version-condition mapping not found, no reward sent.`, request, logger);
    }
    return map.moocletVersionId;
  }

  public async getRewardsSummaryForExperiment(
    experimentId: string,
    logger: UpgradeLogger
  ): Promise<ExperimentRewardsSummary> {
    try {
      const moocletExperimentRef = await this.moocletExperimentService.getMoocletExperimentRefByUpgradeExperimentId(
        experimentId
      );
      const rewards: MoocletValueResponseDetails[] = [];
      logger.info({
        message: `Fetching Rewards data from mooclet server.`,
        experimentId,
      });
      let response = await this.fetchRewardsForExperiment(moocletExperimentRef, logger);
      if (Array.isArray(response.results)) {
        rewards.push(...response.results);
      }

      while (response.next) {
        logger.info({
          message: `But wait there's more (Fetching more Rewards data from Mooclet server for experiment...)`,
          totalFound: response.count,
          totalFetched: response.results.length,
          next: response.next,
        });
        response = await this.fetchRewardsForExperiment(moocletExperimentRef, logger, response.next);
        if (Array.isArray(response.results)) {
          rewards.push(...response.results);
        }
      }

      let tsConfigurableParams: MoocletTSConfigurablePolicyParametersDTO | undefined;
      if (moocletExperimentRef.policyParametersId) {
        try {
          const policyParametersResponse = await this.moocletDataService.getPolicyParameters(
            moocletExperimentRef.policyParametersId,
            logger
          );
          tsConfigurableParams = policyParametersResponse.parameters as MoocletTSConfigurablePolicyParametersDTO;
        } catch (policyError) {
          logger.warn({
            message: 'Could not fetch policy parameters for Thompson sampling estimate',
            experimentId,
            error: policyError,
          });
        }
      }

      return this.createExperimentRewardsSummary(moocletExperimentRef, rewards, logger, tsConfigurableParams);
    } catch (error) {
      logger.error({ message: 'Error fetching rewards summary for experiment', experimentId, error });
      throw error;
    }
  }

  public async fetchRewardsForExperiment(
    moocletExperimentRef: MoocletExperimentRef,
    logger: UpgradeLogger,
    nextPageUrl?: string
  ): Promise<MoocletPaginatedResponse<MoocletValueResponseDetails>> {
    const requestBody: MoocletRewardCountRequestBody = {
      moocletId: moocletExperimentRef.moocletId,
      variableName: moocletExperimentRef.outcomeVariableName,
    };

    return await this.moocletDataService.getRewardsForExperiment(requestBody, logger, nextPageUrl);
  }

  public async createExperimentRewardsSummary(
    moocletExperimentRef: MoocletExperimentRef,
    rewardsData: MoocletValueResponseDetails[],
    logger: UpgradeLogger,
    policyParameters?: MoocletTSConfigurablePolicyParametersDTO
  ): Promise<ExperimentRewardsSummary> {
    const rewards: MoocletValueResponseDetails[] = rewardsData;

    if (!rewardsData) {
      logger.warn({
        message: 'No rewards data returned from Mooclet API',
        experimentId: moocletExperimentRef.experimentId,
      });
      return [];
    }

    const versionConditionPairs = moocletExperimentRef.versionConditionMaps.map(
      ({ experimentCondition, moocletVersionId }) => ({
        conditionCode: experimentCondition.conditionCode,
        moocletVersionId,
      })
    );
    const DEFAULT_PRIOR: Prior = { success: 1, failure: 1 };
    const estimatedWeightMap = policyParameters
      ? this.computeThompsonWeightsMap(versionConditionPairs, policyParameters)
      : null;

    const rewardsSummaries = moocletExperimentRef.versionConditionMaps.map(
      ({ experimentCondition, moocletVersionId }) => {
        const conditionCode = experimentCondition.conditionCode;
        const versionIdKey = String(moocletVersionId);
        const versionRewards = rewards.filter((reward) => reward.version === moocletVersionId);
        const successes = versionRewards.filter((reward) => reward.value === 1.0).length;
        const failures = versionRewards.filter((reward) => reward.value === 0.0).length;
        const total = successes + failures;
        const percentSuccess = total > 0 ? (successes / total) * 100 : 0.0;
        const successRate = percentSuccess.toFixed(1) + '%';

        const conditionPrior: Prior = policyParameters?.prior?.[versionIdKey] ?? DEFAULT_PRIOR;
        const conditionPosteriors = policyParameters?.current_posteriors?.[versionIdKey];

        const rewardsForCondition: ExperimentRewardsByCondition = {
          conditionCode,
          successes,
          failures,
          successRate,
          order: experimentCondition.order,
          estimatedWeight: estimatedWeightMap?.get(conditionCode),
          priorSuccess: conditionPrior.success,
          priorFailure: conditionPrior.failure,
          posteriorSuccesses: conditionPosteriors?.successes ?? 0,
          posteriorFailures: conditionPosteriors?.failures ?? 0,
        };
        return rewardsForCondition;
      }
    );

    const orderedRewardsSummary = rewardsSummaries.sort((a, b) => a.order - b.order);
    return orderedRewardsSummary;
  }

  /**
   * Computes Thompson Sampling estimated weight percentages per condition.
   * Combines per-condition priors with current_posteriors as Beta distribution inputs.
   * Returns a Map of conditionCode → integer estimated weight (all values sum to 100).
   */
  private computeThompsonWeightsMap(
    versionConditionPairs: { conditionCode: string; moocletVersionId: number }[],
    params: MoocletTSConfigurablePolicyParametersDTO
  ): Map<string, number> {
    const DEFAULT_PRIOR: Prior = { success: 1, failure: 1 };

    const arms = versionConditionPairs.map(({ conditionCode, moocletVersionId }) => {
      const versionIdKey = String(moocletVersionId);
      const posteriors = params.current_posteriors?.[versionIdKey];
      return {
        conditionCode,
        alpha: posteriors?.successes ?? DEFAULT_PRIOR.success,
        beta: posteriors?.failures ?? DEFAULT_PRIOR.failure,
      };
    });

    const iterations = 10_000;
    const wins = new Array(arms.length).fill(0);
    for (let i = 0; i < iterations; i++) {
      let maxSample = -1;
      let maxIdx = 0;
      for (let j = 0; j < arms.length; j++) {
        const sample = this.randBeta(arms[j].alpha, arms[j].beta);
        if (sample > maxSample) {
          maxSample = sample;
          maxIdx = j;
        }
      }
      wins[maxIdx]++;
    }

    // Largest Remainder Method: normalize to integer percentages summing to exactly 100
    const raw = arms.map((_, i) => (wins[i] / iterations) * 100);
    const floored = raw.map(Math.floor);
    const remainder = 100 - floored.reduce((a, b) => a + b, 0);
    const indices = raw
      .map((v, i) => ({ diff: v - floored[i], i }))
      .sort((a, b) => b.diff - a.diff)
      .map(({ i }) => i);
    for (let k = 0; k < remainder; k++) floored[indices[k]]++;

    return new Map(arms.map((arm, i) => [arm.conditionCode, floored[i]]));
  }

  // --- Beta distribution sampling (Marsaglia-Tsang / Box-Muller) ---

  private randNormal(): number {
    const u = Math.random() || Number.EPSILON; // guard against log(0)
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * Math.random());
  }

  private randGamma(shape: number): number {
    if (shape < 1) {
      return this.randGamma(1 + shape) * Math.pow(Math.random(), 1 / shape);
    }
    const d = shape - 1 / 3;
    const c = 1 / Math.sqrt(9 * d);
    let x: number;
    let v: number;
    let u: number;
    do {
      do {
        x = this.randNormal();
        v = 1 + c * x;
      } while (v <= 0);
      v = v * v * v;
      u = Math.random();
      // eslint-disable-next-line no-constant-condition
    } while (!(u < 1 - 0.0331 * x * x * x * x) && !(Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))));
    return d * v;
  }

  private randBeta(alpha: number, beta: number): number {
    const g1 = this.randGamma(alpha);
    const g2 = this.randGamma(beta);
    return g1 / (g1 + g2);
  }

  /**
   * Throws a 409 data-conflict error for most unexpected cases
   */
  private throwConflictError(message: string, request: RewardValidator, logger: UpgradeLogger): never {
    logger.error({ message, request });

    const error = new HttpError(409, message);
    (error as any).type = SERVER_ERROR.MOOCLET_REWARD_ERROR;
    throw error;
  }
}
