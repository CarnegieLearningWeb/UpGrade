import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';
import { REPEATED_MEASURE, IMetricMetaData, ILogInput } from 'upgrade_types';
import { RequestedExperimentUser } from '../controllers/validators/ExperimentUserValidator';
import { Metric } from '../models/Metric';
import { MoocletExperimentRef } from '../models/MoocletExperimentRef';
import { v4 as uuid } from 'uuid';
import { MetricService } from './MetricService';
import { MoocletDataService } from './MoocletDataService';
import { MoocletExperimentRefRepository } from '../repositories/MoocletExperimentRefRepository';
import { IndividualEnrollment } from '../models/IndividualEnrollment';
import { IndividualEnrollmentRepository } from '../repositories/IndividualEnrollmentRepository';
import { MoocletValueRequestBody } from '../../../src/types/Mooclet';
import { Service } from 'typedi';
import { InjectRepository } from '../../typeorm-typedi-extensions';
import { BinaryRewardMetricAllowedValue, BinaryRewardMetricValueMap } from '../../../../../../types/src/Mooclet';

interface FindRewardParams {
  user: RequestedExperimentUser;
  moocletExperimentRefs: MoocletExperimentRef[];
  logger: UpgradeLogger;
}

interface SyncRewardParams {
  moocletExperimentRef: MoocletExperimentRef;
  metricValue: string | number;
  logger: UpgradeLogger;
}

@Service()
export class MoocletRewardsService {
  constructor(
    @InjectRepository()
    private moocletExperimentRefRepository: MoocletExperimentRefRepository,
    @InjectRepository()
    private individualEnrollmentRepository: IndividualEnrollmentRepository,
    private metricService: MetricService,
    private moocletDataService: MoocletDataService
  ) {}

  public attachRewardMetricQuery(rewardMetricKey: string, queries: any[]) {
    queries.push({
      id: uuid(),
      name: 'Success Rate',
      query: {
        operationType: 'percentage',
        compareFn: '=',
        compareValue: BinaryRewardMetricAllowedValue.SUCCESS,
      },
      metric: {
        key: rewardMetricKey,
      },
      repeatedMeasure: REPEATED_MEASURE.mostRecent,
    });
  }

  public async createAndSaveRewardMetric(
    rewardMetricKey: string,
    context: string,
    logger: UpgradeLogger
  ): Promise<Metric[]> {
    const metric = {
      id: uuid(),
      metric: rewardMetricKey,
      datatype: IMetricMetaData.CATEGORICAL,
      allowedValues: [BinaryRewardMetricAllowedValue.SUCCESS, BinaryRewardMetricAllowedValue.FAILURE],
    };

    return this.metricService.saveAllMetrics([metric], [context], logger);
  }

  public async parseLogsForActiveRewardMetricKey(
    user: RequestedExperimentUser,
    logs: ILogInput[],
    logger: UpgradeLogger
  ): Promise<void> {
    try {
      const moocletExperimentRefs = await this.moocletExperimentRefRepository.getRefsForActivelyEnrollingExperiments();

      if (!moocletExperimentRefs.length) {
        logger.info({
          message: 'No active mooclet experiment refs found',
          user,
        });
        return;
      }

      const searchParams: FindRewardParams = { user, moocletExperimentRefs, logger };

      this.searchLogAttributes(logs, searchParams);
    } catch (error) {
      logger.error({ message: 'Failed to fetch active mooclet refs ', error });
    }
  }

  private searchLogAttributes(logs: ILogInput[], params: FindRewardParams): void {
    logs.forEach((log) => {
      const {
        metrics: { attributes },
      } = log;

      const attributesKeys = Object.keys(attributes);
      for (const key of attributesKeys) {
        this.findExperimentByRewardMetricKey(key, attributes[key], params);
      }
    });
  }

  private findExperimentByRewardMetricKey(key: string, value: string | number, searchParams: FindRewardParams): void {
    const { moocletExperimentRefs, user, logger } = searchParams;

    const moocletExperimentRef = moocletExperimentRefs.find((ref) => ref.rewardMetricKey === key);
    if (!moocletExperimentRef) return;

    logger.info({
      message: 'Reward metric key matched in experiment, will send reward if condition determined',
      key,
      value,
      moocletExperimentRef,
    });

    const syncRewardParams: SyncRewardParams = {
      moocletExperimentRef,
      metricValue: value,
      logger,
    };

    this.determineVersionForReward(user.id, syncRewardParams);
  }

  private async determineVersionForReward(userId: string, params: SyncRewardParams): Promise<void> {
    const enrollment = await this.findEnrolledCondition(
      userId,
      params.moocletExperimentRef.experimentId,
      params.logger
    );
    if (!enrollment) return;

    const versionId = this.getVersionIdByConditionId(enrollment, params.moocletExperimentRef, params.logger);
    if (!versionId) return;

    this.sendReward(versionId, params);
  }

  private async findEnrolledCondition(
    userId: string,
    experimentId: string,
    logger: UpgradeLogger
  ): Promise<IndividualEnrollment | null> {
    try {
      const enrollments = await this.individualEnrollmentRepository.findEnrollments(userId, [experimentId]);

      if (enrollments.length > 1) {
        logger.error({
          message: 'Found multiple enrollments for experiment, reward cannot be determined.',
          enrollments,
        });
        return null;
      }
      return enrollments[0];
    } catch (error) {
      logger.error({
        message: 'Failed to find user enrollments for experiment.',
        error,
        userId,
        experimentId,
      });
      return null;
    }
  }

  private getVersionIdByConditionId(
    enrollment: IndividualEnrollment,
    moocletExperimentRef: MoocletExperimentRef,
    logger: UpgradeLogger
  ): number | null {
    const map = moocletExperimentRef.versionConditionMaps.find(
      (map) => enrollment.condition?.id === map.experimentConditionId
    );
    if (!map) {
      logger.error({
        message: 'Could not find a version for the user enrollment.',
        versionConditionMaps: moocletExperimentRef.versionConditionMaps,
      });
      return null;
    }
    return map.moocletVersionId;
  }

  private sendReward(versionId: number, params: SyncRewardParams): void {
    const request: MoocletValueRequestBody = {
      variable: params.moocletExperimentRef.outcomeVariableName,
      value: BinaryRewardMetricValueMap[params.metricValue],
      mooclet: params.moocletExperimentRef.moocletId,
      version: versionId,
    };

    // Fire and forget the reward posting
    try {
      this.moocletDataService.postNewReward(request, params.logger);
    } catch (error) {
      params.logger.error({
        message: 'Failed to send reward to mooclet',
        error,
      });
    }
  }
}
