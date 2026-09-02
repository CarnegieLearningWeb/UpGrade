import { ThompsonSamplingRewardService } from '../../../src/api/services/ThompsonSamplingRewardService';
import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';
import { BinaryRewardAllowedValue, EXPERIMENT_STATE } from 'upgrade_types';
import { RewardValidator } from '../../../src/api/controllers/validators/RewardValidator';
import { RequestedExperimentUser } from '../../../src/api/controllers/validators/ExperimentUserValidator';
import { configureLogger } from '../../utils/logger';

const logger = new UpgradeLogger();

const EXPERIMENT_ID = 'experiment-1';
const CONDITION_ID = 'condition-1';
const USER_ID = 'user-1';

function makeUser(): RequestedExperimentUser {
  return { id: USER_ID, requestedUserId: USER_ID } as RequestedExperimentUser;
}

function makeRequest(rewardValue: BinaryRewardAllowedValue = BinaryRewardAllowedValue.SUCCESS): RewardValidator {
  return { experimentId: EXPERIMENT_ID, rewardValue } as RewardValidator;
}

describe('ThompsonSamplingRewardService', () => {
  beforeAll(() => {
    configureLogger();
  });

  let tsRewardRepository: any;
  let posteriorStateRepository: any;
  let tsConfigRepository: any;
  let individualEnrollmentRepository: any;
  let service: ThompsonSamplingRewardService;

  // In-memory posterior state row, mutated by the mocked increment/update calls so
  // assertions can inspect the final counts after one or more recordReward() calls.
  let state: {
    id: string;
    successCount: number;
    failureCount: number;
    totalCount: number;
    pendingSuccessCount: number;
    pendingFailureCount: number;
    pendingTotalCount: number;
  };

  function makeConfig(batchSize?: number) {
    return {
      experimentId: EXPERIMENT_ID,
      batchSize,
      experiment: { state: EXPERIMENT_STATE.ENROLLING },
    };
  }

  beforeEach(() => {
    state = {
      id: 'state-1',
      successCount: 0,
      failureCount: 0,
      totalCount: 0,
      pendingSuccessCount: 0,
      pendingFailureCount: 0,
      pendingTotalCount: 0,
    };

    tsRewardRepository = { save: jest.fn().mockResolvedValue(undefined) };

    posteriorStateRepository = {
      findByConditionId: jest.fn().mockResolvedValue(state),
      increment: jest.fn((criteria: { id: string }, column: keyof typeof state, amount: number) => {
        (state as any)[column] += amount;
        return Promise.resolve(undefined);
      }),
      findOne: jest.fn().mockImplementation(() => Promise.resolve({ ...state })),
      update: jest.fn((criteria: { id: string }, partial: Partial<typeof state>) => {
        Object.assign(state, partial);
        return Promise.resolve(undefined);
      }),
    };

    tsConfigRepository = {
      findOne: jest.fn().mockResolvedValue(makeConfig()),
      findByDecisionPoint: jest.fn().mockResolvedValue([]),
    };

    individualEnrollmentRepository = {
      findEnrollments: jest.fn().mockResolvedValue([{ conditionId: CONDITION_ID }]),
    };

    service = new ThompsonSamplingRewardService(
      tsRewardRepository,
      posteriorStateRepository,
      tsConfigRepository,
      individualEnrollmentRepository
    );
  });

  describe('warmup threshold (reward count)', () => {
    it('always persists the raw reward event regardless of batching', async () => {
      tsConfigRepository.findOne = jest.fn().mockResolvedValue(makeConfig(5));

      await service.recordReward(makeUser(), makeRequest(BinaryRewardAllowedValue.SUCCESS), logger);

      expect(tsRewardRepository.save).toHaveBeenCalledWith({
        experimentId: EXPERIMENT_ID,
        conditionId: CONDITION_ID,
        userId: USER_ID,
        success: true,
      });
    });

    it('increments totalCount immediately when batchSize is unset (default behavior)', async () => {
      tsConfigRepository.findOne = jest.fn().mockResolvedValue(makeConfig(undefined));

      await service.recordReward(makeUser(), makeRequest(BinaryRewardAllowedValue.SUCCESS), logger);

      expect(state.totalCount).toBe(1);
      expect(state.successCount).toBe(1);
      expect(state.pendingTotalCount).toBe(0);
    });

    it('increments totalCount immediately when batchSize is 1', async () => {
      tsConfigRepository.findOne = jest.fn().mockResolvedValue(makeConfig(1));

      await service.recordReward(makeUser(), makeRequest(BinaryRewardAllowedValue.FAILURE), logger);

      expect(state.totalCount).toBe(1);
      expect(state.successCount).toBe(0);
      expect(state.failureCount).toBe(1);
      expect(state.pendingTotalCount).toBe(0);
    });
  });

  describe('batchSize', () => {
    it('buffers rewards as pending until batchSize is reached', async () => {
      tsConfigRepository.findOne = jest.fn().mockResolvedValue(makeConfig(3));

      await service.recordReward(makeUser(), makeRequest(BinaryRewardAllowedValue.SUCCESS), logger);
      expect(state.pendingTotalCount).toBe(1);
      expect(state.pendingSuccessCount).toBe(1);
      expect(state.pendingFailureCount).toBe(0);
      expect(state.totalCount).toBe(0);
      expect(state.successCount).toBe(0);

      await service.recordReward(makeUser(), makeRequest(BinaryRewardAllowedValue.FAILURE), logger);
      expect(state.pendingTotalCount).toBe(2);
      expect(state.pendingSuccessCount).toBe(1);
      expect(state.pendingFailureCount).toBe(1);
      expect(state.totalCount).toBe(0);
      expect(state.successCount).toBe(0);
    });

    it('flushes pending counts into successCount/totalCount once batchSize is reached', async () => {
      tsConfigRepository.findOne = jest.fn().mockResolvedValue(makeConfig(3));

      await service.recordReward(makeUser(), makeRequest(BinaryRewardAllowedValue.SUCCESS), logger);
      await service.recordReward(makeUser(), makeRequest(BinaryRewardAllowedValue.FAILURE), logger);
      await service.recordReward(makeUser(), makeRequest(BinaryRewardAllowedValue.SUCCESS), logger);

      expect(state.totalCount).toBe(3);
      expect(state.successCount).toBe(2);
      expect(state.failureCount).toBe(1);
      expect(state.pendingTotalCount).toBe(0);
      expect(state.pendingSuccessCount).toBe(0);
      expect(state.pendingFailureCount).toBe(0);
    });

    it('resets the pending buffer after a flush so the next batch starts fresh', async () => {
      tsConfigRepository.findOne = jest.fn().mockResolvedValue(makeConfig(2));

      // First batch of 2 flushes...
      await service.recordReward(makeUser(), makeRequest(BinaryRewardAllowedValue.SUCCESS), logger);
      await service.recordReward(makeUser(), makeRequest(BinaryRewardAllowedValue.SUCCESS), logger);
      expect(state.totalCount).toBe(2);
      expect(state.successCount).toBe(2);

      // ...a single reward into the next batch should only be pending, not yet applied.
      await service.recordReward(makeUser(), makeRequest(BinaryRewardAllowedValue.FAILURE), logger);
      expect(state.totalCount).toBe(2);
      expect(state.successCount).toBe(2);
      expect(state.pendingTotalCount).toBe(1);
      expect(state.pendingSuccessCount).toBe(0);
      expect(state.pendingFailureCount).toBe(1);
    });

    it('keeps pendingFailureCount readable without deriving it — always equals pendingTotalCount - pendingSuccessCount', async () => {
      tsConfigRepository.findOne = jest.fn().mockResolvedValue(makeConfig(10));

      const values = [
        BinaryRewardAllowedValue.SUCCESS,
        BinaryRewardAllowedValue.FAILURE,
        BinaryRewardAllowedValue.FAILURE,
        BinaryRewardAllowedValue.SUCCESS,
      ];
      for (const value of values) {
        await service.recordReward(makeUser(), makeRequest(value), logger);
      }

      expect(state.pendingSuccessCount).toBe(2);
      expect(state.pendingFailureCount).toBe(2);
      expect(state.pendingFailureCount).toBe(state.pendingTotalCount - state.pendingSuccessCount);
    });

    it('keeps failureCount readable without deriving it — always equals totalCount - successCount', async () => {
      tsConfigRepository.findOne = jest.fn().mockResolvedValue(makeConfig(4));

      const values = [
        BinaryRewardAllowedValue.SUCCESS,
        BinaryRewardAllowedValue.FAILURE,
        BinaryRewardAllowedValue.FAILURE,
        BinaryRewardAllowedValue.SUCCESS,
      ];
      for (const value of values) {
        await service.recordReward(makeUser(), makeRequest(value), logger);
      }

      expect(state.successCount).toBe(2);
      expect(state.failureCount).toBe(2);
      expect(state.failureCount).toBe(state.totalCount - state.successCount);
    });

    it('never drops rewards — total applied + pending always equals rewards recorded', async () => {
      tsConfigRepository.findOne = jest.fn().mockResolvedValue(makeConfig(4));

      const values = [
        BinaryRewardAllowedValue.SUCCESS,
        BinaryRewardAllowedValue.SUCCESS,
        BinaryRewardAllowedValue.FAILURE,
        BinaryRewardAllowedValue.SUCCESS,
        BinaryRewardAllowedValue.FAILURE,
      ];
      for (const value of values) {
        await service.recordReward(makeUser(), makeRequest(value), logger);
      }

      expect(state.totalCount + state.pendingTotalCount).toBe(values.length);
      expect(tsRewardRepository.save).toHaveBeenCalledTimes(values.length);
    });
  });
});
