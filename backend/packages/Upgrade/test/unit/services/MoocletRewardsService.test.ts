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
