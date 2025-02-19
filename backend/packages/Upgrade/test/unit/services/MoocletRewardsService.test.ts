import { MoocletExperimentRef } from 'src/api/models/MoocletExperimentRef';
import { BinaryRewardMetricAllowedValue } from '../../../../../../types/src/Mooclet';
import { IndividualEnrollment } from '../../../src/api/models/IndividualEnrollment';
import { IndividualEnrollmentRepository } from '../../../src/api/repositories/IndividualEnrollmentRepository';
import { MoocletExperimentRefRepository } from '../../../src/api/repositories/MoocletExperimentRefRepository';
import { MetricService } from '../../../src/api/services/MetricService';
import { MoocletDataService } from '../../../src/api/services/MoocletDataService';
import { MoocletRewardsService } from '../../../src/api/services/MoocletRewardsService';
import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';
import { IMetricMetaData } from 'upgrade_types';

// Mock dependencies
jest.mock('../../../src/lib/logger/UpgradeLogger');
jest.mock('../../../src/api/services/MetricService');
jest.mock('../../../src/api/services/MoocletDataService');

describe('MoocletRewardsService', () => {
  let service: MoocletRewardsService;
  let mockLogger: jest.Mocked<UpgradeLogger>;
  let mockMetricService: jest.Mocked<MetricService>;
  let mockMoocletDataService: jest.Mocked<MoocletDataService>;
  let mockMoocletExperimentRefRepository: jest.Mocked<MoocletExperimentRefRepository>;
  let mockIndividualEnrollmentRepository: jest.Mocked<IndividualEnrollmentRepository>;

  beforeEach(() => {
    mockLogger = new UpgradeLogger() as jest.Mocked<UpgradeLogger>;
    mockMetricService = {
      saveAllMetrics: jest.fn(),
    } as any;
    mockMoocletDataService = {
      postNewReward: jest.fn(),
    } as any;
    mockMoocletExperimentRefRepository = {
      getRefsForActivelyEnrollingExperiments: jest.fn(),
    } as any;
    mockIndividualEnrollmentRepository = {
      findEnrollments: jest.fn(),
    } as any;

    service = new MoocletRewardsService(
      mockMoocletExperimentRefRepository,
      mockIndividualEnrollmentRepository,
      mockMetricService,
      mockMoocletDataService
    );
  });

  describe('attachRewardMetricQuery', () => {
    it('should attach a reward metric query with correct parameters', () => {
      const queries: any[] = [];
      const rewardMetricKey = 'test-metric';

      service.attachRewardMetricQuery(rewardMetricKey, queries);

      expect(queries).toHaveLength(1);
      expect(queries[0]).toMatchObject({
        name: 'Success Rate',
        query: {
          operationType: 'percentage',
          compareFn: '=',
          compareValue: BinaryRewardMetricAllowedValue.SUCCESS,
        },
        metric: {
          key: rewardMetricKey,
        },
      });
    });
  });

  describe('createAndSaveRewardMetric', () => {
    it('should create and save a reward metric with correct parameters', async () => {
      const rewardMetricKey = 'test-metric';
      const context = 'test-context';

      mockMetricService.saveAllMetrics.mockResolvedValue([]);

      await service.createAndSaveRewardMetric(rewardMetricKey, context, mockLogger);

      expect(mockMetricService.saveAllMetrics).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            metric: rewardMetricKey,
            datatype: IMetricMetaData.CATEGORICAL,
            allowedValues: [BinaryRewardMetricAllowedValue.SUCCESS, BinaryRewardMetricAllowedValue.FAILURE],
          }),
        ]),
        [context],
        mockLogger
      );
    });
  });

  describe('parseLogsForActiveRewardMetricKey', () => {
    const mockUser = { id: 'user-1' } as any;
    const mockLogs = [
      {
        metrics: {
          attributes: {
            nothing: 5,
            'test-metric': 'SUCCESS',
          },
        },
      },
    ] as any;

    it('should successfully process logs and search for reward metrics', async () => {
      const mockMoocletExperimentRefList = [
        {
          id: 'ref-1',
          experimentId: 'exp-1',
          moocletId: 1,
          outcomeVariableName: 'outcome-1',
          rewardMetricKey: 'test-metric-1',
          versionConditionMaps: [
            {
              experimentConditionId: 'condition-1',
              moocletVersionId: 1,
            },
          ],
        } as MoocletExperimentRef,
      ];
      mockMoocletExperimentRefRepository.getRefsForActivelyEnrollingExperiments.mockResolvedValue(
        mockMoocletExperimentRefList
      );

      // Act
      await service.parseLogsForActiveRewardMetricKey(mockUser, mockLogs, mockLogger);

      // Assert
      // Verify that repository was called to get active experiments
      expect(mockMoocletExperimentRefRepository.getRefsForActivelyEnrollingExperiments).toHaveBeenCalledTimes(1);

      // Verify no errors were logged
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should handle case when no active mooclet experiment refs exist', async () => {
      mockMoocletExperimentRefRepository.getRefsForActivelyEnrollingExperiments.mockResolvedValue([]);

      await service.parseLogsForActiveRewardMetricKey(mockUser, mockLogs, mockLogger);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'No active mooclet experiment refs found',
          user: mockUser,
        })
      );
    });

    it('should handle errors when fetching active mooclet refs', async () => {
      const error = new Error('Database error');
      mockMoocletExperimentRefRepository.getRefsForActivelyEnrollingExperiments.mockRejectedValue(error);

      await service.parseLogsForActiveRewardMetricKey(mockUser, mockLogs, mockLogger);

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Failed to fetch active mooclet refs ',
          error,
        })
      );
    });
  });

  describe('findEnrolledCondition', () => {
    it('should return null when multiple enrollments are found', async () => {
      const userId = 'user-1';
      const experimentId = 'exp-1';
      const mockEnrollments = [{ id: 'enrollment-1' }, { id: 'enrollment-2' }];

      mockIndividualEnrollmentRepository.findEnrollments.mockResolvedValue(mockEnrollments as IndividualEnrollment[]);

      const result = await (service as any).findEnrolledCondition(userId, experimentId, mockLogger);

      expect(result).toBeNull();
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Found multiple enrollments for experiment, reward cannot be determined.',
          enrollments: mockEnrollments,
        })
      );
    });

    it('should handle repository errors gracefully', async () => {
      const userId = 'user-1';
      const experimentId = 'exp-1';
      const error = new Error('Database error');

      mockIndividualEnrollmentRepository.findEnrollments.mockRejectedValue(error);

      const result = await (service as any).findEnrolledCondition(userId, experimentId, mockLogger);

      expect(result).toBeNull();
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Failed to find user enrollments for experiment.',
          error,
          userId,
          experimentId,
        })
      );
    });
  });
});
