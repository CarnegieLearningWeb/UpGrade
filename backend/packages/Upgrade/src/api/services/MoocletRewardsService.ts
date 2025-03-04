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
import { Service } from 'typedi';
import { InjectRepository } from '../../typeorm-typedi-extensions';

import { QueryValidator } from '../DTO/ExperimentDTO';
import { BinaryRewardMetricAllowedValue, BinaryRewardMetricValueMap } from 'upgrade_types';

export interface ValidRewardMetricType {
  key: string;
  value: BinaryRewardMetricAllowedValue;
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

  public getRewardMetricQuery(rewardMetricKey: string): QueryValidator {
    return {
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
    };
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

  public async parseLogsAndSendPotentialRewards(
    user: RequestedExperimentUser,
    logs: ILogInput[],
    logger: UpgradeLogger
  ): Promise<void> {
    // First see if any simple metrics have valid reward values
    const validSimpleMetricAttributes = this.gatherValidRewardMetrics(logs);

    if (!validSimpleMetricAttributes.length) {
      // no need to log anything here, just quit early as this is the most common case
      return;
    }

    try {
      // If we have valid metric rewards, only then check for active mooclet experiment refs
      const moocletExperimentRefs = await this.getAllActiveMoocletExperimentRefs(logger);

      if (!moocletExperimentRefs.length) {
        logger.warn({
          message: 'No active mooclet experiment refs found',
          user,
        });
        return;
      }

      // Find each experiment match by reward metric key
      const experimentsMatchingLoggedRewardKey = this.findExperimentByRewardMetricKey(
        moocletExperimentRefs,
        validSimpleMetricAttributes
      );

      if (!experimentsMatchingLoggedRewardKey.length) {
        logger.warn({
          message: 'Reward metrics were logged, but no active experiments matched the rewardMetricKeys',
          moocletExperimentRefs,
          validSimpleMetricAttributes,
        });
        return;
      }

      const experimentIds = experimentsMatchingLoggedRewardKey.map((pair) => pair.moocletExperimentRef.experimentId);
      const enrollments = await this.individualEnrollmentRepository.findEnrollments(user.id, experimentIds);

      // For each match, find the user's condition, map to version id, and create reward object
      await Promise.all(
        experimentsMatchingLoggedRewardKey.map(async ({ moocletExperimentRef, rewardMetricValue }) => {
          const enrollment = enrollments.find(
            (enrollment) => enrollment.experiment.id === moocletExperimentRef.experimentId
          );

          // not sure if this even possible in reality, but should be handled
          if (!enrollment) {
            logger.error({
              message: 'Could not find user enrollment for experiment.',
              user,
              moocletExperimentRef,
            });
            return;
          }

          const versionId = this.getVersionIdByConditionId(enrollment, moocletExperimentRef, logger);

          if (!versionId) {
            logger.error({
              message: 'Could not find version id for user enrollment.',
              enrollment,
              moocletExperimentRef,
            });
            return;
          }

          const reward = {
            variable: moocletExperimentRef.outcomeVariableName,
            value: BinaryRewardMetricValueMap[rewardMetricValue],
            mooclet: moocletExperimentRef.moocletId,
            version: versionId,
          };
          logger.info({
            message: 'Sending reward to mooclet',
            reward,
            user,
          });
          // NOTE: in the future we may want to batch these, the mooclet API technically supports it by adding "/create_many" to an endpoint but it's not documented
          await this.moocletDataService.postNewReward(reward, logger);
        })
      );
    } catch (error) {
      logger.error({
        message: 'Failure processing and sending rewards',
        error,
        logs,
      });
    }
  }

  private async getAllActiveMoocletExperimentRefs(logger: UpgradeLogger): Promise<MoocletExperimentRef[]> {
    // cache this? would be complex to invalidate, and our TTL is usually in the order of seconds...
    try {
      return this.moocletExperimentRefRepository.getRefsForActivelyEnrollingExperiments();
    } catch (error) {
      logger.error({ message: 'Failed to fetch active mooclet refs ', error });
      return Promise.resolve([]);
    }
  }

  private gatherValidRewardMetrics(logs: ILogInput[]): ValidRewardMetricType[] {
    return logs.reduce((acc, log) => {
      const simpleMetrics = log.metrics.attributes;

      for (const key in simpleMetrics) {
        if (this.isBinaryRewardMetricAllowedValue(simpleMetrics[key])) {
          acc.push({ key, value: simpleMetrics[key] });
        }
      }

      return acc;
    }, [] as ValidRewardMetricType[]);
  }

  // type guard to allow for type checking of binary reward metric value
  private isBinaryRewardMetricAllowedValue(value: any): value is BinaryRewardMetricAllowedValue {
    return Object.values(BinaryRewardMetricAllowedValue).includes(value);
  }

  private findExperimentByRewardMetricKey(
    moocletExperimentRefs: MoocletExperimentRef[],
    rewardMetricKeys: ValidRewardMetricType[]
  ): { moocletExperimentRef: MoocletExperimentRef; rewardMetricValue: BinaryRewardMetricAllowedValue }[] {
    const moocletExperimentRefMatches = [];

    for (const rewardMetric of rewardMetricKeys) {
      const matchedMoocletRef = moocletExperimentRefs.find((ref) => ref.rewardMetricKey === rewardMetric.key);

      if (matchedMoocletRef) {
        moocletExperimentRefMatches.push({
          moocletExperimentRef: matchedMoocletRef,
          rewardMetricValue: rewardMetric.value,
        });
      }
    }

    return moocletExperimentRefMatches;
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
}
