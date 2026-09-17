import { randomUUID } from 'crypto';
import { performance } from 'perf_hooks';
import { DataSource, EntityManager, QueryRunner } from 'typeorm';
import { BatchDeleteEntity, DeletionReasonCode, UserRole } from 'upgrade_types';
import { BatchDeleteService } from '../../../src/api/services/BatchDeleteService';
import { ExperimentService } from '../../../src/api/services/ExperimentService';
import { FeatureFlagService } from '../../../src/api/services/FeatureFlagService';
import { SegmentService } from '../../../src/api/services/SegmentService';
import { FeatureFlagPrecomputedSegmentService } from '../../../src/api/services/FeatureFlagPrecomputedSegmentService';
import { ExperimentPrecomputedSegmentService } from '../../../src/api/services/ExperimentPrecomputedSegmentService';
import { MoocletExperimentService } from '../../../src/api/services/MoocletExperimentService';
import { MoocletError } from '../../../src/api/errors/MoocletError';
import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';
import { env } from '../../../src/env';
import { DeletionRepository } from '../../../src/api/repositories/DeletionRepository';

jest.mock('perf_hooks', () => ({ performance: { now: jest.fn(() => 0) } }));

describe('BatchDeleteService transaction outcomes', () => {
  const entities: BatchDeleteEntity[] = ['experiments', 'flags', 'segments'];
  const user = { email: 'batch@example.com', firstName: 'Batch', lastName: 'User', role: UserRole.ADMIN };
  const logger = { error: jest.fn(), info: jest.fn() } as unknown as UpgradeLogger;
  let ids: string[];
  let service: BatchDeleteService;
  let runners: QueryRunner[];
  let mutations: string[];
  let experiments: { delete: jest.Mock };
  let flags: { delete: jest.Mock };
  let segments: { deleteSegment: jest.Mock };
  let mooclets: { getMoocletExperimentRefByUpgradeExperimentId: jest.Mock; syncDelete: jest.Mock };
  let createQueryRunner: jest.Mock;
  let work: jest.Mock;
  let originalMooclet: boolean;
  let configureRunner: (runner: QueryRunner, index: number) => void;

  beforeEach(() => {
    ids = [randomUUID(), randomUUID(), randomUUID()];
    mutations = [];
    runners = [];
    (performance.now as jest.Mock).mockReturnValue(0);
    originalMooclet = env.mooclets.enabled;
    env.mooclets.enabled = false;
    configureRunner = () => undefined;
    createQueryRunner = jest.fn(() => {
      let active = false;
      const runner = {
        get isTransactionActive() {
          return active;
        },
        manager: {
          query: jest.fn().mockResolvedValue([]),
          getRepository: jest.fn(() => ({
            findOne: jest.fn(async ({ where }) => ({ id: where.id })),
          })),
        },
        connect: jest.fn().mockResolvedValue(undefined),
        startTransaction: jest.fn(async () => {
          active = true;
        }),
        commitTransaction: jest.fn(async () => {
          active = false;
        }),
        rollbackTransaction: jest.fn(async () => {
          active = false;
        }),
        release: jest.fn().mockResolvedValue(undefined),
      } as unknown as QueryRunner;
      configureRunner(runner, runners.length);
      runners.push(runner);
      return runner;
    });
    work = jest.fn(async (id) => {
      mutations.push(id);
      return [{ id }];
    });
    experiments = { delete: jest.fn((id, _user, options) => options.executeTransaction(() => work(id))) };
    flags = { delete: jest.fn((id, _user, _logger, transaction) => transaction(() => work(id))) };
    segments = {
      deleteSegment: jest.fn((id, _logger, transaction) =>
        transaction(async () => {
          const [row] = await work(id);
          return row;
        })
      ),
    };
    mooclets = {
      getMoocletExperimentRefByUpgradeExperimentId: jest.fn().mockResolvedValue(undefined),
      syncDelete: jest.fn((params, transaction) => transaction(() => work(params.experimentId))),
    };
    service = new BatchDeleteService(
      { createQueryRunner } as unknown as DataSource,
      experiments as unknown as ExperimentService,
      flags as unknown as FeatureFlagService,
      segments as unknown as SegmentService,
      mooclets as unknown as MoocletExperimentService,
      new DeletionRepository(DeletionRepository, {} as EntityManager)
    );
  });
  afterEach(() => {
    env.mooclets.enabled = originalMooclet;
    jest.restoreAllMocks();
  });

  test.each(entities)('%s rejects unauthorized users before any transaction or mutation', async (entity) => {
    await expect(service.delete(entity, ids, undefined, logger)).rejects.toMatchObject({ httpCode: 401 });
    for (const role of [UserRole.READER, undefined, 'unknown' as UserRole]) {
      await expect(service.delete(entity, ids, { ...user, role }, logger)).rejects.toMatchObject({ httpCode: 403 });
    }
    expect(createQueryRunner).not.toHaveBeenCalled();
  });

  test.each(entities)('%s commits sequentially and normalizes existing service responses', async (entity) => {
    const result = await service.delete(entity, ids, user, logger);
    expect(result).toEqual({ phase: 'executed', results: ids.map((id) => ({ id, outcome: 'deleted' })) });
    expect(mutations).toEqual(ids);
    for (const runner of runners) {
      expect(runner.commitTransaction).toHaveBeenCalledTimes(1);
      expect(runner.rollbackTransaction).not.toHaveBeenCalled();
      expect(runner.release).toHaveBeenCalledTimes(1);
    }
  });

  test('finishes both owner recomputations before deleting the next segment', async () => {
    const selectedIds = ids.slice(0, 2);
    const saved = { flags: [] as string[], experiments: [] as string[] };
    let releaseFirstWrites: () => void;
    const firstWrites = new Promise<void>((resolve) => (releaseFirstWrites = resolve));
    const recompute = (entity: keyof typeof saved) => async () => {
      const members = selectedIds.filter((id) => !mutations.includes(id));
      if (members.length) await firstWrites;
      saved[entity] = members;
    };
    // Use the real deletion/scheduling methods, holding the first post-delete writes to expose overlap.
    const segmentService = Object.assign(Object.create(SegmentService.prototype), {
      featureFlagPrecomputedSegmentService: Object.assign(
        Object.create(FeatureFlagPrecomputedSegmentService.prototype),
        {
          getAffectedFlagIds: async () => ['flag'],
          recomputeOwner: recompute('flags'),
        }
      ),
      experimentPrecomputedSegmentService: Object.assign(Object.create(ExperimentPrecomputedSegmentService.prototype), {
        getAffectedExperimentIds: async () => ['experiment'],
        recomputeOwner: recompute('experiments'),
      }),
      cacheService: { resetPrefixCache: jest.fn().mockResolvedValue(undefined) },
      deleteSegmentAndPrivateSubsegments: async (id) => (await work(id))[0],
    });
    segments.deleteSegment.mockImplementation(segmentService.deleteSegment.bind(segmentService));
    let completed = false;
    const deletion = service.delete('segments', selectedIds, user, logger).then((result) => {
      completed = true;
      return result;
    });
    try {
      await new Promise<void>((resolve) => setImmediate(resolve));
      expect(mutations).toEqual([selectedIds[0]]);
      expect(completed).toBe(false);
    } finally {
      releaseFirstWrites();
      await deletion;
    }
    expect(saved).toEqual({ flags: [], experiments: [] });
    expect((await deletion).results.map((item) => item.outcome)).toEqual(['deleted', 'deleted']);
  });

  test('stops without mutation when the target lookup fails', async () => {
    configureRunner = (runner) => {
      (runner.manager.getRepository as jest.Mock).mockReturnValue({
        findOne: jest.fn().mockRejectedValue(new Error('read failed')),
      });
    };
    const result = await service.delete('flags', ids, user, logger);
    expect(result.results.map((item) => item.outcome)).toEqual(['failed', 'not_attempted', 'not_attempted']);
    expect(result.results[0].reasonCode).toBe(DeletionReasonCode.DELETE_FAILED);
    expect(mutations).toEqual([]);
    expect(runners[0].rollbackTransaction).toHaveBeenCalledTimes(1);
  });

  test('reports no attempted mutation when every target is missing', async () => {
    configureRunner = (runner) => {
      (runner.manager.getRepository as jest.Mock).mockReturnValue({ findOne: jest.fn().mockResolvedValue(null) });
    };
    expect(await service.delete('flags', ids, user, logger)).toEqual({
      phase: 'rejected',
      results: ids.map((id) => ({ id, outcome: 'not_found', reasonCode: DeletionReasonCode.NOT_FOUND })),
    });
    expect(mutations).toEqual([]);
    expect(runners.every((runner) => (runner.rollbackTransaction as jest.Mock).mock.calls.length === 1)).toBe(true);
  });

  test.each(['rollbackTransaction', 'release'] as const)(
    'stops when %s fails even if the target was missing before mutation',
    async (method) => {
      configureRunner = (runner) => {
        (runner.manager.getRepository as jest.Mock).mockReturnValue({
          findOne: jest.fn().mockResolvedValue(null),
        });
        (runner[method] as jest.Mock).mockRejectedValue(new Error('connection lost'));
      };
      const result = await service.delete('flags', ids, user, logger);
      expect(result.results.map((item) => item.outcome)).toEqual(['failed', 'not_attempted', 'not_attempted']);
      expect(mutations).toEqual([]);
      expect(createQueryRunner).toHaveBeenCalledTimes(1);
    }
  );

  test.each([0, 1])('stops after item %i fails and preserves earlier commits', async (index) => {
    work.mockImplementation(async (id) => {
      if (id === ids[index]) throw new Error('cleanup failed');
      mutations.push(id);
      return [{ id }];
    });
    const result = await service.delete('flags', ids, user, logger);
    expect(result.results.map((item) => item.outcome)).toEqual(
      index === 0 ? ['failed', 'not_attempted', 'not_attempted'] : ['deleted', 'failed', 'not_attempted']
    );
    expect(runners[index].rollbackTransaction).toHaveBeenCalledTimes(1);
    expect(runners[index].commitTransaction).not.toHaveBeenCalled();
    expect(mutations).toEqual(ids.slice(0, index));
  });

  test.each(entities)('%s skips a missing locked target and continues deletion', async (entity) => {
    configureRunner = (runner, index) => {
      if (index !== 0) return;
      (runner.manager.getRepository as jest.Mock).mockReturnValue({
        findOne: jest.fn().mockResolvedValue(null),
      });
    };
    const result = await service.delete(entity, ids, user, logger);
    expect(result.results[0].outcome).toBe('not_found');
    expect(result.results.slice(1).map((item) => item.outcome)).toEqual(['deleted', 'deleted']);
    expect(mutations).toEqual(ids.slice(1));
  });

  test('reports a lock timeout only after a confirmed rollback', async () => {
    work.mockRejectedValue(Object.assign(new Error('lock wait'), { code: '55P03' }));
    const result = await service.delete('flags', ids, user, logger);
    expect(result.results[0]).toEqual({ id: ids[0], outcome: 'failed', reasonCode: DeletionReasonCode.LOCK_TIMEOUT });
    expect(runners[0].rollbackTransaction).toHaveBeenCalled();
  });

  test('does not claim rollback when COMMIT acknowledgment is lost, even if ROLLBACK succeeds', async () => {
    configureRunner = (runner) => {
      (runner.commitTransaction as jest.Mock).mockRejectedValue(new Error('connection lost'));
    };
    const result = await service.delete('experiments', ids, user, logger);
    expect(result.results[0]).toEqual({
      id: ids[0],
      outcome: 'unknown',
      reasonCode: DeletionReasonCode.OUTCOME_UNKNOWN,
    });
    expect(result.results[1].outcome).toBe('not_attempted');
    expect(runners[0].rollbackTransaction).toHaveBeenCalled();
  });

  test('reports unknown when mutation failed and rollback cannot be confirmed', async () => {
    work.mockRejectedValue(new Error('write lost'));
    configureRunner = (runner) => {
      (runner.rollbackTransaction as jest.Mock).mockRejectedValue(new Error('rollback lost'));
    };
    const result = await service.delete('flags', ids, user, logger);
    expect(result.results[0].outcome).toBe('unknown');
  });

  test('does not promote an empty legacy deletion response to a committed success', async () => {
    work.mockResolvedValue([]);
    const result = await service.delete('experiments', ids, user, logger);
    expect(result.results[0].outcome).toBe('failed');
    expect(runners[0].commitTransaction).not.toHaveBeenCalled();
    expect(runners[0].rollbackTransaction).toHaveBeenCalled();
  });

  test('keeps a known committed deletion when later cache cleanup fails and stops remaining items', async () => {
    const original = segments.deleteSegment.getMockImplementation();
    segments.deleteSegment.mockImplementation(async (...args) => {
      await original(...args);
      throw new Error('cache failed');
    });
    const result = await service.delete('segments', ids, user, logger);
    expect(result.results[0]).toEqual({
      id: ids[0],
      outcome: 'deleted',
      reasonCode: DeletionReasonCode.POST_DELETE_FAILED,
    });
    expect(result.results[1].outcome).toBe('not_attempted');
    expect(runners[0].rollbackTransaction).not.toHaveBeenCalled();
  });

  test('keeps a committed deletion when connection release fails', async () => {
    configureRunner = (runner) => {
      (runner.release as jest.Mock).mockRejectedValue(new Error('release failed'));
    };
    expect((await service.delete('flags', ids, user, logger)).results[0]).toMatchObject({
      outcome: 'deleted',
      reasonCode: DeletionReasonCode.POST_DELETE_FAILED,
    });
  });

  test('uses the existing Mooclet branch and reports external failure after local rollback', async () => {
    env.mooclets.enabled = true;
    const ref = { id: randomUUID() };
    mooclets.getMoocletExperimentRefByUpgradeExperimentId.mockResolvedValue(ref);
    work.mockRejectedValue(new MoocletError('remote deletion failed'));
    const result = await service.delete('experiments', ids, user, logger);
    expect(experiments.delete).not.toHaveBeenCalled();
    expect(mooclets.syncDelete).toHaveBeenCalledWith(
      expect.objectContaining({ moocletExperimentRef: ref }),
      expect.any(Function)
    );
    expect(result.results[0]).toEqual({
      id: ids[0],
      outcome: 'failed',
      reasonCode: DeletionReasonCode.EXTERNAL_SYNC_FAILED,
    });
    expect(runners[0].rollbackTransaction).toHaveBeenCalled();
  });

  test('uses ordinary experiment deletion when Mooclet is enabled but there is no reference', async () => {
    env.mooclets.enabled = true;
    await service.delete('experiments', ids, user, logger);
    expect(experiments.delete).toHaveBeenCalledTimes(3);
    expect(mooclets.syncDelete).not.toHaveBeenCalled();
  });

  test('stops starting items after the budget, without abandoning a committed item', async () => {
    work.mockImplementation(async (id) => {
      (performance.now as jest.Mock).mockReturnValue(60_001);
      return [{ id }];
    });
    const result = await service.delete('flags', ids, user, logger);
    expect(result.results).toEqual([
      { id: ids[0], outcome: 'deleted' },
      ...ids
        .slice(1)
        .map((id) => ({ id, outcome: 'not_attempted', reasonCode: DeletionReasonCode.BATCH_BUDGET_EXCEEDED })),
    ]);
    expect(createQueryRunner).toHaveBeenCalledTimes(1);
  });

  test('does not start execution if the admission budget has expired', async () => {
    (performance.now as jest.Mock).mockReturnValueOnce(0).mockReturnValue(60_001);
    expect(await service.delete('flags', ids, user, logger)).toEqual({
      phase: 'rejected',
      results: ids.map((id) => ({
        id,
        outcome: 'not_attempted',
        reasonCode: DeletionReasonCode.BATCH_BUDGET_EXCEEDED,
      })),
    });
    expect(createQueryRunner).not.toHaveBeenCalled();
  });

  test('does not mutate when the budget expires while acquiring the target lock', async () => {
    configureRunner = (runner) => {
      (runner.manager.getRepository as jest.Mock).mockReturnValue({
        findOne: jest.fn(async () => {
          (performance.now as jest.Mock).mockReturnValue(60_001);
          return { id: ids[0] };
        }),
      });
    };
    const result = await service.delete('flags', ids, user, logger);
    expect(result.results[0]).toMatchObject({
      outcome: 'not_attempted',
      reasonCode: DeletionReasonCode.BATCH_BUDGET_EXCEEDED,
    });
    expect(mutations).toEqual([]);
    expect(runners[0].rollbackTransaction).toHaveBeenCalled();
  });
});
