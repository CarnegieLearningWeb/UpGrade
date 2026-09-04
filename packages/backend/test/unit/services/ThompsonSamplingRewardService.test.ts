import { ThompsonSamplingRewardService } from '../../../src/api/services/ThompsonSamplingRewardService';
import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';
import { BinaryRewardAllowedValue, EXPERIMENT_STATE } from 'upgrade_types';
import { RewardValidator } from '../../../src/api/controllers/validators/RewardValidator';
import { RequestedExperimentUser } from '../../../src/api/controllers/validators/ExperimentUserValidator';
import { configureLogger } from '../../utils/logger';

const logger = new UpgradeLogger();

const EXPERIMENT_ID = 'experiment-1';
const CONFIG_ID = 'config-1';
const CONDITION_ID = 'condition-1';
const CONDITION_A_ID = 'condition-a';
const CONDITION_B_ID = 'condition-b';
const USER_ID = 'user-1';

interface PosteriorStateRow {
  id: string;
  configId: string;
  conditionId: string;
  successCount: number;
  failureCount: number;
  totalCount: number;
  pendingSuccessCount: number;
  pendingFailureCount: number;
  pendingTotalCount: number;
}

function makeUser(): RequestedExperimentUser {
  return { id: USER_ID, requestedUserId: USER_ID } as RequestedExperimentUser;
}

function makeRequest(rewardValue: BinaryRewardAllowedValue = BinaryRewardAllowedValue.SUCCESS): RewardValidator {
  return { experimentId: EXPERIMENT_ID, rewardValue } as RewardValidator;
}

function makeStateRow(id: string, conditionId: string): PosteriorStateRow {
  return {
    id,
    configId: CONFIG_ID,
    conditionId,
    successCount: 0,
    failureCount: 0,
    totalCount: 0,
    pendingSuccessCount: 0,
    pendingFailureCount: 0,
    pendingTotalCount: 0,
  };
}

// acceptReward() fires processReward() without awaiting it, so tests that exercise the
// background path need to let its promise chain drain before asserting on side effects.
function flushPromises(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}

// The default test double: caching is transparent (always misses through to the source), so
// most tests can ignore caching entirely and assert on repository calls as before.
function makePassthroughCacheService() {
  return {
    wrap: jest.fn((_key: string, fn: () => Promise<any>) => fn()),
    resetPrefixCache: jest.fn().mockResolvedValue(undefined),
  };
}

// A real (in-memory) cache double, for the tests that specifically exercise caching behavior.
function makeMemoizingCacheService() {
  const store = new Map<string, unknown>();
  return {
    wrap: jest.fn(async (key: string, fn: () => Promise<unknown>) => {
      if (store.has(key)) return store.get(key);
      const value = await fn();
      store.set(key, value);
      return value;
    }),
    resetPrefixCache: jest.fn(async (prefix: string) => {
      for (const key of Array.from(store.keys())) {
        if (key.startsWith(prefix)) store.delete(key);
      }
    }),
  };
}

