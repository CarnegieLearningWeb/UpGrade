import { ExperimentPrecomputedSegmentService } from '../../../src/api/services/ExperimentPrecomputedSegmentService';
import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';
import { CACHE_PREFIX } from 'upgrade_types';
import { configureLogger } from '../../utils/logger';

const logger = new UpgradeLogger();

// Build a segment-repository query-builder mock whose getMany() returns the fixtures matching the ids
// captured from the `.where('segment.id IN (:...ids)', { ids })` call. flattenSegmentMembers calls
// createQueryBuilder() once per recursion level, so each call returns a fresh builder resolving
// against the shared fixture map.
function makeSegmentRepoMock(fixtures: Record<string, any>) {
  const createQueryBuilder = jest.fn(() => {
    let capturedIds: string[] = [];
    const qb: any = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn((_sql: string, params: { ids: string[] }) => {
        capturedIds = params.ids;
        return qb;
      }),
      getMany: jest.fn(() => Promise.resolve(capturedIds.map((id) => fixtures[id]).filter(Boolean))),
    };
    return qb;
  });
  return { createQueryBuilder, findParentSegmentIds: jest.fn().mockResolvedValue([]) };
}

describe('ExperimentPrecomputedSegmentService', () => {
  beforeAll(() => {
    configureLogger();
  });

  let precomputedSegmentRepository: any;
  let experimentSegmentInclusionRepository: any;
  let experimentSegmentExclusionRepository: any;
  let experimentRepository: any;
  let segmentRepository: any;
  let cacheService: any;
  let service: ExperimentPrecomputedSegmentService;

  beforeEach(() => {
    precomputedSegmentRepository = {
      upsertByExperimentId: jest.fn().mockResolvedValue(undefined),
      findByExperimentIds: jest.fn().mockResolvedValue([]),
      find: jest.fn().mockResolvedValue([]),
    };
    experimentSegmentInclusionRepository = { find: jest.fn().mockResolvedValue([]) };
    experimentSegmentExclusionRepository = { find: jest.fn().mockResolvedValue([]) };
    experimentRepository = { find: jest.fn().mockResolvedValue([]) };
    segmentRepository = makeSegmentRepoMock({});
    cacheService = {
      delCache: jest.fn().mockResolvedValue(undefined),
      wrapMany: jest.fn(),
    };

    service = new ExperimentPrecomputedSegmentService(
      precomputedSegmentRepository,
      experimentSegmentInclusionRepository,
      experimentSegmentExclusionRepository,
      experimentRepository,
      segmentRepository,
      cacheService
    );
  });

  describe('recomputeForExperiment', () => {
    it('flattens individual + group members, recurses into sub-segments, dedupes, and upserts', async () => {
      // segA -> members u1, g1, and a sub-segment segChild (-> u2). segB (exclusion) -> u3.
      segmentRepository = makeSegmentRepoMock({
        segA: {
          id: 'segA',
          individualForSegment: [{ userId: 'u1' }],
          groupForSegment: [{ groupId: 'g1', type: 'schoolId' }],
          subSegments: [{ id: 'segChild' }],
        },
        segChild: {
          id: 'segChild',
          individualForSegment: [{ userId: 'u2' }],
          groupForSegment: [],
          subSegments: [],
        },
        segB: {
          id: 'segB',
          individualForSegment: [{ userId: 'u3' }],
          groupForSegment: [],
          subSegments: [],
        },
      });
      experimentSegmentInclusionRepository.find = jest.fn().mockResolvedValue([{ segment: { id: 'segA' } }]);
      experimentSegmentExclusionRepository.find = jest.fn().mockResolvedValue([{ segment: { id: 'segB' } }]);

      service = new ExperimentPrecomputedSegmentService(
        precomputedSegmentRepository,
        experimentSegmentInclusionRepository,
        experimentSegmentExclusionRepository,
        experimentRepository,
        segmentRepository,
        cacheService
      );

      await service.recomputeForExperiment('exp1', logger);

      expect(precomputedSegmentRepository.upsertByExperimentId).toHaveBeenCalledTimes(1);
      const [experimentId, inclusionIds, exclusionIds] =
        precomputedSegmentRepository.upsertByExperimentId.mock.calls[0];
      expect(experimentId).toEqual('exp1');
      // recursive sub-segment member u2 must be included alongside the direct members;
      // group members are namespaced with their type (schoolId:g1), individuals stay bare
      expect(inclusionIds.sort()).toEqual(['schoolId:g1', 'u1', 'u2']);
      expect(exclusionIds).toEqual(['u3']);
      // Experiment join tables have NO `enabled` column — the query must NOT filter on enabled
      // (unlike the feature-flag service).
      expect(experimentSegmentInclusionRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { experiment: { id: 'exp1' } } })
      );
      const inclusionWhere = experimentSegmentInclusionRepository.find.mock.calls[0][0].where;
      expect(inclusionWhere).not.toHaveProperty('enabled');
      // cache for this experiment is invalidated
      expect(cacheService.delCache).toHaveBeenCalledWith(
        CACHE_PREFIX.EXPERIMENT_PRECOMPUTED_SEGMENT_KEY_PREFIX + 'exp1'
      );
    });

    it('produces empty arrays when the experiment has no lists', async () => {
      await service.recomputeForExperiment('exp-empty', logger);

      expect(precomputedSegmentRepository.upsertByExperimentId).toHaveBeenCalledWith('exp-empty', [], []);
    });
  });

  describe('getAffectedExperimentIds (ancestor walk)', () => {
    it('includes experiments that reference an ANCESTOR (parent) segment of the edited segment', async () => {
      // An experiment references segParent; segChild is a sub-segment of segParent. Editing segChild
      // must mark the experiment referencing segParent as affected.
      experimentSegmentInclusionRepository.find = jest.fn(({ where }: any) =>
        Promise.resolve(where.segment.id === 'segParent' ? [{ experiment: { id: 'expP' } }] : [])
      );
      experimentSegmentExclusionRepository.find = jest.fn().mockResolvedValue([]);
      segmentRepository.findParentSegmentIds = jest.fn((id: string) =>
        Promise.resolve(id === 'segChild' ? ['segParent'] : [])
      );

      const affected = await service.getAffectedExperimentIds('segChild');

      expect(affected).toEqual(['expP']);
      expect(segmentRepository.findParentSegmentIds).toHaveBeenCalledWith('segChild');
    });

    it('does not infinitely recurse on a segment cycle', async () => {
      experimentSegmentInclusionRepository.find = jest.fn().mockResolvedValue([]);
      experimentSegmentExclusionRepository.find = jest.fn().mockResolvedValue([]);
      // segX <-> segY reference each other as parents
      segmentRepository.findParentSegmentIds = jest.fn((id: string) =>
        Promise.resolve(id === 'segX' ? ['segY'] : ['segX'])
      );

      const affected = await service.getAffectedExperimentIds('segX');

      expect(affected).toEqual([]);
    });
  });

  describe('getPrecomputedSets', () => {
    it('returns an empty map for an empty experiment id list without hitting the cache', async () => {
      const result = await service.getPrecomputedSets([]);

      expect(result.size).toEqual(0);
      expect(cacheService.wrapMany).not.toHaveBeenCalled();
    });

    it('maps experiment ids to rows positionally and skips missing (null) rows', async () => {
      const rowA = { experimentId: 'ea', inclusionIds: ['u1'], exclusionIds: [] };
      cacheService.wrapMany = jest.fn().mockResolvedValue([rowA, null]);

      const result = await service.getPrecomputedSets(['ea', 'eb']);

      expect(result.get('ea')).toEqual(rowA);
      expect(result.has('eb')).toEqual(false);
    });
  });

  describe('seedEmptyRowForExperiment', () => {
    it('inserts an empty row through the provided transaction manager (orIgnore)', async () => {
      const execute = jest.fn().mockResolvedValue(undefined);
      const values = jest.fn().mockReturnThis();
      const orIgnore = jest.fn().mockReturnThis();
      const qb: any = {
        insert: jest.fn().mockReturnThis(),
        into: jest.fn().mockReturnThis(),
        values,
        orIgnore,
        execute,
      };
      const manager: any = { createQueryBuilder: jest.fn(() => qb) };

      await service.seedEmptyRowForExperiment('exp-new', manager);

      expect(values).toHaveBeenCalledWith({ experimentId: 'exp-new', inclusionIds: [], exclusionIds: [] });
      expect(orIgnore).toHaveBeenCalled();
      expect(execute).toHaveBeenCalled();
    });
  });

  describe('backfillMissingExperiments', () => {
    it('recomputes only experiments that have no precomputed row yet', async () => {
      experimentRepository.find = jest.fn().mockResolvedValue([{ id: 'e1' }, { id: 'e2' }]);
      precomputedSegmentRepository.find = jest.fn().mockResolvedValue([{ experimentId: 'e1' }]);
      // backfill fans out through the shared base's recomputeOwner (recomputeForExperiment is a thin wrapper over it)
      const recomputeSpy = jest.spyOn(service, 'recomputeOwner').mockResolvedValue(undefined);

      await service.backfillMissingExperiments(logger);

      expect(recomputeSpy).toHaveBeenCalledTimes(1);
      expect(recomputeSpy).toHaveBeenCalledWith('e2', logger);
    });
  });

  describe('withRecompute', () => {
    it('resolves affected experiment ids BEFORE running work, returns work result, and recomputes after', async () => {
      const order: string[] = [];
      const resolveAffectedExperimentIds = jest.fn(async () => {
        order.push('resolve');
        return ['e1'];
      });
      const work = jest.fn(async () => {
        order.push('work');
        return 'done';
      });

      const result = await service.withRecompute(logger, resolveAffectedExperimentIds, work);

      expect(result).toBe('done');
      expect(order).toEqual(['resolve', 'work']); // resolve strictly before the mutation
      expect(resolveAffectedExperimentIds).toHaveBeenCalledTimes(1);
      expect(work).toHaveBeenCalledTimes(1);

      // the recompute is fired after work; let the fire-and-forget chain settle
      await new Promise((r) => setImmediate(r));
      expect(precomputedSegmentRepository.upsertByExperimentId).toHaveBeenCalledWith('e1', [], []);
    });

    it('does not await the recompute — resolves even if the recompute never settles', async () => {
      // upsertByExperimentId never resolves => recompute never settles. If withRecompute awaited the
      // recompute, this would hang and time out.
      precomputedSegmentRepository.upsertByExperimentId = jest.fn(() => new Promise(() => undefined));

      await expect(
        service.withRecompute(
          logger,
          () => ['e1'],
          async () => 'ok'
        )
      ).resolves.toBe('ok');
    });

    it('still resolves (and logs) when the fire-and-forget recompute fails', async () => {
      precomputedSegmentRepository.upsertByExperimentId = jest.fn().mockRejectedValue(new Error('recompute boom'));
      const errorSpy = jest.spyOn(logger, 'error');

      await expect(
        service.withRecompute(
          logger,
          () => ['e1'],
          async () => 'ok'
        )
      ).resolves.toBe('ok');

      // let the fire-and-forget .catch settle so the rejection is handled (no unhandled rejection)
      await new Promise((r) => setImmediate(r));
      expect(errorSpy).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('scheduleRecomputeForOwners') })
      );
      errorSpy.mockRestore();
    });
  });
});
