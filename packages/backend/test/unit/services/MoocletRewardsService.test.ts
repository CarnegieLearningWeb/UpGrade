import { MoocletRewardsService } from '../../../src/api/services/MoocletRewardsService';
import { MoocletExperimentRefRepository } from '../../../src/api/repositories/MoocletExperimentRefRepository';
import { IndividualEnrollmentRepository } from '../../../src/api/repositories/IndividualEnrollmentRepository';
import { MoocletDataService } from '../../../src/api/services/MoocletDataService';
import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';
import { MoocletExperimentRef } from '../../../src/api/models/MoocletExperimentRef';
import { IndividualEnrollment } from '../../../src/api/models/IndividualEnrollment';
import { Experiment } from '../../../src/api/models/Experiment';
import { EXPERIMENT_STATE } from 'upgrade_types';
import { BinaryRewardAllowedValue } from 'upgrade_types';
import { RewardValidator } from '../../../src/api/controllers/validators/RewardValidator';
import { RequestedExperimentUser } from '../../../src/api/controllers/validators/ExperimentUserValidator';
import { HttpError } from 'routing-controllers';
import { configureLogger } from '../../utils/logger';
import { MoocletExperimentService } from 'src/api/services/MoocletExperimentService';

describe('MoocletRewardsService', () => {
  let service: MoocletRewardsService;
  let mockLogger: jest.Mocked<UpgradeLogger>;
  let mockMoocletDataService: jest.Mocked<MoocletDataService>;
  let mockMoocletExperimentRefRepository: jest.Mocked<MoocletExperimentRefRepository>;
  let mockIndividualEnrollmentRepository: jest.Mocked<IndividualEnrollmentRepository>;
  let mockMoocletExperimentService: jest.Mocked<MoocletExperimentService>;

  const mockUser = {
    id: 'user-123',
    group: {},
    workingGroup: {},
  } as RequestedExperimentUser;

  const mockExperiment: Partial<Experiment> = {
    id: 'experiment-123',
    state: EXPERIMENT_STATE.ENROLLING,
  };

  const mockMoocletExperimentRef: Partial<MoocletExperimentRef> = {
    id: 'ref-123',
    experimentId: 'experiment-123',
    moocletId: 456,
    outcomeVariableName: 'reward_variable',
    experiment: mockExperiment as Experiment,
    versionConditionMaps: [
      {
        experimentConditionId: 'condition-1',
        moocletVersionId: 100,
      } as any,
      {
        experimentConditionId: 'condition-2',
        moocletVersionId: 200,
      } as any,
    ],
  };

  const mockEnrollment: Partial<IndividualEnrollment> = {
    id: 'enrollment-123',
    userId: 'user-123',
    experimentId: 'experiment-123',
    conditionId: 'condition-1',
  };

  beforeAll(() => {
    configureLogger();
  });

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    } as any;

    mockMoocletDataService = {
      postNewReward: jest.fn(),
    } as any;

    mockMoocletExperimentRefRepository = {
      findOne: jest.fn(),
      findActivelyEnrollingMoocletExperimentsByContextSiteTarget: jest.fn(),
    } as any;

    mockIndividualEnrollmentRepository = {
      findEnrollments: jest.fn(),
    } as any;

    mockMoocletExperimentService = {
      getMoocletExperimentRefByUpgradeExperimentId: jest.fn(),
    } as any;

    service = new MoocletRewardsService(
      mockMoocletExperimentRefRepository as any,
      mockIndividualEnrollmentRepository as any,
      mockMoocletDataService as any,
      mockMoocletExperimentService as any
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendReward', () => {
    describe('successful reward sending', () => {
      it('should successfully send reward when all criteria are met using experimentId', async () => {
        const request: RewardValidator = {
          experimentId: 'experiment-123',
          rewardValue: BinaryRewardAllowedValue.SUCCESS,
          context: undefined,
          decisionPoint: undefined,
        };

        mockMoocletExperimentRefRepository.findOne.mockResolvedValue(mockMoocletExperimentRef as MoocletExperimentRef);
        mockIndividualEnrollmentRepository.findEnrollments.mockResolvedValue([mockEnrollment as IndividualEnrollment]);

        const result = await service.sendReward(mockUser, request, mockLogger as any);

        expect(result.message).toBe('Reward sent to mooclet successfully.');
        expect(result.reward).toEqual({
          variable: 'reward_variable',
          value: 1,
          mooclet: 456,
          version: 100,
          learner: 'user-123',
        });
        expect(mockMoocletDataService.postNewReward).toHaveBeenCalledTimes(1);
        expect(mockLogger.info).toHaveBeenCalledTimes(1);
      });

      it('should successfully send reward using decision point when experimentId not provided', async () => {
        const request: RewardValidator = {
          experimentId: undefined,
          rewardValue: BinaryRewardAllowedValue.FAILURE,
          context: 'home',
          decisionPoint: {
            site: 'site-1',
            target: 'target-1',
          },
        };

        mockMoocletExperimentRefRepository.findActivelyEnrollingMoocletExperimentsByContextSiteTarget.mockResolvedValue(
          [mockMoocletExperimentRef as MoocletExperimentRef]
        );
        mockIndividualEnrollmentRepository.findEnrollments.mockResolvedValue([mockEnrollment as IndividualEnrollment]);

        const result = await service.sendReward(mockUser, request, mockLogger as any);

        expect(result.message).toBe('Reward sent to mooclet successfully.');
        expect(result.reward.value).toBe(0); // FAILURE maps to 0
        expect(mockMoocletDataService.postNewReward).toHaveBeenCalledTimes(1);
      });

      it('should call postNewReward without awaiting (fire-and-forget)', async () => {
        const request: RewardValidator = {
          experimentId: 'experiment-123',
          rewardValue: BinaryRewardAllowedValue.SUCCESS,
          context: undefined,
          decisionPoint: undefined,
        };

        mockMoocletExperimentRefRepository.findOne.mockResolvedValue(mockMoocletExperimentRef as MoocletExperimentRef);
        mockIndividualEnrollmentRepository.findEnrollments.mockResolvedValue([mockEnrollment as IndividualEnrollment]);

        await service.sendReward(mockUser, request, mockLogger as any);

        // Verify postNewReward was called but not awaited
        expect(mockMoocletDataService.postNewReward).toHaveBeenCalledTimes(1);
      });

      it('should map SUCCESS reward value to 1', async () => {
        const request: RewardValidator = {
          experimentId: 'experiment-123',
          rewardValue: BinaryRewardAllowedValue.SUCCESS,
          context: undefined,
          decisionPoint: undefined,
        };

        mockMoocletExperimentRefRepository.findOne.mockResolvedValue(mockMoocletExperimentRef as MoocletExperimentRef);
        mockIndividualEnrollmentRepository.findEnrollments.mockResolvedValue([mockEnrollment as IndividualEnrollment]);

        const result = await service.sendReward(mockUser, request, mockLogger as any);

        expect(result.reward.value).toBe(1);
      });

      it('should map FAILURE reward value to 0', async () => {
        const request: RewardValidator = {
          experimentId: 'experiment-123',
          rewardValue: BinaryRewardAllowedValue.FAILURE,
          context: undefined,
          decisionPoint: undefined,
        };

        mockMoocletExperimentRefRepository.findOne.mockResolvedValue(mockMoocletExperimentRef as MoocletExperimentRef);
        mockIndividualEnrollmentRepository.findEnrollments.mockResolvedValue([mockEnrollment as IndividualEnrollment]);

        const result = await service.sendReward(mockUser, request, mockLogger as any);

        expect(result.reward.value).toBe(0);
      });
    });

    describe('mooclet experiment ref validation', () => {
      it('should throw 409 when no mooclet ref found by experimentId', async () => {
        const request: RewardValidator = {
          experimentId: 'nonexistent-experiment',
          rewardValue: BinaryRewardAllowedValue.SUCCESS,
          context: undefined,
          decisionPoint: undefined,
        };

        mockMoocletExperimentRefRepository.findOne.mockResolvedValue(null);

        await expect(service.sendReward(mockUser, request, mockLogger as any)).rejects.toThrow(HttpError);

        try {
          await service.sendReward(mockUser, request, mockLogger as any);
        } catch (error) {
          expect((error as HttpError).httpCode).toBe(409);
          expect((error as HttpError).message).toContain('No active mooclet experiment ref found');
        }
      });

      it('should throw 409 when no mooclet ref found by decision point', async () => {
        const request: RewardValidator = {
          experimentId: undefined,
          rewardValue: BinaryRewardAllowedValue.SUCCESS,
          context: 'home',
          decisionPoint: {
            site: 'site-1',
            target: 'target-1',
          },
        };

        mockMoocletExperimentRefRepository.findActivelyEnrollingMoocletExperimentsByContextSiteTarget.mockResolvedValue(
          []
        );

        await expect(service.sendReward(mockUser, request, mockLogger as any)).rejects.toThrow(HttpError);

        try {
          await service.sendReward(mockUser, request, mockLogger as any);
        } catch (error) {
          expect((error as HttpError).httpCode).toBe(409);
          expect((error as HttpError).message).toContain('No active experiment found for decision point');
        }
      });

      it('should throw 409 when multiple mooclet refs found by decision point', async () => {
        const request: RewardValidator = {
          experimentId: undefined,
          rewardValue: BinaryRewardAllowedValue.SUCCESS,
          context: 'home',
          decisionPoint: {
            site: 'site-1',
            target: 'target-1',
          },
        };

        mockMoocletExperimentRefRepository.findActivelyEnrollingMoocletExperimentsByContextSiteTarget.mockResolvedValue(
          [
            mockMoocletExperimentRef as MoocletExperimentRef,
            { ...mockMoocletExperimentRef, id: 'ref-456' } as MoocletExperimentRef,
          ]
        );

        await expect(service.sendReward(mockUser, request, mockLogger as any)).rejects.toThrow(HttpError);

        try {
          await service.sendReward(mockUser, request, mockLogger as any);
        } catch (error) {
          expect((error as HttpError).httpCode).toBe(409);
          expect((error as HttpError).message).toContain('Multiple active experiments found for decision point');
        }
      });

      it('should throw 409 when experiment is not in ENROLLING state', async () => {
        const request: RewardValidator = {
          experimentId: 'experiment-123',
          rewardValue: BinaryRewardAllowedValue.SUCCESS,
          context: undefined,
          decisionPoint: undefined,
        };

        const nonEnrollingRef = {
          ...mockMoocletExperimentRef,
          experiment: {
            ...mockExperiment,
            state: EXPERIMENT_STATE.ENROLLMENT_COMPLETE,
          },
        };

        mockMoocletExperimentRefRepository.findOne.mockResolvedValue(nonEnrollingRef as MoocletExperimentRef);

        await expect(service.sendReward(mockUser, request, mockLogger as any)).rejects.toThrow(HttpError);

        try {
          await service.sendReward(mockUser, request, mockLogger as any);
        } catch (error) {
          expect((error as HttpError).httpCode).toBe(409);
          expect((error as HttpError).message).toContain('not actively enrolling');
        }
      });
    });

    describe('user enrollment validation', () => {
      it('should throw 409 when no enrollment found for user', async () => {
        const request: RewardValidator = {
          experimentId: 'experiment-123',
          rewardValue: BinaryRewardAllowedValue.SUCCESS,
          context: undefined,
          decisionPoint: undefined,
        };

        mockMoocletExperimentRefRepository.findOne.mockResolvedValue(mockMoocletExperimentRef as MoocletExperimentRef);
        mockIndividualEnrollmentRepository.findEnrollments.mockResolvedValue([]);

        await expect(service.sendReward(mockUser, request, mockLogger as any)).rejects.toThrow(HttpError);

        try {
          await service.sendReward(mockUser, request, mockLogger as any);
        } catch (error) {
          expect((error as HttpError).httpCode).toBe(409);
          expect((error as Error).message).toContain('Could not find unique user enrollment');
        }
      });

      it('should throw 409 when multiple enrollments found for user', async () => {
        const request: RewardValidator = {
          experimentId: 'experiment-123',
          rewardValue: BinaryRewardAllowedValue.SUCCESS,
          context: undefined,
          decisionPoint: undefined,
        };

        mockMoocletExperimentRefRepository.findOne.mockResolvedValue(mockMoocletExperimentRef as MoocletExperimentRef);
        mockIndividualEnrollmentRepository.findEnrollments.mockResolvedValue([
          mockEnrollment as IndividualEnrollment,
          { ...mockEnrollment, id: 'enrollment-456' } as IndividualEnrollment,
        ]);

        await expect(service.sendReward(mockUser, request, mockLogger as any)).rejects.toThrow(HttpError);

        try {
          await service.sendReward(mockUser, request, mockLogger as any);
        } catch (error) {
          expect((error as HttpError).httpCode).toBe(409);
          expect((error as HttpError).message).toContain('Could not find unique user enrollment');
        }
      });

      it('should succeed when exactly one enrollment found', async () => {
        const request: RewardValidator = {
          experimentId: 'experiment-123',
          rewardValue: BinaryRewardAllowedValue.SUCCESS,
          context: undefined,
          decisionPoint: undefined,
        };

        mockMoocletExperimentRefRepository.findOne.mockResolvedValue(mockMoocletExperimentRef as MoocletExperimentRef);
        mockIndividualEnrollmentRepository.findEnrollments.mockResolvedValue([mockEnrollment as IndividualEnrollment]);

        const result = await service.sendReward(mockUser, request, mockLogger as any);

        expect(result.message).toBe('Reward sent to mooclet successfully.');
      });
    });

    describe('version mapping validation', () => {
      it('should throw 409 when no version mapping found for enrolled condition', async () => {
        const request: RewardValidator = {
          experimentId: 'experiment-123',
          rewardValue: BinaryRewardAllowedValue.SUCCESS,
          context: undefined,
          decisionPoint: undefined,
        };

        const enrollmentWithUnmappedCondition = {
          ...mockEnrollment,
          conditionId: 'unmapped-condition',
        };

        mockMoocletExperimentRefRepository.findOne.mockResolvedValue(mockMoocletExperimentRef as MoocletExperimentRef);
        mockIndividualEnrollmentRepository.findEnrollments.mockResolvedValue([
          enrollmentWithUnmappedCondition as IndividualEnrollment,
        ]);

        await expect(service.sendReward(mockUser, request, mockLogger as any)).rejects.toThrow(HttpError);

        try {
          await service.sendReward(mockUser, request, mockLogger as any);
        } catch (error) {
          expect((error as HttpError).httpCode).toBe(409);
          expect((error as HttpError).message).toContain('Version-condition mapping not found');
        }
      });

      it('should find correct versionId for enrolled condition', async () => {
        const request: RewardValidator = {
          experimentId: 'experiment-123',
          rewardValue: BinaryRewardAllowedValue.SUCCESS,
          context: undefined,
          decisionPoint: undefined,
        };

        const enrollmentCondition2 = {
          ...mockEnrollment,
          conditionId: 'condition-2',
        };

        mockMoocletExperimentRefRepository.findOne.mockResolvedValue(mockMoocletExperimentRef as MoocletExperimentRef);
        mockIndividualEnrollmentRepository.findEnrollments.mockResolvedValue([
          enrollmentCondition2 as IndividualEnrollment,
        ]);

        const result = await service.sendReward(mockUser, request, mockLogger as any);

        expect(result.reward.version).toBe(200); // version for condition-2
      });
    });

    describe('error handling', () => {
      it('should wrap unexpected errors as 409 HttpError', async () => {
        const request: RewardValidator = {
          experimentId: 'experiment-123',
          rewardValue: BinaryRewardAllowedValue.SUCCESS,
          context: undefined,
          decisionPoint: undefined,
        };

        mockMoocletExperimentRefRepository.findOne.mockRejectedValue(new Error('Database connection failed'));

        await expect(service.sendReward(mockUser, request, mockLogger as any)).rejects.toThrow(HttpError);

        try {
          await service.sendReward(mockUser, request, mockLogger as any);
        } catch (error) {
          expect((error as HttpError).httpCode).toBe(409);
          expect((error as HttpError).message).toContain('Failed to process reward request due to unexpected error');
        }
      });

      it('should re-throw HttpErrors without wrapping', async () => {
        const request: RewardValidator = {
          experimentId: 'experiment-123',
          rewardValue: BinaryRewardAllowedValue.SUCCESS,
          context: undefined,
          decisionPoint: undefined,
        };

        const originalError = new HttpError(404, 'Experiment not found');
        mockMoocletExperimentRefRepository.findOne.mockRejectedValue(originalError);

        await expect(service.sendReward(mockUser, request, mockLogger as any)).rejects.toThrow(originalError);
      });

      it('should log errors with appropriate context', async () => {
        const request: RewardValidator = {
          experimentId: 'experiment-123',
          rewardValue: BinaryRewardAllowedValue.SUCCESS,
          context: undefined,
          decisionPoint: undefined,
        };

        mockMoocletExperimentRefRepository.findOne.mockResolvedValue(null);

        try {
          await service.sendReward(mockUser, request, mockLogger as any);
        } catch (error) {
          expect(mockLogger.error).toHaveBeenCalledTimes(1);
          expect(mockLogger.error).toHaveBeenCalledWith(
            expect.objectContaining({
              message: expect.any(String),
              request: expect.any(Object),
            })
          );
        }
      });
    });

    describe('reward payload construction', () => {
      it('should construct reward with all required fields', async () => {
        const request: RewardValidator = {
          experimentId: 'experiment-123',
          rewardValue: BinaryRewardAllowedValue.SUCCESS,
          context: undefined,
          decisionPoint: undefined,
        };

        mockMoocletExperimentRefRepository.findOne.mockResolvedValue(mockMoocletExperimentRef as MoocletExperimentRef);
        mockIndividualEnrollmentRepository.findEnrollments.mockResolvedValue([mockEnrollment as IndividualEnrollment]);

        const result = await service.sendReward(mockUser, request, mockLogger as any);

        expect(result.reward).toHaveProperty('variable');
        expect(result.reward).toHaveProperty('value');
        expect(result.reward).toHaveProperty('mooclet');
        expect(result.reward).toHaveProperty('version');
        expect(result.reward).toHaveProperty('learner');
      });

      it('should use outcomeVariableName from mooclet ref', async () => {
        const request: RewardValidator = {
          experimentId: 'experiment-123',
          rewardValue: BinaryRewardAllowedValue.SUCCESS,
          context: undefined,
          decisionPoint: undefined,
        };

        mockMoocletExperimentRefRepository.findOne.mockResolvedValue(mockMoocletExperimentRef as MoocletExperimentRef);
        mockIndividualEnrollmentRepository.findEnrollments.mockResolvedValue([mockEnrollment as IndividualEnrollment]);

        const result = await service.sendReward(mockUser, request, mockLogger as any);

        expect(result.reward.variable).toBe('reward_variable');
      });

      it('should use moocletId from mooclet ref', async () => {
        const request: RewardValidator = {
          experimentId: 'experiment-123',
          rewardValue: BinaryRewardAllowedValue.SUCCESS,
          context: undefined,
          decisionPoint: undefined,
        };

        mockMoocletExperimentRefRepository.findOne.mockResolvedValue(mockMoocletExperimentRef as MoocletExperimentRef);
        mockIndividualEnrollmentRepository.findEnrollments.mockResolvedValue([mockEnrollment as IndividualEnrollment]);

        const result = await service.sendReward(mockUser, request, mockLogger as any);

        expect(result.reward.mooclet).toBe(456);
      });

      it('should use user id as learner', async () => {
        const request: RewardValidator = {
          experimentId: 'experiment-123',
          rewardValue: BinaryRewardAllowedValue.SUCCESS,
          context: undefined,
          decisionPoint: undefined,
        };

        mockMoocletExperimentRefRepository.findOne.mockResolvedValue(mockMoocletExperimentRef as MoocletExperimentRef);
        mockIndividualEnrollmentRepository.findEnrollments.mockResolvedValue([mockEnrollment as IndividualEnrollment]);

        const result = await service.sendReward(mockUser, request, mockLogger as any);

        expect(result.reward.learner).toBe('user-123');
      });
    });
  });

  describe('getRewardsSummaryForExperiment', () => {
    const mockMoocletRewardsResponse = {
      count: 10,
      next: null,
      previous: null,
      results: [
        { id: '1', version: 100, value: 1.0, variable: 'reward_variable', learner: 'user-1', mooclet: 456 },
        { id: '2', version: 100, value: 0.0, variable: 'reward_variable', learner: 'user-2', mooclet: 456 },
        { id: '3', version: 100, value: 1.0, variable: 'reward_variable', learner: 'user-3', mooclet: 456 },
        { id: '4', version: 200, value: 1.0, variable: 'reward_variable', learner: 'user-4', mooclet: 456 },
        { id: '5', version: 200, value: 0.0, variable: 'reward_variable', learner: 'user-5', mooclet: 456 },
      ],
    };

    beforeEach(() => {
      mockMoocletDataService.getRewardsForExperiment = jest.fn();
    });

    it('should successfully fetch and return rewards summary', async () => {
      const refWithConditions = {
        ...mockMoocletExperimentRef,
        versionConditionMaps: [
          {
            experimentConditionId: 'condition-1',
            moocletVersionId: 100,
            experimentCondition: { conditionCode: 'Control', order: 0 },
          },
          {
            experimentConditionId: 'condition-2',
            moocletVersionId: 200,
            experimentCondition: { conditionCode: 'Treatment', order: 1 },
          },
        ],
      };

      mockMoocletExperimentService.getMoocletExperimentRefByUpgradeExperimentId.mockResolvedValue(
        refWithConditions as any
      );
      mockMoocletDataService.getRewardsForExperiment.mockResolvedValue(mockMoocletRewardsResponse as any);

      const result = await service.getRewardsSummaryForExperiment('experiment-123', mockLogger);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        conditionCode: 'Control',
        successes: 2,
        failures: 1,
        total: 3,
        successRate: '66.7%',
        order: 0,
      });
      expect(result[1]).toEqual({
        conditionCode: 'Treatment',
        successes: 1,
        failures: 1,
        total: 2,
        successRate: '50.0%',
        order: 1,
      });
    });

    it('should handle experiment with no rewards', async () => {
      const refWithConditions = {
        ...mockMoocletExperimentRef,
        versionConditionMaps: [
          {
            experimentConditionId: 'condition-1',
            moocletVersionId: 100,
            experimentCondition: { conditionCode: 'Control', order: 0 },
          },
        ],
      };

      mockMoocletExperimentService.getMoocletExperimentRefByUpgradeExperimentId.mockResolvedValue(
        refWithConditions as any
      );
      mockMoocletDataService.getRewardsForExperiment.mockResolvedValue({
        count: 0,
        next: null,
        previous: null,
        results: [],
      } as any);

      const result = await service.getRewardsSummaryForExperiment('experiment-123', mockLogger);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        conditionCode: 'Control',
        successes: 0,
        failures: 0,
        total: 0,
        successRate: '0.0%',
        order: 0,
      });
    });

    it('should fetch all pages and accumulate results when response has multiple pages', async () => {
      const refWithConditions = {
        ...mockMoocletExperimentRef,
        versionConditionMaps: [
          {
            experimentConditionId: 'condition-1',
            moocletVersionId: 100,
            experimentCondition: { conditionCode: 'Control', order: 0 },
          },
          {
            experimentConditionId: 'condition-2',
            moocletVersionId: 200,
            experimentCondition: { conditionCode: 'Treatment', order: 1 },
          },
        ],
      };

      const page1Response = {
        count: 6,
        next: 'http://mooclet-api/value?page=2',
        previous: null,
        results: [
          { id: '1', version: 100, value: 1.0, variable: 'reward_variable', learner: 'user-1', mooclet: 456 },
          { id: '2', version: 100, value: 0.0, variable: 'reward_variable', learner: 'user-2', mooclet: 456 },
          { id: '3', version: 200, value: 1.0, variable: 'reward_variable', learner: 'user-3', mooclet: 456 },
        ],
      };

      const page2Response = {
        count: 6,
        next: null,
        previous: 'http://mooclet-api/value?page=1',
        results: [
          { id: '4', version: 100, value: 1.0, variable: 'reward_variable', learner: 'user-4', mooclet: 456 },
          { id: '5', version: 200, value: 0.0, variable: 'reward_variable', learner: 'user-5', mooclet: 456 },
          { id: '6', version: 200, value: 1.0, variable: 'reward_variable', learner: 'user-6', mooclet: 456 },
        ],
      };

      mockMoocletExperimentService.getMoocletExperimentRefByUpgradeExperimentId.mockResolvedValue(
        refWithConditions as any
      );
      mockMoocletDataService.getRewardsForExperiment
        .mockResolvedValueOnce(page1Response as any)
        .mockResolvedValueOnce(page2Response as any);

      const result = await service.getRewardsSummaryForExperiment('experiment-123', mockLogger);

      expect(mockMoocletDataService.getRewardsForExperiment).toHaveBeenCalledTimes(2);
      // Control (version 100): page1 has id1 (success) + id2 (failure), page2 has id4 (success) => 2 successes, 1 failure
      expect(result[0]).toEqual({
        conditionCode: 'Control',
        successes: 2,
        failures: 1,
        total: 3,
        successRate: '66.7%',
        order: 0,
      });
      // Treatment (version 200): page1 has id3 (success), page2 has id5 (failure) + id6 (success) => 2 successes, 1 failure
      expect(result[1]).toEqual({
        conditionCode: 'Treatment',
        successes: 2,
        failures: 1,
        total: 3,
        successRate: '66.7%',
        order: 1,
      });
    });

    it('should pass next page URL to subsequent fetches', async () => {
      const refWithConditions = {
        ...mockMoocletExperimentRef,
        versionConditionMaps: [
          {
            experimentConditionId: 'condition-1',
            moocletVersionId: 100,
            experimentCondition: { conditionCode: 'Control', order: 0 },
          },
        ],
      };

      const nextPageUrl = 'http://mooclet-api/value?page=2';

      mockMoocletExperimentService.getMoocletExperimentRefByUpgradeExperimentId.mockResolvedValue(
        refWithConditions as any
      );
      mockMoocletDataService.getRewardsForExperiment
        .mockResolvedValueOnce({ count: 2, next: nextPageUrl, previous: null, results: [] } as any)
        .mockResolvedValueOnce({ count: 2, next: null, previous: null, results: [] } as any);

      await service.getRewardsSummaryForExperiment('experiment-123', mockLogger);

      expect(mockMoocletDataService.getRewardsForExperiment).toHaveBeenNthCalledWith(
        2,
        expect.anything(),
        expect.anything(),
        nextPageUrl
      );
    });

    it('should log info for each additional page fetched', async () => {
      const refWithConditions = {
        ...mockMoocletExperimentRef,
        versionConditionMaps: [
          {
            experimentConditionId: 'condition-1',
            moocletVersionId: 100,
            experimentCondition: { conditionCode: 'Control', order: 0 },
          },
        ],
      };

      mockMoocletExperimentService.getMoocletExperimentRefByUpgradeExperimentId.mockResolvedValue(
        refWithConditions as any
      );
      mockMoocletDataService.getRewardsForExperiment
        .mockResolvedValueOnce({
          count: 4,
          next: 'http://mooclet-api/value?page=2',
          previous: null,
          results: [{ id: '1', version: 100, value: 1.0 }],
        } as any)
        .mockResolvedValueOnce({ count: 4, next: null, previous: null, results: [] } as any);

      await service.getRewardsSummaryForExperiment('experiment-123', mockLogger);

      // Once for initial fetch, once for the paginated fetch
      expect(mockLogger.info).toHaveBeenCalledTimes(2);
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("But wait there's more"),
        })
      );
    });

    it('should handle three or more pages of results', async () => {
      const refWithConditions = {
        ...mockMoocletExperimentRef,
        versionConditionMaps: [
          {
            experimentConditionId: 'condition-1',
            moocletVersionId: 100,
            experimentCondition: { conditionCode: 'Control', order: 0 },
          },
        ],
      };

      mockMoocletExperimentService.getMoocletExperimentRefByUpgradeExperimentId.mockResolvedValue(
        refWithConditions as any
      );
      mockMoocletDataService.getRewardsForExperiment
        .mockResolvedValueOnce({
          count: 3,
          next: 'http://mooclet-api/value?page=2',
          previous: null,
          results: [{ id: '1', version: 100, value: 1.0 }],
        } as any)
        .mockResolvedValueOnce({
          count: 3,
          next: 'http://mooclet-api/value?page=3',
          previous: null,
          results: [{ id: '2', version: 100, value: 0.0 }],
        } as any)
        .mockResolvedValueOnce({
          count: 3,
          next: null,
          previous: null,
          results: [{ id: '3', version: 100, value: 1.0 }],
        } as any);

      const result = await service.getRewardsSummaryForExperiment('experiment-123', mockLogger);

      expect(mockMoocletDataService.getRewardsForExperiment).toHaveBeenCalledTimes(3);
      expect(result[0].total).toBe(3);
      expect(result[0].successes).toBe(2);
      expect(result[0].failures).toBe(1);
    });

    it('should log error and re-throw when mooclet service fails', async () => {
      const error = new Error('Mooclet API error');
      mockMoocletExperimentService.getMoocletExperimentRefByUpgradeExperimentId.mockRejectedValue(error);

      await expect(service.getRewardsSummaryForExperiment('experiment-123', mockLogger)).rejects.toThrow(error);

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Error fetching rewards summary for experiment',
          experimentId: 'experiment-123',
          error,
        })
      );
    });

    it('should sort results by condition order', async () => {
      const refWithConditions = {
        ...mockMoocletExperimentRef,
        versionConditionMaps: [
          {
            experimentConditionId: 'condition-2',
            moocletVersionId: 200,
            experimentCondition: { conditionCode: 'Treatment', order: 1 },
          },
          {
            experimentConditionId: 'condition-1',
            moocletVersionId: 100,
            experimentCondition: { conditionCode: 'Control', order: 0 },
          },
        ],
      };

      mockMoocletExperimentService.getMoocletExperimentRefByUpgradeExperimentId.mockResolvedValue(
        refWithConditions as any
      );
      mockMoocletDataService.getRewardsForExperiment.mockResolvedValue(mockMoocletRewardsResponse as any);

      const result = await service.getRewardsSummaryForExperiment('experiment-123', mockLogger);

      expect(result[0].conditionCode).toBe('Control');
      expect(result[0].order).toBe(0);
      expect(result[1].conditionCode).toBe('Treatment');
      expect(result[1].order).toBe(1);
    });
  });

  describe('fetchRewardsForExperiment', () => {
    beforeEach(() => {
      mockMoocletDataService.getRewardsForExperiment = jest.fn();
    });

    it('should call mooclet data service with correct parameters', async () => {
      const moocletRef = {
        moocletId: 456,
        outcomeVariableName: 'test_variable',
      } as MoocletExperimentRef;

      mockMoocletDataService.getRewardsForExperiment.mockResolvedValue({
        count: 5,
        next: null,
        previous: null,
        results: [],
      } as any);

      await service.fetchRewardsForExperiment(moocletRef, mockLogger as any);

      expect(mockMoocletDataService.getRewardsForExperiment).toHaveBeenCalledWith(
        {
          moocletId: 456,
          variableName: 'test_variable',
        },
        mockLogger,
        undefined
      );
    });

    it('should return paginated response from mooclet data service', async () => {
      const moocletRef = {
        moocletId: 456,
        outcomeVariableName: 'test_variable',
      } as MoocletExperimentRef;

      const expectedResponse = {
        count: 3,
        next: 'http://next-page',
        previous: null,
        results: [{ id: '1', value: 1.0 }],
      };

      mockMoocletDataService.getRewardsForExperiment.mockResolvedValue(expectedResponse as any);

      const result = await service.fetchRewardsForExperiment(moocletRef, mockLogger as any);

      expect(result).toEqual(expectedResponse);
    });

    it('should pass nextPageUrl to mooclet data service when provided', async () => {
      const moocletRef = {
        moocletId: 456,
        outcomeVariableName: 'test_variable',
      } as MoocletExperimentRef;

      const nextPageUrl = 'http://mooclet-api/value?page=2';

      mockMoocletDataService.getRewardsForExperiment.mockResolvedValue({
        count: 5,
        next: null,
        previous: 'http://mooclet-api/value?page=1',
        results: [{ id: '2', value: 1.0 }],
      } as any);

      await service.fetchRewardsForExperiment(moocletRef, mockLogger as any, nextPageUrl);

      expect(mockMoocletDataService.getRewardsForExperiment).toHaveBeenCalledWith(
        {
          moocletId: 456,
          variableName: 'test_variable',
        },
        mockLogger,
        nextPageUrl
      );
    });
  });

  describe('createExperimentRewardsSummary', () => {
    it('should calculate success rate correctly for each condition', async () => {
      const refWithConditions = {
        ...mockMoocletExperimentRef,
        experimentId: 'exp-123',
        versionConditionMaps: [
          {
            experimentConditionId: 'condition-1',
            moocletVersionId: 100,
            experimentCondition: { conditionCode: 'Control', order: 0 },
          },
          {
            experimentConditionId: 'condition-2',
            moocletVersionId: 200,
            experimentCondition: { conditionCode: 'Treatment', order: 1 },
          },
        ],
      };

      const rewardsData = [
        { id: '1', version: 100, value: 1.0 },
        { id: '2', version: 100, value: 1.0 },
        { id: '3', version: 100, value: 0.0 },
        { id: '4', version: 200, value: 1.0 },
        { id: '5', version: 200, value: 0.0 },
        { id: '6', version: 200, value: 0.0 },
        { id: '7', version: 200, value: 0.0 },
      ];

      const result = await service.createExperimentRewardsSummary(
        refWithConditions as any,
        rewardsData as any,
        mockLogger as any
      );

      expect(result[0]).toEqual({
        conditionCode: 'Control',
        successes: 2,
        failures: 1,
        total: 3,
        successRate: '66.7%',
        order: 0,
      });
      expect(result[1]).toEqual({
        conditionCode: 'Treatment',
        successes: 1,
        failures: 3,
        total: 4,
        successRate: '25.0%',
        order: 1,
      });
    });

    it('should handle 100% success rate', async () => {
      const refWithConditions = {
        ...mockMoocletExperimentRef,
        experimentId: 'exp-123',
        versionConditionMaps: [
          {
            experimentConditionId: 'condition-1',
            moocletVersionId: 100,
            experimentCondition: { conditionCode: 'Control', order: 0 },
          },
        ],
      };

      const rewardsData = [
        { id: '1', version: 100, value: 1.0 },
        { id: '2', version: 100, value: 1.0 },
        { id: '3', version: 100, value: 1.0 },
      ];

      const result = await service.createExperimentRewardsSummary(
        refWithConditions as any,
        rewardsData as any,
        mockLogger as any
      );

      expect(result[0].successRate).toBe('100.0%');
    });

    it('should handle 0% success rate', async () => {
      const refWithConditions = {
        ...mockMoocletExperimentRef,
        experimentId: 'exp-123',
        versionConditionMaps: [
          {
            experimentConditionId: 'condition-1',
            moocletVersionId: 100,
            experimentCondition: { conditionCode: 'Control', order: 0 },
          },
        ],
      };

      const rewardsData = [
        { id: '1', version: 100, value: 0.0 },
        { id: '2', version: 100, value: 0.0 },
      ];

      const result = await service.createExperimentRewardsSummary(
        refWithConditions as any,
        rewardsData as any,
        mockLogger as any
      );

      expect(result[0].successRate).toBe('0.0%');
    });

    it('should return empty array when results is undefined', async () => {
      const refWithConditions = {
        ...mockMoocletExperimentRef,
        experimentId: 'exp-123',
        versionConditionMaps: [
          {
            experimentConditionId: 'condition-1',
            moocletVersionId: 100,
            experimentCondition: { conditionCode: 'Control', order: 0 },
          },
        ],
      };

      const result = await service.createExperimentRewardsSummary(
        refWithConditions as any,
        undefined as any,
        mockLogger as any
      );

      expect(result).toEqual([]);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'No rewards data returned from Mooclet API',
          experimentId: 'exp-123',
        })
      );
    });

    it('should filter rewards by version ID correctly', async () => {
      const refWithConditions = {
        ...mockMoocletExperimentRef,
        experimentId: 'exp-123',
        versionConditionMaps: [
          {
            experimentConditionId: 'condition-1',
            moocletVersionId: 100,
            experimentCondition: { conditionCode: 'Control', order: 0 },
          },
          {
            experimentConditionId: 'condition-2',
            moocletVersionId: 200,
            experimentCondition: { conditionCode: 'Treatment', order: 1 },
          },
        ],
      };

      const rewardsData = [
        { id: '1', version: 100, value: 1.0 },
        { id: '2', version: 999, value: 1.0 }, // Different version, should be ignored
        { id: '3', version: 100, value: 0.0 },
        { id: '4', version: 200, value: 1.0 },
        { id: '5', version: 200, value: 0.0 },
      ];

      const result = await service.createExperimentRewardsSummary(
        refWithConditions as any,
        rewardsData as any,
        mockLogger as any
      );

      // Version 999 should not be counted
      expect(result[0].total).toBe(2); // Only version 100
      expect(result[1].total).toBe(2); // Only version 200
    });

    it('should handle condition with no rewards', async () => {
      const refWithConditions = {
        ...mockMoocletExperimentRef,
        experimentId: 'exp-123',
        versionConditionMaps: [
          {
            experimentConditionId: 'condition-1',
            moocletVersionId: 100,
            experimentCondition: { conditionCode: 'Control', order: 0 },
          },
          {
            experimentConditionId: 'condition-2',
            moocletVersionId: 200,
            experimentCondition: { conditionCode: 'Treatment', order: 1 },
          },
        ],
      };

      const rewardsData = [
        { id: '1', version: 100, value: 1.0 },
        { id: '2', version: 100, value: 0.0 },
        // No rewards for version 200
      ];

      const result = await service.createExperimentRewardsSummary(
        refWithConditions as any,
        rewardsData as any,
        mockLogger as any
      );

      expect(result[1]).toEqual({
        conditionCode: 'Treatment',
        successes: 0,
        failures: 0,
        total: 0,
        successRate: '0.0%',
        order: 1,
      });
    });
  });

  describe('private helper methods', () => {
    describe('findMoocletExperimentRefById', () => {
      it('should return mooclet ref when found', async () => {
        const request: RewardValidator = {
          experimentId: 'experiment-123',
          rewardValue: BinaryRewardAllowedValue.SUCCESS,
          context: undefined,
          decisionPoint: undefined,
        };

        mockMoocletExperimentRefRepository.findOne.mockResolvedValue(mockMoocletExperimentRef as MoocletExperimentRef);
        mockIndividualEnrollmentRepository.findEnrollments.mockResolvedValue([mockEnrollment as IndividualEnrollment]);

        const result = await service.sendReward(mockUser, request, mockLogger as any);

        expect(mockMoocletExperimentRefRepository.findOne).toHaveBeenCalledTimes(1);
        expect(result.message).toBe('Reward sent to mooclet successfully.');
      });

      it('should query with correct relations', async () => {
        const request: RewardValidator = {
          experimentId: 'experiment-123',
          rewardValue: BinaryRewardAllowedValue.SUCCESS,
          context: undefined,
          decisionPoint: undefined,
        };

        mockMoocletExperimentRefRepository.findOne.mockResolvedValue(mockMoocletExperimentRef as MoocletExperimentRef);
        mockIndividualEnrollmentRepository.findEnrollments.mockResolvedValue([mockEnrollment as IndividualEnrollment]);

        await service.sendReward(mockUser, request, mockLogger as any);

        expect(mockMoocletExperimentRefRepository.findOne).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({ experimentId: 'experiment-123' }),
            relations: expect.arrayContaining(['versionConditionMaps', 'experiment']),
          })
        );
      });
    });

    describe('findMoocletExperimentRefByDecisionPoint', () => {
      it('should use context, site, and target to find experiment', async () => {
        const request: RewardValidator = {
          experimentId: undefined,
          rewardValue: BinaryRewardAllowedValue.SUCCESS,
          context: 'home',
          decisionPoint: {
            site: 'site-1',
            target: 'target-1',
          },
        };

        mockMoocletExperimentRefRepository.findActivelyEnrollingMoocletExperimentsByContextSiteTarget.mockResolvedValue(
          [mockMoocletExperimentRef as MoocletExperimentRef]
        );
        mockIndividualEnrollmentRepository.findEnrollments.mockResolvedValue([mockEnrollment as IndividualEnrollment]);

        await service.sendReward(mockUser, request, mockLogger as any);

        expect(
          mockMoocletExperimentRefRepository.findActivelyEnrollingMoocletExperimentsByContextSiteTarget
        ).toHaveBeenCalledTimes(1);
        expect(
          mockMoocletExperimentRefRepository.findActivelyEnrollingMoocletExperimentsByContextSiteTarget
        ).toHaveBeenCalledWith('home', 'site-1', 'target-1');
      });
    });

    describe('getVersionIdByConditionId', () => {
      it('should return mooclet version ID when matching condition is found', async () => {
        const request: RewardValidator = {
          experimentId: 'experiment-123',
          rewardValue: BinaryRewardAllowedValue.SUCCESS,
          context: undefined,
          decisionPoint: undefined,
        };

        mockMoocletExperimentRefRepository.findOne.mockResolvedValue(mockMoocletExperimentRef as MoocletExperimentRef);
        mockIndividualEnrollmentRepository.findEnrollments.mockResolvedValue([mockEnrollment as IndividualEnrollment]);

        const result = await service.sendReward(mockUser, request, mockLogger as any);

        expect(result.reward.version).toBe(100); // version for condition-1
      });

      it('should throw 409 when no matching condition found', async () => {
        const request: RewardValidator = {
          experimentId: 'experiment-123',
          rewardValue: BinaryRewardAllowedValue.SUCCESS,
          context: undefined,
          decisionPoint: undefined,
        };

        const unmappedEnrollment = {
          ...mockEnrollment,
          conditionId: 'unmapped-condition',
        };

        mockMoocletExperimentRefRepository.findOne.mockResolvedValue(mockMoocletExperimentRef as MoocletExperimentRef);
        mockIndividualEnrollmentRepository.findEnrollments.mockResolvedValue([
          unmappedEnrollment as IndividualEnrollment,
        ]);

        await expect(service.sendReward(mockUser, request, mockLogger as any)).rejects.toThrow(HttpError);

        try {
          await service.sendReward(mockUser, request, mockLogger as any);
        } catch (error) {
          expect((error as HttpError).httpCode).toBe(409);
        }
      });

      it('should correctly match when multiple maps exist', async () => {
        const request: RewardValidator = {
          experimentId: 'experiment-123',
          rewardValue: BinaryRewardAllowedValue.SUCCESS,
          context: undefined,
          decisionPoint: undefined,
        };

        const refWithMultipleMaps = {
          ...mockMoocletExperimentRef,
          versionConditionMaps: [
            { experimentConditionId: 'condition-1', moocletVersionId: 100 },
            { experimentConditionId: 'condition-2', moocletVersionId: 200 },
            { experimentConditionId: 'condition-3', moocletVersionId: 300 },
          ],
        };

        const enrollmentCondition3 = {
          ...mockEnrollment,
          conditionId: 'condition-3',
        };

        mockMoocletExperimentRefRepository.findOne.mockResolvedValue(refWithMultipleMaps as any);
        mockIndividualEnrollmentRepository.findEnrollments.mockResolvedValue([
          enrollmentCondition3 as IndividualEnrollment,
        ]);

        const result = await service.sendReward(mockUser, request, mockLogger as any);

        expect(result.reward.version).toBe(300);
      });

      it('should throw 409 when versionConditionMaps is empty', async () => {
        const request: RewardValidator = {
          experimentId: 'experiment-123',
          rewardValue: BinaryRewardAllowedValue.SUCCESS,
          context: undefined,
          decisionPoint: undefined,
        };

        const refWithEmptyMaps = {
          ...mockMoocletExperimentRef,
          versionConditionMaps: [],
        };

        mockMoocletExperimentRefRepository.findOne.mockResolvedValue(refWithEmptyMaps as any);
        mockIndividualEnrollmentRepository.findEnrollments.mockResolvedValue([mockEnrollment as IndividualEnrollment]);

        await expect(service.sendReward(mockUser, request, mockLogger as any)).rejects.toThrow(HttpError);

        try {
          await service.sendReward(mockUser, request, mockLogger as any);
        } catch (error) {
          expect((error as HttpError).httpCode).toBe(409);
        }
      });
    });
  });
});