describe('ThompsonSamplingRewardService', () => {
  beforeAll(() => {
    configureLogger();
  });

  let tsRewardRepository: any;
  let posteriorStateRepository: any;
  let tsConfigRepository: any;
  let individualEnrollmentRepository: any;
  let cacheService: ReturnType<typeof makePassthroughCacheService>;
  let service: ThompsonSamplingRewardService;

  // In-memory posterior state rows, keyed by conditionId, mutated by the mocked
  // increment/update calls so assertions can inspect the final counts after one
  // or more processReward() calls. Reward flow always resolves the row through
  // findByConditionId(conditionId), so the enrollment mock's conditionId is what
  // selects which row a given call mutates.
  let statesByCondition: Record<string, PosteriorStateRow>;

  function makeConfig(batchSize?: number) {
    return {
      experimentId: EXPERIMENT_ID,
      batchSize,
      experiment: { state: EXPERIMENT_STATE.ENROLLING },
    };
  }

  function allStates(): PosteriorStateRow[] {
    return Object.values(statesByCondition);
  }

  function findRowById(id: string): PosteriorStateRow {
    return allStates().find((row) => row.id === id);
  }

  // Fakes just enough of TypeORM's EntityManager for applyOrBufferReward()'s transaction: a
  // transaction() that runs the callback inline (no real DB transaction/lock semantics -- those
  // aren't meaningfully unit-testable without a real Postgres instance), a createQueryBuilder()
  // that filters the in-memory rows by configId (the only clause the service issues), and a
  // save() that persists in-memory since getMany() already hands back references into
  // statesByCondition, not copies.
  function makeFakeManager() {
    const manager: any = {
      transaction: (work: (m: any) => Promise<void>) => work(manager),
      createQueryBuilder: () => {
        let configIdFilter: string | undefined;
        const builder: any = {
          where: (_cond: string, params: { configId: string }) => {
            configIdFilter = params.configId;
            return builder;
          },
          orderBy: () => builder,
          setLock: () => builder,
          getMany: () => Promise.resolve(allStates().filter((row) => row.configId === configIdFilter)),
        };
        return builder;
      },
      save: jest.fn((entity: PosteriorStateRow) => {
        Object.assign(findRowById(entity.id), entity);
        return Promise.resolve(entity);
      }),
    };
    return manager;
  }

  beforeEach(() => {
    statesByCondition = {
      [CONDITION_ID]: makeStateRow('state-1', CONDITION_ID),
    };

    tsRewardRepository = { save: jest.fn().mockResolvedValue(undefined) };

    posteriorStateRepository = {
      findByConditionId: jest.fn((conditionId: string) => Promise.resolve(statesByCondition[conditionId])),
      manager: makeFakeManager(),
    };

    tsConfigRepository = {
      findOne: jest.fn().mockResolvedValue(makeConfig()),
      findByDecisionPoint: jest.fn().mockResolvedValue([]),
    };

    individualEnrollmentRepository = {
      findEnrollments: jest.fn().mockResolvedValue([{ conditionId: CONDITION_ID }]),
    };

    cacheService = makePassthroughCacheService();

    service = new ThompsonSamplingRewardService(
      tsRewardRepository,
      posteriorStateRepository,
      tsConfigRepository,
      individualEnrollmentRepository,
      cacheService as any
    );
  });

  describe('warmup threshold (reward count)', () => {
    it('always persists the raw reward event regardless of batching', async () => {
      tsConfigRepository.findOne = jest.fn().mockResolvedValue(makeConfig(5));

      await (service as any).processReward(makeUser(), makeRequest(BinaryRewardAllowedValue.SUCCESS), logger);

      expect(tsRewardRepository.save).toHaveBeenCalledWith({
        experimentId: EXPERIMENT_ID,
        conditionId: CONDITION_ID,
        userId: USER_ID,
        success: true,
      });
    });

    it('increments totalCount immediately when batchSize is unset (default behavior)', async () => {
      tsConfigRepository.findOne = jest.fn().mockResolvedValue(makeConfig(undefined));

      await (service as any).processReward(makeUser(), makeRequest(BinaryRewardAllowedValue.SUCCESS), logger);

      const state = statesByCondition[CONDITION_ID];
      expect(state.totalCount).toBe(1);
      expect(state.successCount).toBe(1);
      expect(state.pendingTotalCount).toBe(0);
    });

    it('increments totalCount immediately when batchSize is 1', async () => {
      tsConfigRepository.findOne = jest.fn().mockResolvedValue(makeConfig(1));

      await (service as any).processReward(makeUser(), makeRequest(BinaryRewardAllowedValue.FAILURE), logger);

      const state = statesByCondition[CONDITION_ID];
      expect(state.totalCount).toBe(1);
      expect(state.successCount).toBe(0);
      expect(state.failureCount).toBe(1);
      expect(state.pendingTotalCount).toBe(0);
    });
  });

  describe('batchSize (single condition)', () => {
    it('buffers rewards as pending until batchSize is reached', async () => {
      tsConfigRepository.findOne = jest.fn().mockResolvedValue(makeConfig(3));

      await (service as any).processReward(makeUser(), makeRequest(BinaryRewardAllowedValue.SUCCESS), logger);
      let state = statesByCondition[CONDITION_ID];
      expect(state.pendingTotalCount).toBe(1);
      expect(state.pendingSuccessCount).toBe(1);
      expect(state.pendingFailureCount).toBe(0);
      expect(state.totalCount).toBe(0);
      expect(state.successCount).toBe(0);

      await (service as any).processReward(makeUser(), makeRequest(BinaryRewardAllowedValue.FAILURE), logger);
      state = statesByCondition[CONDITION_ID];
      expect(state.pendingTotalCount).toBe(2);
      expect(state.pendingSuccessCount).toBe(1);
      expect(state.pendingFailureCount).toBe(1);
      expect(state.totalCount).toBe(0);
      expect(state.successCount).toBe(0);
    });

    it('flushes pending counts into successCount/totalCount once batchSize is reached', async () => {
      tsConfigRepository.findOne = jest.fn().mockResolvedValue(makeConfig(3));

      await (service as any).processReward(makeUser(), makeRequest(BinaryRewardAllowedValue.SUCCESS), logger);
      await (service as any).processReward(makeUser(), makeRequest(BinaryRewardAllowedValue.FAILURE), logger);
      await (service as any).processReward(makeUser(), makeRequest(BinaryRewardAllowedValue.SUCCESS), logger);

      const state = statesByCondition[CONDITION_ID];
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
      await (service as any).processReward(makeUser(), makeRequest(BinaryRewardAllowedValue.SUCCESS), logger);
      await (service as any).processReward(makeUser(), makeRequest(BinaryRewardAllowedValue.SUCCESS), logger);
      let state = statesByCondition[CONDITION_ID];
      expect(state.totalCount).toBe(2);
      expect(state.successCount).toBe(2);

      // ...a single reward into the next batch should only be pending, not yet applied.
      await (service as any).processReward(makeUser(), makeRequest(BinaryRewardAllowedValue.FAILURE), logger);
      state = statesByCondition[CONDITION_ID];
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
        await (service as any).processReward(makeUser(), makeRequest(value), logger);
      }

      const state = statesByCondition[CONDITION_ID];
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
        await (service as any).processReward(makeUser(), makeRequest(value), logger);
      }

      const state = statesByCondition[CONDITION_ID];
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
        await (service as any).processReward(makeUser(), makeRequest(value), logger);
      }

      const state = statesByCondition[CONDITION_ID];
      expect(state.totalCount + state.pendingTotalCount).toBe(values.length);
      expect(tsRewardRepository.save).toHaveBeenCalledTimes(values.length);
    });
  });

  describe('batchSize (across conditions of the same experiment)', () => {
    beforeEach(() => {
      statesByCondition = {
        [CONDITION_A_ID]: makeStateRow('state-a', CONDITION_A_ID),
        [CONDITION_B_ID]: makeStateRow('state-b', CONDITION_B_ID),
      };
    });

    function rewardCondition(conditionId: string, value: BinaryRewardAllowedValue) {
      individualEnrollmentRepository.findEnrollments = jest.fn().mockResolvedValue([{ conditionId }]);
      return (service as any).processReward(makeUser(), makeRequest(value), logger);
    }

    it('counts pending rewards for batchSize against the whole experiment, not per condition', async () => {
      tsConfigRepository.findOne = jest.fn().mockResolvedValue(makeConfig(5));

      // 4 rewards land on condition A, 1 on condition B — 5 total, so batchSize=5
      // should flush even though neither condition alone reached 5.
      await rewardCondition(CONDITION_A_ID, BinaryRewardAllowedValue.SUCCESS);
      await rewardCondition(CONDITION_A_ID, BinaryRewardAllowedValue.SUCCESS);
      await rewardCondition(CONDITION_A_ID, BinaryRewardAllowedValue.SUCCESS);
      await rewardCondition(CONDITION_A_ID, BinaryRewardAllowedValue.FAILURE);

      const stateA = statesByCondition[CONDITION_A_ID];
      const stateB = statesByCondition[CONDITION_B_ID];
      expect(stateA.pendingTotalCount).toBe(4);
      expect(stateA.totalCount).toBe(0);
      expect(stateB.pendingTotalCount).toBe(0);

      await rewardCondition(CONDITION_B_ID, BinaryRewardAllowedValue.SUCCESS);

      // The 5th reward (on B) tips the shared batch over the threshold, so both
      // conditions' pending buffers flush together.
      expect(stateA.totalCount).toBe(4);
      expect(stateA.successCount).toBe(3);
      expect(stateA.failureCount).toBe(1);
      expect(stateA.pendingTotalCount).toBe(0);

      expect(stateB.totalCount).toBe(1);
      expect(stateB.successCount).toBe(1);
      expect(stateB.pendingTotalCount).toBe(0);
    });

    it('does not flush a condition with no pending rewards of its own', async () => {
      tsConfigRepository.findOne = jest.fn().mockResolvedValue(makeConfig(2));

      // Condition B never receives a reward in this batch; only A's two rewards
      // trip the threshold. B's row should be left untouched (still all zeros).
      await rewardCondition(CONDITION_A_ID, BinaryRewardAllowedValue.SUCCESS);
      await rewardCondition(CONDITION_A_ID, BinaryRewardAllowedValue.SUCCESS);

      const stateB = statesByCondition[CONDITION_B_ID];
      expect(stateB.totalCount).toBe(0);
      expect(stateB.pendingTotalCount).toBe(0);
      expect(posteriorStateRepository.manager.save).not.toHaveBeenCalledWith(
        expect.objectContaining({ id: stateB.id })
      );
    });
  });

  describe('acceptReward (quick receipt, background processing)', () => {
    it('returns a receipt synchronously, without waiting on the DB', () => {
      // Never resolves — if acceptReward awaited this, the test would hang instead of returning.
      tsConfigRepository.findOne = jest.fn().mockReturnValue(new Promise(() => undefined));

      const request = makeRequest(BinaryRewardAllowedValue.SUCCESS);
      const result = service.acceptReward(makeUser(), request, logger);

      expect(result).toEqual({ message: 'Reward received and is being processed.', request });
    });

    it('logs the specific reason (once) when the background reward cannot be recorded', async () => {
      individualEnrollmentRepository.findEnrollments = jest.fn().mockResolvedValue([]); // no enrollment found
      const loggerMock: any = { info: jest.fn(), error: jest.fn(), warn: jest.fn() };

      const result = service.acceptReward(makeUser(), makeRequest(), loggerMock);
      expect(result.message).toBe('Reward received and is being processed.');

      await flushPromises();

      expect(loggerMock.error).toHaveBeenCalledTimes(1);
      expect(loggerMock.error).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('Could not find unique enrollment') })
      );
    });

    it('logs a single generic failure message for an unexpected (non-abort) error', async () => {
      tsConfigRepository.findOne = jest.fn().mockRejectedValue(new Error('connection reset'));
      const loggerMock: any = { info: jest.fn(), error: jest.fn(), warn: jest.fn() };

      service.acceptReward(makeUser(), makeRequest(), loggerMock);
      await flushPromises();

      expect(loggerMock.error).toHaveBeenCalledTimes(1);
      expect(loggerMock.error).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Unexpected error processing Thompson Sampling reward'),
          error: expect.any(Error),
        })
      );
    });

    it('still records the reward in the background after returning the receipt', async () => {
      const result = service.acceptReward(makeUser(), makeRequest(BinaryRewardAllowedValue.SUCCESS), logger);
      expect(result.message).toBe('Reward received and is being processed.');
      expect(tsRewardRepository.save).not.toHaveBeenCalled();

      await flushPromises();

      expect(tsRewardRepository.save).toHaveBeenCalledWith({
        experimentId: EXPERIMENT_ID,
        conditionId: CONDITION_ID,
        userId: USER_ID,
        success: true,
      });
    });
  });

  describe('config lookup caching', () => {
    beforeEach(() => {
      cacheService = makeMemoizingCacheService();
      service = new ThompsonSamplingRewardService(
        tsRewardRepository,
        posteriorStateRepository,
        tsConfigRepository,
        individualEnrollmentRepository,
        cacheService as any
      );
    });

    it('reuses a cached experimentId lookup across rewards instead of re-querying the DB', async () => {
      tsConfigRepository.findOne = jest.fn().mockResolvedValue(makeConfig());

      await (service as any).processReward(makeUser(), makeRequest(BinaryRewardAllowedValue.SUCCESS), logger);
      await (service as any).processReward(makeUser(), makeRequest(BinaryRewardAllowedValue.SUCCESS), logger);

      expect(tsConfigRepository.findOne).toHaveBeenCalledTimes(1);
      // Only the config lookup is cached — the reward itself is still recorded every time.
      expect(tsRewardRepository.save).toHaveBeenCalledTimes(2);
    });

    it('reuses a cached decision-point lookup across rewards instead of re-querying the DB', async () => {
      tsConfigRepository.findByDecisionPoint = jest.fn().mockResolvedValue([makeConfig()]);
      const dpRequest = (): RewardValidator =>
        ({
          rewardValue: BinaryRewardAllowedValue.SUCCESS,
          context: 'context-1',
          decisionPoint: { site: 'site-1', target: 'target-1' },
        } as RewardValidator);

      await (service as any).processReward(makeUser(), dpRequest(), logger);
      await (service as any).processReward(makeUser(), dpRequest(), logger);

      expect(tsConfigRepository.findByDecisionPoint).toHaveBeenCalledTimes(1);
    });

    it('does not share cache entries between different experiments', async () => {
      tsConfigRepository.findOne = jest.fn().mockResolvedValue(makeConfig());

      await (service as any).processReward(makeUser(), makeRequest(), logger);
      await (service as any).processReward(
        makeUser(),
        { experimentId: 'experiment-2', rewardValue: BinaryRewardAllowedValue.SUCCESS } as RewardValidator,
        logger
      );

      expect(tsConfigRepository.findOne).toHaveBeenCalledTimes(2);
    });
  });
});
