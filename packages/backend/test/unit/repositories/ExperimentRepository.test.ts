import { DataSource } from 'typeorm';
import { ExperimentRepository } from '../../../src/api/repositories/ExperimentRepository';
import { Experiment } from '../../../src/api/models/Experiment';
import { EXPERIMENT_STATE } from 'upgrade_types';
import * as globalExcludeSegment from '../../../src/init/seed/globalExcludeSegment';
import { Container } from '../../../src/typeorm-typedi-extensions';
import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';
import { initializeMocks } from '../mockdata/mockRepo';

let mock;
let manager;
let dataSource: DataSource;
let repo: ExperimentRepository;
const err = new Error('test error');

const experiment = new Experiment();
experiment.id = 'id1';
experiment.experimentSegmentInclusion = [];
experiment.experimentSegmentExclusion = [];

const result = {
  identifiers: [{ id: experiment.id }],
  generatedMaps: [experiment],
  raw: [experiment],
};

beforeAll(() => {
  dataSource = new DataSource({
    type: 'postgres',
    database: 'postgres',
    entities: [ExperimentRepository],
    synchronize: true,
  });
  Container.setDataSource('default', dataSource);
});

beforeEach(() => {
  repo = Container.getCustomRepository(ExperimentRepository);
  const commonMockData = initializeMocks(result);
  repo.createQueryBuilder = commonMockData.createQueryBuilder;
  mock = commonMockData.mocks;

  manager = {
    createQueryBuilder: repo.createQueryBuilder,
    dataSource,
  };
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('ExperimentRepository Testing', () => {
  it('should insert a new experiment', async () => {
    const res = await repo.insertExperiment(experiment, manager);

    expect(manager.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.insert).toHaveBeenCalledTimes(1);
    expect(mock.into).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledWith(experiment);
    expect(mock.returning).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledWith('*');
    expect(mock.execute).toHaveBeenCalledTimes(1);

    expect(res).toEqual([experiment]);
  });

  it('should throw an error when insert fails', async () => {
    mock.execute.mockRejectedValue(err);

    expect(async () => {
      await repo.insertExperiment(experiment, manager);
    }).rejects.toThrow(err);

    expect(manager.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.insert).toHaveBeenCalledTimes(1);
    expect(mock.into).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledWith(experiment);
    expect(mock.returning).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledWith('*');
    expect(mock.execute).toHaveBeenCalledTimes(1);
  });

  it('should insert a batch of new experiment', async () => {
    const res = await repo.insertBatchExps([experiment], manager);

    expect(manager.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.insert).toHaveBeenCalledTimes(1);
    expect(mock.into).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledWith([experiment]);
    expect(mock.returning).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledWith('*');
    expect(mock.execute).toHaveBeenCalledTimes(1);

    expect(res).toEqual([experiment]);
  });

  it('should throw an error when insert batch fails', async () => {
    mock.execute.mockRejectedValue(err);

    expect(async () => {
      await repo.insertBatchExps([experiment], manager);
    }).rejects.toThrow(err);

    expect(manager.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.insert).toHaveBeenCalledTimes(1);
    expect(mock.into).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledWith([experiment]);
    expect(mock.returning).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledWith('*');
    expect(mock.execute).toHaveBeenCalledTimes(1);
  });

  it('should delete an experiment', async () => {
    const res = await repo.deleteById(experiment.id, manager);

    expect(manager.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.delete).toHaveBeenCalledTimes(1);
    expect(mock.from).toHaveBeenCalledTimes(1);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledWith('*');
    expect(mock.execute).toHaveBeenCalledTimes(1);

    expect(res).toEqual([experiment]);
  });

  it('should throw an error when delete fails', async () => {
    mock.execute.mockRejectedValue(err);

    expect(async () => {
      await repo.deleteById(experiment.id, manager);
    }).rejects.toThrow(err);

    expect(manager.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.delete).toHaveBeenCalledTimes(1);
    expect(mock.from).toHaveBeenCalledTimes(1);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledWith('*');
    expect(mock.execute).toHaveBeenCalledTimes(1);
  });

  it('should find all experiments', async () => {
    const result = [experiment];
    mock.getMany.mockResolvedValue(result);

    const res = await repo.findAllExperiments();

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(5);

    expect(mock.leftJoinAndSelect).toHaveBeenCalledTimes(23);
    expect(mock.select).toHaveBeenCalledTimes(2);
    expect(mock.getMany).toHaveBeenCalledTimes(5);

    // queries are ordered by `order` ASC (NULLS LAST) then `createdAt` ASC as a stable fallback
    expect(mock.addOrderBy).toHaveBeenCalledTimes(2);
    expect(mock.addOrderBy).toHaveBeenCalledWith('queries.order', 'ASC', 'NULLS LAST');
    expect(mock.addOrderBy).toHaveBeenCalledWith('queries.createdAt', 'ASC');

    expect(res).toEqual(result);
  });

  it('should merge separately loaded inclusion and exclusion segment data', async () => {
    const conditionData = { id: 'exp-a', name: 'Experiment A', conditions: ['condition'] } as any;
    const factorData = { id: 'exp-a', partitions: ['partition'] } as any;
    const metricData = { id: 'exp-a', queries: ['query'] } as any;
    const inclusionData = { id: 'exp-a', experimentSegmentInclusion: ['inclusion'] } as any;
    const exclusionData = { id: 'exp-a', experimentSegmentExclusion: ['exclusion'] } as any;

    mock.getMany
      .mockResolvedValueOnce([conditionData])
      .mockResolvedValueOnce([factorData])
      .mockResolvedValueOnce([metricData])
      .mockResolvedValueOnce([inclusionData])
      .mockResolvedValueOnce([exclusionData]);

    const [res] = await repo.findAllExperiments();

    expect(res).toMatchObject({
      id: 'exp-a',
      name: 'Experiment A',
      conditions: ['condition'],
      partitions: ['partition'],
      queries: ['query'],
      experimentSegmentInclusion: ['inclusion'],
      experimentSegmentExclusion: ['exclusion'],
    });
  });

  it('should default segment data missing from either query to an empty array', async () => {
    const baseData = [{ id: 'exp-a' }, { id: 'exp-b' }] as any;
    const inclusionData = [{ id: 'exp-a', experimentSegmentInclusion: ['inclusion'] }] as any;
    const exclusionData = [{ id: 'exp-b', experimentSegmentExclusion: ['exclusion'] }] as any;

    mock.getMany
      .mockResolvedValueOnce(baseData)
      .mockResolvedValueOnce(baseData)
      .mockResolvedValueOnce(baseData)
      .mockResolvedValueOnce(inclusionData)
      .mockResolvedValueOnce(exclusionData);

    const res = await repo.findAllExperiments();

    expect(res).toEqual([
      {
        id: 'exp-a',
        experimentSegmentInclusion: ['inclusion'],
        experimentSegmentExclusion: [],
      },
      {
        id: 'exp-b',
        experimentSegmentInclusion: [],
        experimentSegmentExclusion: ['exclusion'],
      },
    ]);
  });

  it('should throw an error when find all experiments fails', async () => {
    mock.getMany.mockRejectedValue(err);

    expect(async () => {
      await repo.findAllExperiments();
    }).rejects.toThrow(err);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(5);

    expect(mock.leftJoinAndSelect).toHaveBeenCalledTimes(23);
    expect(mock.select).toHaveBeenCalledTimes(2);
    expect(mock.getMany).toHaveBeenCalledTimes(5);
  });

  it('should find all experiments by name', async () => {
    const res = await repo.findAllName();

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.select).toHaveBeenCalledTimes(1);
    expect(mock.getMany).toHaveBeenCalledTimes(1);

    expect(res).toEqual(result);
  });

  it('should throw an error find all experiments by name fails', async () => {
    mock.getMany.mockRejectedValue(err);

    expect(async () => {
      await repo.findAllName();
    }).rejects.toThrow(err);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.select).toHaveBeenCalledTimes(1);
    expect(mock.getMany).toHaveBeenCalledTimes(1);
  });

  it('should get valid experiments', async () => {
    const result = [experiment];
    mock.getMany.mockResolvedValue(result);

    const res = await repo.getValidExperiments('context');

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(2);

    // 4 (conditionLevel) + 6 (factorDecisionPoint) = 10. Inclusion/exclusion segment ids are no
    // longer joined here: they're fetched lazily via getSegmentIdsForExperiments only when
    // ExperimentAssignmentService actually needs them (an experiment_precomputed_segment cache miss).
    expect(mock.leftJoinAndSelect).toHaveBeenCalledTimes(10);
    expect(mock.leftJoin).not.toHaveBeenCalled();
    expect(mock.addSelect).not.toHaveBeenCalled();
    expect(mock.where).toHaveBeenCalledTimes(2);
    expect(mock.select).not.toHaveBeenCalled();
    expect(mock.getMany).toHaveBeenCalledTimes(2);

    expect(res).toEqual(result);
  });

  it('should throw an error get valid experiments fails', async () => {
    mock.getMany.mockRejectedValue(err);

    expect(async () => {
      await repo.getValidExperiments('context');
    }).rejects.toThrow(err);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(2);

    expect(mock.leftJoinAndSelect).toHaveBeenCalledTimes(10);
    expect(mock.where).toHaveBeenCalledTimes(2);
    expect(mock.select).not.toHaveBeenCalled();
    expect(mock.getMany).toHaveBeenCalledTimes(2);
  });

  it('should get valid experiments with preview', async () => {
    const result = [experiment];
    mock.getMany.mockResolvedValue(result);

    const res = await repo.getValidExperimentsWithPreview('context');

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(2);

    expect(mock.leftJoinAndSelect).toHaveBeenCalledTimes(10);
    expect(mock.leftJoin).not.toHaveBeenCalled();
    expect(mock.addSelect).not.toHaveBeenCalled();
    expect(mock.where).toHaveBeenCalledTimes(2);
    expect(mock.select).not.toHaveBeenCalled();
    expect(mock.getMany).toHaveBeenCalledTimes(2);

    expect(res).toEqual(result);
  });

  it('should throw an error get valid experiments with preview fails', async () => {
    mock.getMany.mockRejectedValue(err);

    expect(async () => {
      await repo.getValidExperimentsWithPreview('context');
    }).rejects.toThrow(err);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(2);

    expect(mock.leftJoinAndSelect).toHaveBeenCalledTimes(10);
    expect(mock.where).toHaveBeenCalledTimes(2);
    expect(mock.select).not.toHaveBeenCalled();
    expect(mock.getMany).toHaveBeenCalledTimes(2);
  });

  it('should update experiment state', async () => {
    const res = await repo.updateState(experiment.id, EXPERIMENT_STATE.ENROLLING, new Date('1-19-2022'));

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.update).toHaveBeenCalledTimes(1);
    expect(mock.set).toHaveBeenCalledTimes(1);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledWith('*');
    expect(mock.execute).toHaveBeenCalledTimes(1);

    expect(res).toEqual([experiment]);
  });

  it('should throw an error when update state fails', async () => {
    mock.execute.mockRejectedValue(err);

    expect(async () => {
      await repo.updateState(experiment.id, EXPERIMENT_STATE.ENROLLING, new Date('1-19-2022'));
    }).rejects.toThrow(err);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.update).toHaveBeenCalledTimes(1);
    expect(mock.set).toHaveBeenCalledTimes(1);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledWith('*');
    expect(mock.execute).toHaveBeenCalledTimes(1);
  });

  it('should update experiment state with manager', async () => {
    const res = await repo.updateState(experiment.id, EXPERIMENT_STATE.ENROLLING, new Date('1-19-2022'), manager);

    expect(manager.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.update).toHaveBeenCalledTimes(1);
    expect(mock.set).toHaveBeenCalledTimes(1);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledWith('*');
    expect(mock.execute).toHaveBeenCalledTimes(1);

    expect(res).toEqual([experiment]);
  });

  it('should throw an error when update state with manager fails', async () => {
    mock.execute.mockRejectedValue(err);

    expect(async () => {
      await repo.updateState(experiment.id, EXPERIMENT_STATE.ENROLLING, new Date('1-19-2022'), manager);
    }).rejects.toThrow(err);

    expect(manager.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.update).toHaveBeenCalledTimes(1);
    expect(mock.set).toHaveBeenCalledTimes(1);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledWith('*');
    expect(mock.execute).toHaveBeenCalledTimes(1);
  });

  it('should update experiment', async () => {
    const res = await repo.updateExperiment(experiment, manager);

    expect(manager.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.update).toHaveBeenCalledTimes(1);
    expect(mock.set).toHaveBeenCalledTimes(1);
    expect(mock.set).toHaveBeenCalledWith(experiment);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledWith('*');

    expect(res).toEqual([experiment]);
  });

  it('should throw an error when update experiment fails', async () => {
    mock.execute.mockRejectedValue(err);

    expect(async () => {
      await repo.updateExperiment(experiment, manager);
    }).rejects.toThrow(err);

    expect(manager.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.update).toHaveBeenCalledTimes(1);
    expect(mock.set).toHaveBeenCalledTimes(1);
    expect(mock.set).toHaveBeenCalledWith(experiment);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledWith('*');
    expect(mock.execute).toHaveBeenCalledTimes(1);
  });

  it('should find one experiment ordered by queries.order then createdAt', async () => {
    const res = await repo.findOneExperiment(experiment.id);

    // 5 parallel queries: conditionLevelPayload, factorDecisionPointPayload, metric, inclusion, exclusion
    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(5);

    // conditions(1) + partitions+factors+levels(3) + queries.order+createdAt(2) = 6 addOrderBy calls
    expect(mock.addOrderBy).toHaveBeenCalledTimes(6);
    expect(mock.addOrderBy).toHaveBeenCalledWith('queries.order', 'ASC', 'NULLS LAST');
    expect(mock.addOrderBy).toHaveBeenCalledWith('queries.createdAt', 'ASC');

    expect(mock.where).toHaveBeenCalledTimes(5);
    expect(mock.getOne).toHaveBeenCalledTimes(5);

    expect(res).toEqual({
      ...experiment,
      experimentSegmentInclusion: [],
      experimentSegmentExclusion: [],
    });
  });

  it('should merge separately loaded segment data when finding one experiment', async () => {
    const conditionData = { id: 'exp-a', name: 'Experiment A', conditions: ['condition'] } as any;
    const factorData = { id: 'exp-a', partitions: ['partition'] } as any;
    const metricData = { id: 'exp-a', queries: ['query'] } as any;
    const inclusionData = { id: 'exp-a', experimentSegmentInclusion: ['inclusion'] } as any;
    const exclusionData = { id: 'exp-a', experimentSegmentExclusion: ['exclusion'] } as any;

    mock.getOne
      .mockResolvedValueOnce(conditionData)
      .mockResolvedValueOnce(factorData)
      .mockResolvedValueOnce(metricData)
      .mockResolvedValueOnce(inclusionData)
      .mockResolvedValueOnce(exclusionData);

    const res = await repo.findOneExperiment('exp-a');

    expect(res).toMatchObject({
      id: 'exp-a',
      name: 'Experiment A',
      conditions: ['condition'],
      partitions: ['partition'],
      queries: ['query'],
      experimentSegmentInclusion: ['inclusion'],
      experimentSegmentExclusion: ['exclusion'],
    });
  });

  it('should clear the database', async () => {
    const entities = [
      {
        tableName: 'user',
        name: 'user',
      },
      {
        tableName: 'Experiment',
        name: 'Experiment',
      },
    ];

    repo.query = jest.fn().mockResolvedValue({});
    manager.dataSource.entityMetadatas = entities;
    manager.dataSource.getRepository = jest.fn().mockReturnValue(repo);

    jest.spyOn(globalExcludeSegment, 'createGlobalExcludeSegment').mockResolvedValue(Promise.resolve());

    const res = await repo.clearDB(manager, new UpgradeLogger());

    expect(manager.dataSource.getRepository).toHaveBeenCalledTimes(1);
    expect(manager.dataSource.getRepository).toHaveBeenCalledWith('Experiment');

    expect(repo.query).toHaveBeenCalledTimes(1);
    expect(repo.query).toHaveBeenCalledWith('TRUNCATE Experiment CASCADE;');
    expect(res).toBeUndefined();
  });

  describe('getValidExperimentsForContextAndDecisionPoint', () => {
    it('should build two queries and add a leftJoin on partitions for the condition query', async () => {
      const result = [experiment];
      mock.getMany.mockResolvedValue(result);

      const res = await repo.getValidExperimentsForContextAndDecisionPoint('context', 'site1', 'target1');

      expect(repo.createQueryBuilder).toHaveBeenCalledTimes(2);
      // 4 (conditionLevel) + 6 (factorDecisionPoint) = 10. Inclusion/exclusion segment ids are no
      // longer joined here; see getSegmentIdsForExperiments.
      expect(mock.leftJoinAndSelect).toHaveBeenCalledTimes(10);
      // conditionLevelPayloadQuery adds a non-selecting leftJoin for partition filtering.
      expect(mock.leftJoin).toHaveBeenCalledTimes(1);
      expect(mock.leftJoin).toHaveBeenCalledWith('experiment.partitions', 'partitions');
      expect(mock.addSelect).not.toHaveBeenCalled();
      expect(mock.select).not.toHaveBeenCalled();
      expect(mock.where).toHaveBeenCalledTimes(2);
      expect(mock.getMany).toHaveBeenCalledTimes(2);

      expect(res).toEqual(result);
    });

    it('should return empty array when no experiments match the site/target', async () => {
      // conditionLevel finds an experiment, but factorDecisionPoint finds none at this site/target
      mock.getMany.mockResolvedValueOnce([experiment]).mockResolvedValueOnce([]);

      const res = await repo.getValidExperimentsForContextAndDecisionPoint('context', 'site1', 'target1');

      expect(res).toHaveLength(0);
    });

    it('should exclude experiments not present in factorDecisionPointPayloadData', async () => {
      const expA = new Experiment();
      expA.id = 'exp-a';
      const expB = new Experiment();
      expB.id = 'exp-b';

      // conditionLevel over-fetches; only expA matches the site/target in factorDecisionPoint
      mock.getMany.mockResolvedValueOnce([expA, expB]).mockResolvedValueOnce([expA]);

      const res = await repo.getValidExperimentsForContextAndDecisionPoint('context', 'site1', 'target1');

      expect(res).toHaveLength(1);
      expect(res[0].id).toBe('exp-a');
    });

    it('should merge condition and partition data onto each result experiment', async () => {
      const condData = { id: 'exp-a', conditions: ['cond1'] } as any;
      const factorData = { id: 'exp-a', partitions: ['part1'] } as any;

      mock.getMany.mockResolvedValueOnce([condData]).mockResolvedValueOnce([factorData]);

      const [result] = await repo.getValidExperimentsForContextAndDecisionPoint('context', 'site1', 'target1');

      expect(result).toMatchObject({
        id: 'exp-a',
        conditions: ['cond1'],
        partitions: ['part1'],
      });
    });

    it('should return factorDecisionPoint data even when conditionLevel query returns no match', async () => {
      const factorData = { id: 'exp-a', partitions: ['part1'] } as any;

      mock.getMany.mockResolvedValueOnce([]).mockResolvedValueOnce([factorData]);

      const [result] = await repo.getValidExperimentsForContextAndDecisionPoint('context', 'site1', 'target1');

      expect(result).toMatchObject({
        id: 'exp-a',
        partitions: ['part1'],
      });
    });

    it('should throw an error when a sub-query fails', async () => {
      mock.getMany.mockRejectedValue(err);

      await expect(repo.getValidExperimentsForContextAndDecisionPoint('context', 'site1', 'target1')).rejects.toThrow();

      expect(repo.createQueryBuilder).toHaveBeenCalledTimes(2);
    });
  });

  describe('getSegmentIdsForExperiments', () => {
    it('should return an empty array without querying when given no experiment ids', async () => {
      const res = await repo.getSegmentIdsForExperiments([]);

      expect(repo.createQueryBuilder).not.toHaveBeenCalled();
      expect(res).toEqual([]);
    });

    it('should fetch and merge inclusion/exclusion segment ids scoped to the given experiment ids', async () => {
      const inclusionData = { id: 'exp-a', experimentSegmentInclusion: ['inclusion'] } as any;
      const exclusionData = { id: 'exp-a', experimentSegmentExclusion: ['exclusion'] } as any;

      mock.getMany.mockResolvedValueOnce([inclusionData]).mockResolvedValueOnce([exclusionData]);

      const res = await repo.getSegmentIdsForExperiments(['exp-a']);

      expect(repo.createQueryBuilder).toHaveBeenCalledTimes(2);
      expect(mock.leftJoinAndSelect).toHaveBeenCalledTimes(2);
      expect(mock.select).toHaveBeenCalledTimes(2);
      expect(mock.where).toHaveBeenCalledTimes(2);
      expect(mock.where).toHaveBeenCalledWith('experiment.id IN (:...experimentIds)', { experimentIds: ['exp-a'] });
      expect(mock.getMany).toHaveBeenCalledTimes(2);

      expect(res).toMatchObject([
        { id: 'exp-a', experimentSegmentInclusion: ['inclusion'], experimentSegmentExclusion: ['exclusion'] },
      ]);
    });

    it('should throw an error when a sub-query fails', async () => {
      mock.getMany.mockRejectedValue(err);

      await expect(repo.getSegmentIdsForExperiments(['exp-a'])).rejects.toThrow(err);
    });
  });

  it('should throw an error when clear the database fails', async () => {
    const entities = [
      {
        tableName: 'user',
        name: 'user',
      },
      {
        tableName: 'Experiment',
        name: 'Experiment',
      },
    ];

    repo.query = jest.fn().mockRejectedValue(err);
    manager.dataSource.entityMetadatas = entities;
    manager.dataSource.getRepository = jest.fn().mockReturnValue(repo);

    jest.spyOn(globalExcludeSegment, 'createGlobalExcludeSegment').mockResolvedValue(Promise.resolve());

    await expect(async () => {
      await repo.clearDB(manager, new UpgradeLogger());
    }).rejects.toThrow('test error');

    expect(manager.dataSource.getRepository).toHaveBeenCalledTimes(1);
    expect(manager.dataSource.getRepository).toHaveBeenCalledWith('Experiment');

    expect(repo.query).toHaveBeenCalledTimes(1);
    expect(repo.query).toHaveBeenCalledWith('TRUNCATE Experiment CASCADE;');
  });
});
