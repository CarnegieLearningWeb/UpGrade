import { DataSource } from 'typeorm';
import { FeatureFlagRepository } from '../../../src/api/repositories/FeatureFlagRepository';
import { FeatureFlag } from '../../../src/api/models/FeatureFlag';
import { FEATURE_FLAG_STATUS, FILTER_MODE } from 'upgrade_types';
import { Container } from '../../../src/typeorm-typedi-extensions';
import { initializeMocks } from '../mockdata/mockRepo';

let mock;
let manager;
let dataSource: DataSource;
let repo: FeatureFlagRepository;

const err = new Error('test error');

const flag = new FeatureFlag();
flag.id = 'id1';

const result = {
  identifiers: [{ id: flag.id }],
  generatedMaps: [flag],
  raw: [flag],
};

beforeAll(() => {
  dataSource = new DataSource({
    type: 'postgres',
    database: 'postgres',
    entities: [FeatureFlagRepository],
    synchronize: true,
  });
  Container.setDataSource('default', dataSource);
});

beforeEach(() => {
  repo = Container.getCustomRepository(FeatureFlagRepository);
  const commonMockData = initializeMocks(result);
  repo.createQueryBuilder = commonMockData.createQueryBuilder;
  mock = commonMockData.mocks;

  manager = {
    createQueryBuilder: repo.createQueryBuilder,
  };
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('FeatureFlagRepository Testing', () => {
  it('should insert a new flag', async () => {
    const res = await repo.insertFeatureFlag(flag, manager);
    expect(manager.createQueryBuilder).toHaveBeenCalledTimes(1);
    expect(mock.insert).toHaveBeenCalledTimes(1);
    expect(mock.into).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledWith(flag);
    expect(mock.returning).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledWith('*');
    expect(mock.execute).toHaveBeenCalledTimes(1);
    expect(res).toEqual([flag]);
  });

  it('should throw an error when insert fails', async () => {
    mock.execute.mockRejectedValue(err);

    expect(async () => {
      await repo.insertFeatureFlag(flag, manager);
    }).rejects.toThrow(err);

    expect(manager.createQueryBuilder).toHaveBeenCalledTimes(1);
    expect(mock.insert).toHaveBeenCalledTimes(1);
    expect(mock.into).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledWith(flag);
    expect(mock.returning).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledWith('*');
    expect(mock.execute).toHaveBeenCalledTimes(1);
  });

  it('should delete a flag', async () => {
    await repo.deleteById(flag.id, manager);
    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.delete).toHaveBeenCalledTimes(1);
    expect(mock.from).toHaveBeenCalledTimes(1);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledWith('*');
    expect(mock.execute).toHaveBeenCalledTimes(1);

    await repo.deleteById(flag.id, manager);
  });

  it('should throw an error when delete fails', async () => {
    mock.execute.mockRejectedValue(err);

    expect(async () => {
      await repo.deleteById(flag.id, manager);
    }).rejects.toThrow(err);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);
    expect(mock.delete).toHaveBeenCalledTimes(1);
    expect(mock.from).toHaveBeenCalledTimes(1);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledWith('*');
    expect(mock.execute).toHaveBeenCalledTimes(1);
  });

  it('should update flag', async () => {
    const res = await repo.updateFeatureFlag(flag, manager);
    expect(manager.createQueryBuilder).toHaveBeenCalledTimes(1);
    expect(mock.update).toHaveBeenCalledTimes(1);
    expect(mock.set).toHaveBeenCalledTimes(1);
    expect(mock.set).toHaveBeenCalledWith(flag);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledWith('*');
    expect(mock.execute).toHaveBeenCalledTimes(1);
    expect(res).toEqual([flag]);
  });

  it('should throw an error when update flag fails', async () => {
    mock.execute.mockRejectedValue(err);

    expect(async () => {
      await repo.updateFeatureFlag(flag, manager);
    }).rejects.toThrow(err);

    expect(manager.createQueryBuilder).toHaveBeenCalledTimes(1);
    expect(mock.update).toHaveBeenCalledTimes(1);
    expect(mock.set).toHaveBeenCalledTimes(1);
    expect(mock.set).toHaveBeenCalledWith(flag);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledWith('*');
    expect(mock.execute).toHaveBeenCalledTimes(1);
  });

  it('should update flag state', async () => {
    const res = await repo.updateState(flag.id, FEATURE_FLAG_STATUS.ENABLED);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);
    expect(mock.update).toHaveBeenCalledTimes(1);
    expect(mock.set).toHaveBeenCalledTimes(1);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledWith('*');
    expect(mock.execute).toHaveBeenCalledTimes(1);
    expect(res).toEqual(flag);
  });

  it('should update filter mode', async () => {
    const res = await repo.updateFilterMode(flag.id, FILTER_MODE.INCLUDE_ALL);
    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);
    expect(mock.update).toHaveBeenCalledTimes(1);
    expect(mock.set).toHaveBeenCalledTimes(1);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledWith('*');
    expect(mock.execute).toHaveBeenCalledTimes(1);
    expect(res).toEqual(flag);
  });

  it('should throw an error when update flag fails', async () => {
    mock.execute.mockRejectedValue(err);
    expect(async () => {
      await repo.updateState(flag.id, FEATURE_FLAG_STATUS.ENABLED);
    }).rejects.toThrow(err);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);
    expect(mock.update).toHaveBeenCalledTimes(1);
    expect(mock.set).toHaveBeenCalledTimes(1);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledWith('*');
    expect(mock.execute).toHaveBeenCalledTimes(1);
  });

  describe('getFlagsFromContext', () => {
    const context = 'test-context';

    beforeEach(() => {
      mock.getMany.mockResolvedValue([]);
    });

    it('should run two separate queries in parallel, one per filterMode', async () => {
      await repo.getFlagsFromContext(context);

      expect(repo.createQueryBuilder).toHaveBeenCalledTimes(2);
      expect(mock.getMany).toHaveBeenCalledTimes(2);
      expect(mock.andWhere).toHaveBeenCalledWith('feature_flag.filterMode = :includeAll', {
        includeAll: FILTER_MODE.INCLUDE_ALL,
      });
      expect(mock.andWhere).toHaveBeenCalledWith('feature_flag.filterMode = :excludeAll', {
        excludeAll: FILTER_MODE.EXCLUDE_ALL,
      });
    });

    it('should apply context and status conditions to both queries', async () => {
      await repo.getFlagsFromContext(context);

      expect(mock.where).toHaveBeenCalledTimes(2);
      expect(mock.where).toHaveBeenCalledWith('feature_flag.context @> :searchContext', {
        searchContext: [context],
      });
      expect(mock.andWhere).toHaveBeenCalledWith('feature_flag.status = :status', {
        status: FEATURE_FLAG_STATUS.ENABLED,
      });
    });

    it('should not join inclusion segment member data for INCLUDE_ALL flags', async () => {
      await repo.getFlagsFromContext(context);

      // Collect all first-args passed to leftJoinAndSelect across both queries
      const joinedRelations = mock.leftJoinAndSelect.mock.calls.map(([relation]) => relation);

      // Inclusion-side member joins should appear exactly once (only from the EXCLUDE_ALL query)
      expect(joinedRelations.filter((r) => r === 'segmentInclusion.individualForSegment')).toHaveLength(1);
      expect(joinedRelations.filter((r) => r === 'segmentInclusion.groupForSegment')).toHaveLength(1);
      expect(joinedRelations.filter((r) => r === 'segmentInclusion.subSegments')).toHaveLength(1);

      // Exclusion-side member joins should appear twice (once per query)
      expect(joinedRelations.filter((r) => r === 'segmentExclusion.individualForSegment')).toHaveLength(2);
      expect(joinedRelations.filter((r) => r === 'segmentExclusion.groupForSegment')).toHaveLength(2);
      expect(joinedRelations.filter((r) => r === 'segmentExclusion.subSegments')).toHaveLength(2);
    });

    it('should join inclusion segment member data for EXCLUDE_ALL flags', async () => {
      await repo.getFlagsFromContext(context);

      expect(mock.leftJoinAndSelect).toHaveBeenCalledWith(
        'feature_flag.featureFlagSegmentInclusion',
        'featureFlagSegmentInclusion'
      );
      expect(mock.leftJoinAndSelect).toHaveBeenCalledWith('featureFlagSegmentInclusion.segment', 'segmentInclusion');
      expect(mock.leftJoinAndSelect).toHaveBeenCalledWith(
        'segmentInclusion.individualForSegment',
        'individualForSegment'
      );
      expect(mock.leftJoinAndSelect).toHaveBeenCalledWith('segmentInclusion.groupForSegment', 'groupForSegment');
      expect(mock.leftJoinAndSelect).toHaveBeenCalledWith('segmentInclusion.subSegments', 'subSegment');
    });

    it('should combine results from both queries', async () => {
      const includeAllFlag = new FeatureFlag();
      includeAllFlag.id = 'include-all-flag';
      const excludeAllFlag = new FeatureFlag();
      excludeAllFlag.id = 'exclude-all-flag';

      mock.getMany.mockResolvedValueOnce([includeAllFlag]).mockResolvedValueOnce([excludeAllFlag]);

      const results = await repo.getFlagsFromContext(context);

      expect(results).toEqual([includeAllFlag, excludeAllFlag]);
    });

    it('should throw when either query fails', async () => {
      mock.getMany.mockRejectedValueOnce(err);

      await expect(repo.getFlagsFromContext(context)).rejects.toThrow();
    });
  });
});
