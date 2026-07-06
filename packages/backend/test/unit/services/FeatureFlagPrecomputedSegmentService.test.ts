import { FeatureFlagPrecomputedSegmentService } from '../../../src/api/services/FeatureFlagPrecomputedSegmentService';
import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';
import { CACHE_PREFIX } from 'upgrade_types';
import { configureLogger } from '../../utils/logger';

const logger = new UpgradeLogger();

// Build a segment-repository query-builder mock whose getMany() returns the fixtures
// matching the ids captured from the `.where('segment.id IN (:...ids)', { ids })` call.
// flattenSegmentMembers calls createQueryBuilder() once per recursion level, so each call
// returns a fresh builder that resolves against the shared fixture map.
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

describe('FeatureFlagPrecomputedSegmentService', () => {
  beforeAll(() => {
    configureLogger();
  });

  let precomputedSegmentRepository: any;
  let featureFlagSegmentInclusionRepository: any;
  let featureFlagSegmentExclusionRepository: any;
  let featureFlagRepository: any;
  let segmentRepository: any;
  let cacheService: any;
  let service: FeatureFlagPrecomputedSegmentService;

  beforeEach(() => {
    precomputedSegmentRepository = {
      upsertByFlagId: jest.fn().mockResolvedValue(undefined),
      findByFlagIds: jest.fn().mockResolvedValue([]),
      find: jest.fn().mockResolvedValue([]),
    };
    featureFlagSegmentInclusionRepository = { find: jest.fn().mockResolvedValue([]) };
    featureFlagSegmentExclusionRepository = { find: jest.fn().mockResolvedValue([]) };
    featureFlagRepository = { find: jest.fn().mockResolvedValue([]) };
    segmentRepository = makeSegmentRepoMock({});
    cacheService = {
      delCache: jest.fn().mockResolvedValue(undefined),
      wrapFunction: jest.fn(),
    };

    service = new FeatureFlagPrecomputedSegmentService(
      precomputedSegmentRepository,
      featureFlagSegmentInclusionRepository,
      featureFlagSegmentExclusionRepository,
      featureFlagRepository,
      segmentRepository,
      cacheService
    );
  });

  describe('recomputeForFlag', () => {
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
      featureFlagSegmentInclusionRepository.find = jest.fn().mockResolvedValue([{ segment: { id: 'segA' } }]);
      featureFlagSegmentExclusionRepository.find = jest.fn().mockResolvedValue([{ segment: { id: 'segB' } }]);

      service = new FeatureFlagPrecomputedSegmentService(
        precomputedSegmentRepository,
        featureFlagSegmentInclusionRepository,
        featureFlagSegmentExclusionRepository,
        featureFlagRepository,
        segmentRepository,
        cacheService
      );

      await service.recomputeForFlag('flag1', logger);

      expect(precomputedSegmentRepository.upsertByFlagId).toHaveBeenCalledTimes(1);
      const [flagId, inclusionIds, exclusionIds] = precomputedSegmentRepository.upsertByFlagId.mock.calls[0];
      expect(flagId).toEqual('flag1');
      // recursive sub-segment member u2 must be included alongside the direct members;
      // group members are namespaced with their type (schoolId:g1), individuals stay bare
      expect(inclusionIds.sort()).toEqual(['schoolId:g1', 'u1', 'u2']);
      expect(exclusionIds).toEqual(['u3']);
      // only enabled lists are queried
      expect(featureFlagSegmentInclusionRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { featureFlag: { id: 'flag1' }, enabled: true } })
      );
      // cache for this flag is invalidated
      expect(cacheService.delCache).toHaveBeenCalledWith(
        CACHE_PREFIX.FEATURE_FLAG_PRECOMPUTED_SEGMENT_KEY_PREFIX + 'flag1'
      );
    });

    it('produces empty arrays when the flag has no enabled lists', async () => {
      await service.recomputeForFlag('flag-empty', logger);

      expect(precomputedSegmentRepository.upsertByFlagId).toHaveBeenCalledWith('flag-empty', [], []);
    });
  });

  describe('getAffectedFlagIds (ancestor walk)', () => {
    it('includes flags that reference an ANCESTOR (parent) segment of the edited segment', async () => {
      // A flag references segParent; segChild is a sub-segment of segParent. Editing segChild
      // must mark the flag referencing segParent as affected.
      featureFlagSegmentInclusionRepository.find = jest.fn(({ where }: any) =>
        Promise.resolve(where.segment.id === 'segParent' ? [{ featureFlag: { id: 'flagP' } }] : [])
      );
      featureFlagSegmentExclusionRepository.find = jest.fn().mockResolvedValue([]);
      segmentRepository.findParentSegmentIds = jest.fn((id: string) =>
        Promise.resolve(id === 'segChild' ? ['segParent'] : [])
      );

      const affected = await service.getAffectedFlagIds('segChild');

      expect(affected).toEqual(['flagP']);
      expect(segmentRepository.findParentSegmentIds).toHaveBeenCalledWith('segChild');
    });

    it('does not infinitely recurse on a segment cycle', async () => {
      featureFlagSegmentInclusionRepository.find = jest.fn().mockResolvedValue([]);
      featureFlagSegmentExclusionRepository.find = jest.fn().mockResolvedValue([]);
      // segX <-> segY reference each other as parents
      segmentRepository.findParentSegmentIds = jest.fn((id: string) =>
        Promise.resolve(id === 'segX' ? ['segY'] : ['segX'])
      );

      const affected = await service.getAffectedFlagIds('segX');

      expect(affected).toEqual([]);
    });
  });

  describe('getPrecomputedSets', () => {
    it('returns an empty map for an empty flag id list without hitting the cache', async () => {
      const result = await service.getPrecomputedSets([]);

      expect(result.size).toEqual(0);
      expect(cacheService.wrapFunction).not.toHaveBeenCalled();
    });

    it('maps flag ids to rows positionally and skips missing (null) rows', async () => {
      const rowA = { featureFlagId: 'fa', inclusionIds: ['u1'], exclusionIds: [] };
      cacheService.wrapFunction = jest.fn().mockResolvedValue([rowA, null]);

      const result = await service.getPrecomputedSets(['fa', 'fb']);

      expect(result.get('fa')).toEqual(rowA);
      expect(result.has('fb')).toEqual(false);
    });
  });

  describe('seedEmptyRowForFlag', () => {
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

      await service.seedEmptyRowForFlag('flag-new', manager);

      expect(values).toHaveBeenCalledWith({ featureFlagId: 'flag-new', inclusionIds: [], exclusionIds: [] });
      expect(orIgnore).toHaveBeenCalled();
      expect(execute).toHaveBeenCalled();
    });
  });

  describe('backfillMissingFlags', () => {
    it('recomputes only flags that have no precomputed row yet', async () => {
      featureFlagRepository.find = jest.fn().mockResolvedValue([{ id: 'f1' }, { id: 'f2' }]);
      precomputedSegmentRepository.find = jest.fn().mockResolvedValue([{ featureFlagId: 'f1' }]);
      const recomputeSpy = jest.spyOn(service, 'recomputeForFlag').mockResolvedValue(undefined);

      await service.backfillMissingFlags(logger);

      expect(recomputeSpy).toHaveBeenCalledTimes(1);
      expect(recomputeSpy).toHaveBeenCalledWith('f2', logger);
    });
  });

  describe('withRecompute', () => {
    it('resolves affected flag ids BEFORE running work, returns work result, and recomputes after', async () => {
      const order: string[] = [];
      const resolveAffectedFlagIds = jest.fn(async () => {
        order.push('resolve');
        return ['f1'];
      });
      const work = jest.fn(async () => {
        order.push('work');
        return 'done';
      });

      const result = await service.withRecompute(logger, resolveAffectedFlagIds, work);

      expect(result).toBe('done');
      expect(order).toEqual(['resolve', 'work']); // resolve strictly before the mutation
      expect(resolveAffectedFlagIds).toHaveBeenCalledTimes(1);
      expect(work).toHaveBeenCalledTimes(1);

      // the recompute is fired after work; let the fire-and-forget chain settle
      await new Promise((r) => setImmediate(r));
      expect(precomputedSegmentRepository.upsertByFlagId).toHaveBeenCalledWith('f1', [], []);
    });

    it('does not await the recompute — resolves even if the recompute never settles', async () => {
      // upsertByFlagId never resolves => recomputeForFlag never settles. If withRecompute awaited
      // the recompute, this would hang and time out.
      precomputedSegmentRepository.upsertByFlagId = jest.fn(() => new Promise(() => undefined));

      await expect(
        service.withRecompute(
          logger,
          () => ['f1'],
          async () => 'ok'
        )
      ).resolves.toBe('ok');
    });

    it('still resolves (and logs) when the fire-and-forget recompute fails', async () => {
      precomputedSegmentRepository.upsertByFlagId = jest.fn().mockRejectedValue(new Error('recompute boom'));
      const errorSpy = jest.spyOn(logger, 'error');

      await expect(
        service.withRecompute(
          logger,
          () => ['f1'],
          async () => 'ok'
        )
      ).resolves.toBe('ok');

      // let the fire-and-forget .catch settle so the rejection is handled (no unhandled rejection)
      await new Promise((r) => setImmediate(r));
      expect(errorSpy).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('scheduleRecomputeForFlags') })
      );
      errorSpy.mockRestore();
    });
  });
});
