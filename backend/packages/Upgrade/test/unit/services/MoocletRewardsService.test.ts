import { MoocletExperimentRef } from 'src/api/models/MoocletExperimentRef';
import { BinaryRewardMetricAllowedValue, BinaryRewardMetricValueMap } from '../../../../../../types/src/Mooclet';
import { IndividualEnrollment } from '../../../src/api/models/IndividualEnrollment';
import { IndividualEnrollmentRepository } from '../../../src/api/repositories/IndividualEnrollmentRepository';
import { MoocletExperimentRefRepository } from '../../../src/api/repositories/MoocletExperimentRefRepository';
import { MetricService } from '../../../src/api/services/MetricService';
import { MoocletDataService } from '../../../src/api/services/MoocletDataService';
import { MoocletRewardsService, ValidRewardMetricType } from '../../../src/api/services/MoocletRewardsService';
import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';
import { ILogInput, IMetricMetaData } from 'upgrade_types';
import { RequestedExperimentUser } from '../../../src/api/controllers/validators/ExperimentUserValidator';

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

  describe('#getRewardMetricQuery', () => {
    it('should attach a reward metric query with correct parameters', () => {
      const rewardMetricKey = 'test-metric';

      const query = service.getRewardMetricQuery(rewardMetricKey);

      expect(query).toMatchObject({
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

  describe('#createAndSaveRewardMetric', () => {
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

  describe('#parseLogsAndSendPotentialRewards', () => {
    const mockUser = { id: 'user-1' } as RequestedExperimentUser;
    const mockLogs = [
      {
        metrics: {
          attributes: {
            'test-metric-1': BinaryRewardMetricAllowedValue.SUCCESS,
            'test-metric-2': BinaryRewardMetricAllowedValue.FAILURE,
          },
        },
      },
    ] as unknown as ILogInput[];

    beforeEach(() => {
      // Reset all mocks before each test
      jest.clearAllMocks();
    });

    it('should exit early when no valid reward metrics are found', async () => {
      // Mock gatherValidRewardMetrics to return empty array
      (service as any).gatherValidRewardMetrics = jest.fn().mockReturnValue([]);

      // Act
      await service.parseLogsAndSendPotentialRewards(mockUser, mockLogs, mockLogger);

      // Assert
      expect((service as any).gatherValidRewardMetrics).toHaveBeenCalledWith(mockLogs);
      expect(mockMoocletExperimentRefRepository.getRefsForActivelyEnrollingExperiments).not.toHaveBeenCalled();
      expect(mockLogger.warn).not.toHaveBeenCalled();
    });

    it('should warn and exit when no active mooclet experiment refs are found', async () => {
      // Mock required dependencies
      (service as any).gatherValidRewardMetrics = jest
        .fn()
        .mockReturnValue([{ key: 'test-metric-1', value: BinaryRewardMetricAllowedValue.SUCCESS }]);
      (service as any).getAllActiveMoocletExperimentRefs = jest.fn().mockResolvedValue([]);

      // Act
      await service.parseLogsAndSendPotentialRewards(mockUser, mockLogs, mockLogger);

      // Assert
      expect((service as any).gatherValidRewardMetrics).toHaveBeenCalledWith(mockLogs);
      expect((service as any).getAllActiveMoocletExperimentRefs).toHaveBeenCalledWith(mockLogger);
      expect(mockLogger.warn).toHaveBeenCalledWith({
        message: 'No active mooclet experiment refs found',
        user: mockUser,
      });
    });

    it('should warn and exit when no experiments match the logged reward keys', async () => {
      // Mock required dependencies
      const validMetrics = [{ key: 'test-metric-1', value: BinaryRewardMetricAllowedValue.SUCCESS }];
      const activeRefs = [{ id: 'ref-1', rewardMetricKey: 'different-key' }] as MoocletExperimentRef[];

      (service as any).gatherValidRewardMetrics = jest.fn().mockReturnValue(validMetrics);
      (service as any).getAllActiveMoocletExperimentRefs = jest.fn().mockResolvedValue(activeRefs);
      (service as any).findExperimentByRewardMetricKey = jest.fn().mockReturnValue([]);

      // Act
      await service.parseLogsAndSendPotentialRewards(mockUser, mockLogs, mockLogger);

      // Assert
      expect((service as any).findExperimentByRewardMetricKey).toHaveBeenCalledWith(activeRefs, validMetrics);
      expect(mockLogger.warn).toHaveBeenCalledWith({
        message: 'Reward metrics were logged, but no active experiments matched the rewardMetricKeys',
        moocletExperimentRefs: activeRefs,
        validSimpleMetricAttributes: validMetrics,
      });
    });

    it('should process rewards when all conditions are met', async () => {
      // Mock data
      const validMetrics = [{ key: 'test-metric-1', value: BinaryRewardMetricAllowedValue.SUCCESS }];

      const moocletRef = {
        id: 'ref-1',
        experimentId: 'exp-1',
        moocletId: 123,
        rewardMetricKey: 'test-metric-1',
        outcomeVariableName: 'outcome-1',
        versionConditionMaps: [{ experimentConditionId: 'condition-1', moocletVersionId: 456 }],
      } as MoocletExperimentRef;

      const activeRefs = [moocletRef];

      const enrollments = [
        {
          id: 'enrollment-1',
          conditionId: 'condition-1',
          experimentId: 'exp-1',
        },
      ] as IndividualEnrollment[];

      // Mock required methods
      (service as any).gatherValidRewardMetrics = jest
        .fn()
        .mockReturnValue(validMetrics)
        .mockName('gatherValidRewardMetrics');
      (service as any).getAllActiveMoocletExperimentRefs = jest
        .fn()
        .mockResolvedValue(activeRefs)
        .mockName('getAllActiveMoocletExperimentRefs');
      (service as any).findExperimentByRewardMetricKey = jest
        .fn()
        .mockReturnValue([
          { moocletExperimentRef: moocletRef, rewardMetricValue: BinaryRewardMetricAllowedValue.SUCCESS },
        ])
        .mockName('findExperimentByRewardMetricKey');
      (service as any).getVersionIdByConditionId = jest.fn().mockReturnValue(456).mockName('getVersionIdByConditionId');
      mockIndividualEnrollmentRepository.findEnrollments = jest
        .fn()
        .mockResolvedValue(enrollments)
        .mockName('mockIndividualEnrollmentRepository.findEnrollments');

      // Mock the BinaryRewardMetricValueMap
      const mockRewardValue = 1;
      BinaryRewardMetricValueMap[BinaryRewardMetricAllowedValue.SUCCESS] = mockRewardValue;

      // Act
      await service.parseLogsAndSendPotentialRewards(mockUser, mockLogs, mockLogger);

      // Assert
      expect((service as any).getVersionIdByConditionId).toHaveBeenCalledWith(enrollments[0], moocletRef, mockLogger);

      expect(mockLogger.info).toHaveBeenCalledWith({
        message: 'Sending reward to mooclet',
        reward: {
          variable: 'outcome-1',
          value: mockRewardValue,
          mooclet: 123,
          version: 456,
          learner: 'user-1',
        },
        user: mockUser,
      });

      expect(mockMoocletDataService.postNewReward).toHaveBeenCalledWith(
        {
          variable: 'outcome-1',
          value: mockRewardValue,
          mooclet: 123,
          version: 456,
          learner: 'user-1',
        },
        mockLogger
      );
    });

    it('should handle errors during enrollment lookup', async () => {
      // Mock data
      const validMetrics = [{ key: 'test-metric-1', value: BinaryRewardMetricAllowedValue.SUCCESS }];

      const moocletRef = {
        id: 'ref-1',
        experimentId: 'exp-1',
        moocletId: 123,
        rewardMetricKey: 'test-metric-1',
        outcomeVariableName: 'outcome-1',
      } as MoocletExperimentRef;

      // Mock required methods
      (service as any).gatherValidRewardMetrics = jest.fn().mockReturnValue(validMetrics);
      (service as any).getAllActiveMoocletExperimentRefs = jest.fn().mockResolvedValue([moocletRef]);
      (service as any).findExperimentByRewardMetricKey = jest
        .fn()
        .mockReturnValue([
          { moocletExperimentRef: moocletRef, rewardMetricValue: BinaryRewardMetricAllowedValue.SUCCESS },
        ]);
      mockIndividualEnrollmentRepository.findEnrollments = jest
        .fn()
        .mockResolvedValue([])
        .mockName('mockIndividualEnrollmentRepository.findEnrollments');

      // Act
      await service.parseLogsAndSendPotentialRewards(mockUser, mockLogs, mockLogger);

      // Assert
      expect(mockLogger.error).toHaveBeenCalledWith({
        message: 'Could not find user enrollment for experiment.',
        user: mockUser,
        moocletExperimentRef: moocletRef,
      });
      expect(mockMoocletDataService.postNewReward).not.toHaveBeenCalled();
    });

    it('should handle errors during version ID lookup', async () => {
      // Mock data
      const validMetrics = [{ key: 'test-metric-1', value: BinaryRewardMetricAllowedValue.SUCCESS }];

      const moocletRef = {
        id: 'ref-1',
        experimentId: 'exp-1',
        moocletId: 123,
        rewardMetricKey: 'test-metric-1',
        outcomeVariableName: 'outcome-1',
      } as MoocletExperimentRef;

      const enrollments = [
        {
          id: 'enrollment-1',
          conditionId: 'condition-1',
          experimentId: 'exp-1',
        },
      ] as IndividualEnrollment[];

      // Mock required methods
      (service as any).gatherValidRewardMetrics = jest.fn().mockReturnValue(validMetrics);
      (service as any).getAllActiveMoocletExperimentRefs = jest.fn().mockResolvedValue([moocletRef]);
      (service as any).findExperimentByRewardMetricKey = jest
        .fn()
        .mockReturnValue([
          { moocletExperimentRef: moocletRef, rewardMetricValue: BinaryRewardMetricAllowedValue.SUCCESS },
        ]);
      mockIndividualEnrollmentRepository.findEnrollments = jest
        .fn()
        .mockResolvedValue(enrollments)
        .mockName('mockIndividualEnrollmentRepository.findEnrollments');
      (service as any).getVersionIdByConditionId = jest.fn().mockReturnValue(null); // No version ID found

      // Act
      await service.parseLogsAndSendPotentialRewards(mockUser, mockLogs, mockLogger);

      // Assert
      expect(mockLogger.error).toHaveBeenCalledWith({
        message: 'Could not find version id for user enrollment.',
        enrollment: enrollments[0],
        moocletExperimentRef: moocletRef,
      });
      expect(mockMoocletDataService.postNewReward).not.toHaveBeenCalled();
    });

    it('should handle unexpected errors during processing', async () => {
      // Mock an unexpected error
      const error = new Error('Unexpected error');
      (service as any).gatherValidRewardMetrics = jest
        .fn()
        .mockReturnValue([{ key: 'test-metric-1', value: BinaryRewardMetricAllowedValue.SUCCESS }]);
      (service as any).getAllActiveMoocletExperimentRefs = jest.fn().mockRejectedValue(error);

      // Act
      await service.parseLogsAndSendPotentialRewards(mockUser, mockLogs, mockLogger);

      // Assert
      expect(mockLogger.error).toHaveBeenCalledWith({
        message: 'Failure processing and sending rewards',
        error,
        logs: mockLogs,
      });
    });
  });

  describe('#gatherValidRewardMetrics', () => {
    it('should extract valid reward metrics from logs', () => {
      // Arrange
      const logs = [
        {
          metrics: {
            attributes: {
              'metric-1': BinaryRewardMetricAllowedValue.SUCCESS,
              'metric-2': BinaryRewardMetricAllowedValue.FAILURE,
              'metric-3': 'INVALID_VALUE',
              'metric-4': 42,
            },
          },
        },
        {
          metrics: {
            attributes: {
              'metric-5': BinaryRewardMetricAllowedValue.SUCCESS,
              'metric-6': 'another-invalid-value',
            },
          },
        },
      ] as unknown as ILogInput[];

      // Need to mock the isBinaryRewardMetricAllowedValue method
      (service as any).isBinaryRewardMetricAllowedValue = jest
        .fn()
        .mockImplementation(
          (value) =>
            value === BinaryRewardMetricAllowedValue.SUCCESS || value === BinaryRewardMetricAllowedValue.FAILURE
        );

      // Act
      const result = (service as any).gatherValidRewardMetrics(logs);

      // Assert
      expect(result).toEqual([
        { key: 'metric-1', value: BinaryRewardMetricAllowedValue.SUCCESS },
        { key: 'metric-2', value: BinaryRewardMetricAllowedValue.FAILURE },
        { key: 'metric-5', value: BinaryRewardMetricAllowedValue.SUCCESS },
      ]);

      // Verify the method was called correctly
      expect((service as any).isBinaryRewardMetricAllowedValue).toHaveBeenCalledWith(
        BinaryRewardMetricAllowedValue.SUCCESS
      );
      expect((service as any).isBinaryRewardMetricAllowedValue).toHaveBeenCalledWith(
        BinaryRewardMetricAllowedValue.FAILURE
      );
      expect((service as any).isBinaryRewardMetricAllowedValue).toHaveBeenCalledWith('INVALID_VALUE');
      expect((service as any).isBinaryRewardMetricAllowedValue).toHaveBeenCalledWith(42);
    });

    it('should return empty array when no valid metrics exist', () => {
      // Arrange
      const logs = [
        {
          metrics: {
            attributes: {
              'metric-1': 'INVALID',
              'metric-2': 123,
            },
          },
        },
      ] as unknown as ILogInput[];

      // Mock the validation method to always return false
      (service as any).isBinaryRewardMetricAllowedValue = jest.fn().mockReturnValue(false);

      // Act
      const result = (service as any).gatherValidRewardMetrics(logs);

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle empty logs array', () => {
      // Arrange
      const logs: ILogInput[] = [];

      // Act
      const result = (service as any).gatherValidRewardMetrics(logs);

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle logs with empty metrics attributes', () => {
      // Arrange
      const logs = [
        {
          metrics: {
            attributes: {},
          },
        },
      ] as ILogInput[];

      // Act
      const result = (service as any).gatherValidRewardMetrics(logs);

      // Assert
      expect(result).toEqual([]);
    });

    it('should process multiple valid metrics from a single log', () => {
      // Arrange
      const logs = [
        {
          metrics: {
            attributes: {
              'metric-1': BinaryRewardMetricAllowedValue.SUCCESS,
              'metric-2': BinaryRewardMetricAllowedValue.FAILURE,
              'metric-3': BinaryRewardMetricAllowedValue.SUCCESS,
            },
          },
        },
      ] as unknown as ILogInput[];

      // Mock the validation method to return true for all values
      (service as any).isBinaryRewardMetricAllowedValue = jest.fn().mockReturnValue(true);

      // Act
      const result = (service as any).gatherValidRewardMetrics(logs);

      // Assert
      expect(result).toEqual([
        { key: 'metric-1', value: BinaryRewardMetricAllowedValue.SUCCESS },
        { key: 'metric-2', value: BinaryRewardMetricAllowedValue.FAILURE },
        { key: 'metric-3', value: BinaryRewardMetricAllowedValue.SUCCESS },
      ]);
    });
  });

  describe('#isBinaryRewardMetricAllowedValue', () => {
    it('should return true for SUCCESS value', () => {
      // Arrange & Act
      const result = (service as any).isBinaryRewardMetricAllowedValue(BinaryRewardMetricAllowedValue.SUCCESS);

      // Assert
      expect(result).toBe(true);
    });

    it('should return true for FAILURE value', () => {
      // Arrange & Act
      const result = (service as any).isBinaryRewardMetricAllowedValue(BinaryRewardMetricAllowedValue.FAILURE);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for non-allowed string values', () => {
      // Arrange & Act
      const result1 = (service as any).isBinaryRewardMetricAllowedValue('INVALID_VALUE');
      const result2 = (service as any).isBinaryRewardMetricAllowedValue('success'); // case sensitive check
      const result3 = (service as any).isBinaryRewardMetricAllowedValue('failure'); // case sensitive check

      // Assert
      expect(result1).toBe(false);
      expect(result2).toBe(false);
      expect(result3).toBe(false);
    });

    it('should return false for non-string values', () => {
      // Arrange & Act
      const result1 = (service as any).isBinaryRewardMetricAllowedValue(123);
      const result2 = (service as any).isBinaryRewardMetricAllowedValue(null);
      const result3 = (service as any).isBinaryRewardMetricAllowedValue(undefined);
      const result4 = (service as any).isBinaryRewardMetricAllowedValue({});
      const result5 = (service as any).isBinaryRewardMetricAllowedValue([]);
      const result6 = (service as any).isBinaryRewardMetricAllowedValue(true);

      // Assert
      expect(result1).toBe(false);
      expect(result2).toBe(false);
      expect(result3).toBe(false);
      expect(result4).toBe(false);
      expect(result5).toBe(false);
      expect(result6).toBe(false);
    });

    it('should handle Object.values behavior correctly', () => {
      // This test verifies that the function behaves correctly depending on
      // what Object.values returns for the enum

      // Mock Object.values to return a specific array for testing
      const originalObjectValues = Object.values;
      Object.values = jest
        .fn()
        .mockReturnValue([BinaryRewardMetricAllowedValue.SUCCESS, BinaryRewardMetricAllowedValue.FAILURE]);

      // Test with a valid value
      const resultValid = (service as any).isBinaryRewardMetricAllowedValue(BinaryRewardMetricAllowedValue.SUCCESS);
      expect(resultValid).toBe(true);

      // Test with an invalid value
      const resultInvalid = (service as any).isBinaryRewardMetricAllowedValue('SOMETHING_ELSE');
      expect(resultInvalid).toBe(false);

      // Verify Object.values was called with the correct parameter
      expect(Object.values).toHaveBeenCalledWith(BinaryRewardMetricAllowedValue);

      // Restore the original Object.values function
      Object.values = originalObjectValues;
    });
  });

  describe('#findExperimentByRewardMetricKey', () => {
    it('should find matching mooclet experiment refs for reward metric keys', () => {
      // Arrange
      const moocletExperimentRefs = [
        {
          id: 'ref-1',
          experimentId: 'exp-1',
          moocletId: 1,
          rewardMetricKey: 'metric-1',
        },
        {
          id: 'ref-2',
          experimentId: 'exp-2',
          moocletId: 2,
          rewardMetricKey: 'metric-2',
        },
        {
          id: 'ref-3',
          experimentId: 'exp-3',
          moocletId: 3,
          rewardMetricKey: 'metric-3',
        },
      ] as MoocletExperimentRef[];

      const rewardMetricKeys = [
        { key: 'metric-1', value: BinaryRewardMetricAllowedValue.SUCCESS },
        { key: 'metric-3', value: BinaryRewardMetricAllowedValue.FAILURE },
        { key: 'metric-4', value: BinaryRewardMetricAllowedValue.SUCCESS }, // No match
      ];

      // Act
      const result = (service as any).findExperimentByRewardMetricKey(moocletExperimentRefs, rewardMetricKeys);

      // Assert
      expect(result).toEqual([
        {
          moocletExperimentRef: moocletExperimentRefs[0],
          rewardMetricValue: BinaryRewardMetricAllowedValue.SUCCESS,
        },
        {
          moocletExperimentRef: moocletExperimentRefs[2],
          rewardMetricValue: BinaryRewardMetricAllowedValue.FAILURE,
        },
      ]);
    });

    it('should return empty array when no matches are found', () => {
      // Arrange
      const moocletExperimentRefs = [
        {
          id: 'ref-1',
          experimentId: 'exp-1',
          moocletId: 1,
          rewardMetricKey: 'metric-1',
        },
      ] as MoocletExperimentRef[];

      const rewardMetricKeys = [
        { key: 'metric-2', value: BinaryRewardMetricAllowedValue.SUCCESS },
        { key: 'metric-3', value: BinaryRewardMetricAllowedValue.FAILURE },
      ];

      // Act
      const result = (service as any).findExperimentByRewardMetricKey(moocletExperimentRefs, rewardMetricKeys);

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle empty moocletExperimentRefs array', () => {
      // Arrange
      const moocletExperimentRefs: MoocletExperimentRef[] = [];
      const rewardMetricKeys = [{ key: 'metric-1', value: BinaryRewardMetricAllowedValue.SUCCESS }];

      // Act
      const result = (service as any).findExperimentByRewardMetricKey(moocletExperimentRefs, rewardMetricKeys);

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle empty rewardMetricKeys array', () => {
      // Arrange
      const moocletExperimentRefs = [
        {
          id: 'ref-1',
          experimentId: 'exp-1',
          moocletId: 1,
          rewardMetricKey: 'metric-1',
        },
      ] as MoocletExperimentRef[];
      const rewardMetricKeys: ValidRewardMetricType[] = [];

      // Act
      const result = (service as any).findExperimentByRewardMetricKey(moocletExperimentRefs, rewardMetricKeys);

      // Assert
      expect(result).toEqual([]);
    });

    it('should find multiple matches for the same experiment ref', () => {
      // Arrange
      const moocletExperimentRefs = [
        {
          id: 'ref-1',
          experimentId: 'exp-1',
          moocletId: 1,
          rewardMetricKey: 'metric-1',
        },
      ] as MoocletExperimentRef[];

      const rewardMetricKeys = [
        { key: 'metric-1', value: BinaryRewardMetricAllowedValue.SUCCESS },
        { key: 'metric-1', value: BinaryRewardMetricAllowedValue.FAILURE },
      ];

      // Act
      const result = (service as any).findExperimentByRewardMetricKey(moocletExperimentRefs, rewardMetricKeys);

      // Assert
      expect(result).toEqual([
        {
          moocletExperimentRef: moocletExperimentRefs[0],
          rewardMetricValue: BinaryRewardMetricAllowedValue.SUCCESS,
        },
        {
          moocletExperimentRef: moocletExperimentRefs[0],
          rewardMetricValue: BinaryRewardMetricAllowedValue.FAILURE,
        },
      ]);
    });

    it('should handle case sensitivity in metric keys', () => {
      // Arrange
      const moocletExperimentRefs = [
        {
          id: 'ref-1',
          experimentId: 'exp-1',
          moocletId: 1,
          rewardMetricKey: 'Metric-1',
        },
      ] as MoocletExperimentRef[];

      const rewardMetricKeys = [
        { key: 'metric-1', value: BinaryRewardMetricAllowedValue.SUCCESS }, // Different case
      ];

      // Act
      const result = (service as any).findExperimentByRewardMetricKey(moocletExperimentRefs, rewardMetricKeys);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('#getVersionIdByConditionId', () => {
    it('should return the mooclet version ID when a matching condition is found', () => {
      // Arrange
      const enrollment = {
        id: 'enrollment-1',
        conditionId: 'condition-1',
        condition: {
          id: 'condition-1',
          name: 'Control',
        },
      } as IndividualEnrollment;

      const moocletExperimentRef = {
        id: 'ref-1',
        versionConditionMaps: [
          {
            experimentConditionId: 'condition-2',
            moocletVersionId: 2,
          },
          {
            experimentConditionId: 'condition-1',
            moocletVersionId: 1,
          },
          {
            experimentConditionId: 'condition-3',
            moocletVersionId: 3,
          },
        ],
      } as MoocletExperimentRef;

      // Act
      const result = (service as any).getVersionIdByConditionId(enrollment, moocletExperimentRef, mockLogger);

      // Assert
      expect(result).toBe(1);
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should return null when no matching condition is found', () => {
      // Arrange
      const enrollment = {
        id: 'enrollment-1',
        conditionId: 'condition-4', // Not in the maps
        condition: {
          id: 'condition-4', // Not in the maps
          name: 'Unknown',
        },
      } as IndividualEnrollment;

      const moocletExperimentRef = {
        id: 'ref-1',
        versionConditionMaps: [
          {
            experimentConditionId: 'condition-1',
            moocletVersionId: 1,
          },
          {
            experimentConditionId: 'condition-2',
            moocletVersionId: 2,
          },
        ],
      } as MoocletExperimentRef;

      // Act
      const result = (service as any).getVersionIdByConditionId(enrollment, moocletExperimentRef, mockLogger);

      // Assert
      expect(result).toBeNull();
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Could not find a version for the user enrollment.',
          versionConditionMaps: moocletExperimentRef.versionConditionMaps,
        })
      );
    });

    it('should return null when enrollment condition is undefined', () => {
      // Arrange
      const enrollment = {
        id: 'enrollment-1',
        condition: undefined, // No condition
      } as IndividualEnrollment;

      const moocletExperimentRef = {
        id: 'ref-1',
        versionConditionMaps: [
          {
            experimentConditionId: 'condition-1',
            moocletVersionId: 1,
          },
        ],
      } as MoocletExperimentRef;

      // Act
      const result = (service as any).getVersionIdByConditionId(enrollment, moocletExperimentRef, mockLogger);

      // Assert
      expect(result).toBeNull();
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Could not find a version for the user enrollment.',
          versionConditionMaps: moocletExperimentRef.versionConditionMaps,
        })
      );
    });

    it('should return null when versionConditionMaps is empty', () => {
      // Arrange
      const enrollment = {
        id: 'enrollment-1',
        conditionId: 'condition-1',
        condition: {
          id: 'condition-1',
          name: 'Control',
        },
      } as IndividualEnrollment;

      const moocletExperimentRef = {
        id: 'ref-1',
        versionConditionMaps: [], // Empty maps
      } as MoocletExperimentRef;

      // Act
      const result = (service as any).getVersionIdByConditionId(enrollment, moocletExperimentRef, mockLogger);

      // Assert
      expect(result).toBeNull();
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Could not find a version for the user enrollment.',
          versionConditionMaps: [],
        })
      );
    });

    it('should correctly match when multiple maps exist', () => {
      // Arrange
      const enrollment = {
        id: 'enrollment-1',
        conditionId: 'condition-3',
        condition: {
          id: 'condition-3',
          name: 'Treatment B',
        },
      } as IndividualEnrollment;

      const moocletExperimentRef = {
        id: 'ref-1',
        versionConditionMaps: [
          {
            experimentConditionId: 'condition-1',
            moocletVersionId: 1,
          },
          {
            experimentConditionId: 'condition-2',
            moocletVersionId: 2,
          },
          {
            experimentConditionId: 'condition-3',
            moocletVersionId: 3,
          },
        ],
      } as MoocletExperimentRef;

      // Act
      const result = (service as any).getVersionIdByConditionId(enrollment, moocletExperimentRef, mockLogger);

      // Assert
      expect(result).toBe(3);
      expect(mockLogger.error).not.toHaveBeenCalled();
    });
  });
});
