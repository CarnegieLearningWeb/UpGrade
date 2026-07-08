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

      // Increment counts atomically; successCount only increments on success
      await this.posteriorStateRepository.increment({ id: state.id }, 'totalCount', 1);
      if (success) {
        await this.posteriorStateRepository.increment({ id: state.id }, 'successCount', 1);
      }

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

  private async findConfigById(
    experimentId: string,
    request: RewardValidator,
    logger: UpgradeLogger
  ): Promise<ThompsonSamplingExperimentConfig> {
    const config = await this.tsConfigRepository.findOne({
      where: { experimentId },
      relations: ['experiment'],
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
