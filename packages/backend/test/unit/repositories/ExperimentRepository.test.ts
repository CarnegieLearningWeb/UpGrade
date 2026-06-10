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
    connection: dataSource,
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

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(4);

    expect(mock.leftJoinAndSelect).toHaveBeenCalledTimes(23);
    expect(mock.select).toHaveBeenCalledTimes(1);
    expect(mock.getMany).toHaveBeenCalledTimes(4);

    // queries are ordered by `order` ASC (NULLS LAST) then `createdAt` ASC as a stable fallback
    expect(mock.addOrderBy).toHaveBeenCalledTimes(2);
    expect(mock.addOrderBy).toHaveBeenCalledWith('queries.order', 'ASC', 'NULLS LAST');
    expect(mock.addOrderBy).toHaveBeenCalledWith('queries.createdAt', 'ASC');

    expect(res).toEqual(result);
  });

  it('should throw an error when find all experiments fails', async () => {
    mock.getMany.mockRejectedValue(err);

    expect(async () => {
      await repo.findAllExperiments();
    }).rejects.toThrow(err);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(4);

    expect(mock.leftJoinAndSelect).toHaveBeenCalledTimes(23);
    expect(mock.select).toHaveBeenCalledTimes(1);
    expect(mock.getMany).toHaveBeenCalledTimes(4);
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

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(3);

    expect(mock.leftJoinAndSelect).toHaveBeenCalledTimes(20);
    expect(mock.where).toHaveBeenCalledTimes(3);
    expect(mock.select).toHaveBeenCalledTimes(1);
    expect(mock.getMany).toHaveBeenCalledTimes(3);

    expect(res).toEqual(result);
  });

  it('should throw an error get valid experiments fails', async () => {
    mock.getMany.mockRejectedValue(err);

    expect(async () => {
      await repo.getValidExperiments('context');
    }).rejects.toThrow(err);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(3);

    expect(mock.leftJoinAndSelect).toHaveBeenCalledTimes(20);
    expect(mock.where).toHaveBeenCalledTimes(3);
    expect(mock.select).toHaveBeenCalledTimes(1);
    expect(mock.getMany).toHaveBeenCalledTimes(3);
  });

  it('should get valid experiments with preview', async () => {
    const result = [experiment];
    mock.getMany.mockResolvedValue(result);

    const res = await repo.getValidExperimentsWithPreview('context');

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(3);

    expect(mock.leftJoinAndSelect).toHaveBeenCalledTimes(20);
    expect(mock.where).toHaveBeenCalledTimes(3);
    expect(mock.select).toHaveBeenCalledTimes(1);
    expect(mock.getMany).toHaveBeenCalledTimes(3);

    expect(res).toEqual(result);
  });

  it('should throw an error get valid experiments with preview fails', async () => {
    mock.getMany.mockRejectedValue(err);

    expect(async () => {
      await repo.getValidExperimentsWithPreview('context');
    }).rejects.toThrow(err);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(3);

    expect(mock.leftJoinAndSelect).toHaveBeenCalledTimes(20);
    expect(mock.where).toHaveBeenCalledTimes(3);
    expect(mock.select).toHaveBeenCalledTimes(1);
    expect(mock.getMany).toHaveBeenCalledTimes(3);
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

    // 4 parallel queries: conditionLevelPayload, factorDecisionPointPayload, metric, segment
    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(4);

    // conditions(1) + partitions+factors+levels(3) + queries.order+createdAt(2) = 6 addOrderBy calls
    expect(mock.addOrderBy).toHaveBeenCalledTimes(6);
    expect(mock.addOrderBy).toHaveBeenCalledWith('queries.order', 'ASC', 'NULLS LAST');
    expect(mock.addOrderBy).toHaveBeenCalledWith('queries.createdAt', 'ASC');

    expect(mock.where).toHaveBeenCalledTimes(4);
    expect(mock.getOne).toHaveBeenCalledTimes(4);

    expect(res).toEqual(experiment);
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
    manager.connection.entityMetadatas = entities;
    manager.connection.getRepository = jest.fn().mockReturnValue(repo);

    jest.spyOn(globalExcludeSegment, 'createGlobalExcludeSegment').mockResolvedValue(Promise.resolve());

    const res = await repo.clearDB(manager, new UpgradeLogger());

    expect(manager.connection.getRepository).toHaveBeenCalledTimes(1);
    expect(manager.connection.getRepository).toHaveBeenCalledWith('Experiment');

    expect(repo.query).toHaveBeenCalledTimes(1);
    expect(repo.query).toHaveBeenCalledWith('TRUNCATE Experiment CASCADE;');
    expect(res).toBeUndefined();
  });

  describe('getValidExperimentsForContextAndDecisionPoint', () => {
    it('should build three queries and add a leftJoin on partitions (decision points) for the condition and segment queries', async () => {
      const result = [experiment];
      mock.getMany.mockResolvedValue(result);

      const res = await repo.getValidExperimentsForContextAndDecisionPoint('context', 'site1', 'target1');

      expect(repo.createQueryBuilder).toHaveBeenCalledTimes(3);
      // 4 (conditionLevel) + 6 (factorDecisionPoint) + 10 (segment) = 20
      expect(mock.leftJoinAndSelect).toHaveBeenCalledTimes(20);
      // conditionLevelPayloadQuery and segmentQuery each add a non-selecting leftJoin for partition filtering
      expect(mock.leftJoin).toHaveBeenCalledTimes(2);
      expect(mock.leftJoin).toHaveBeenCalledWith('experiment.partitions', 'partitions');
      // buildSegmentQuery calls .select('experiment.id')
      expect(mock.select).toHaveBeenCalledTimes(1);
      expect(mock.where).toHaveBeenCalledTimes(3);
      expect(mock.getMany).toHaveBeenCalledTimes(3);

      expect(res).toEqual(result);
    });

    it('should return empty array when no experiments match the site/target', async () => {
      // conditionLevel and segment find experiments, but factorDecisionPoint finds none at this site/target
      mock.getMany.mockResolvedValueOnce([experiment]).mockResolvedValueOnce([]).mockResolvedValueOnce([experiment]);

      const res = await repo.getValidExperimentsForContextAndDecisionPoint('context', 'site1', 'target1');

      expect(res).toHaveLength(0);
    });

    it('should exclude experiments not present in factorDecisionPointPayloadData', async () => {
      const expA = new Experiment();
      expA.id = 'exp-a';
      const expB = new Experiment();
      expB.id = 'exp-b';

      // conditionLevel and segment over-fetch; only expA matches the site/target in factorDecisionPoint
      mock.getMany
        .mockResolvedValueOnce([expA, expB])
        .mockResolvedValueOnce([expA])
        .mockResolvedValueOnce([expA, expB]);

      const res = await repo.getValidExperimentsForContextAndDecisionPoint('context', 'site1', 'target1');

      expect(res).toHaveLength(1);
      expect(res[0].id).toBe('exp-a');
    });

    it('should merge condition, partition, and segment data onto each result experiment', async () => {
      const condData = { id: 'exp-a', conditions: ['cond1'] } as any;
      const factorData = { id: 'exp-a', partitions: ['part1'] } as any;
      const segData = { id: 'exp-a', experimentSegmentInclusion: ['seg1'] } as any;

      mock.getMany
        .mockResolvedValueOnce([condData])
        .mockResolvedValueOnce([factorData])
        .mockResolvedValueOnce([segData]);

      const [result] = await repo.getValidExperimentsForContextAndDecisionPoint('context', 'site1', 'target1');

      expect(result).toMatchObject({
        id: 'exp-a',
        conditions: ['cond1'],
        partitions: ['part1'],
        experimentSegmentInclusion: ['seg1'],
      });
    });

    it('should return experiment without segment data when segment query returns no match', async () => {
      const condData = { id: 'exp-a', conditions: ['cond1'] } as any;
      const factorData = { id: 'exp-a', partitions: ['part1'] } as any;

      mock.getMany.mockResolvedValueOnce([condData]).mockResolvedValueOnce([factorData]).mockResolvedValueOnce([]);

      const [result] = await repo.getValidExperimentsForContextAndDecisionPoint('context', 'site1', 'target1');

      expect(result).toMatchObject({ id: 'exp-a', conditions: ['cond1'], partitions: ['part1'] });
    });

    it('should return factorDecisionPoint data even when conditionLevel query returns no match', async () => {
      const factorData = { id: 'exp-a', partitions: ['part1'] } as any;
      const segData = { id: 'exp-a', experimentSegmentInclusion: ['seg1'] } as any;

      mock.getMany.mockResolvedValueOnce([]).mockResolvedValueOnce([factorData]).mockResolvedValueOnce([segData]);

      const [result] = await repo.getValidExperimentsForContextAndDecisionPoint('context', 'site1', 'target1');

      expect(result).toMatchObject({ id: 'exp-a', partitions: ['part1'], experimentSegmentInclusion: ['seg1'] });
    });

    it('should throw an error when a sub-query fails', async () => {
      mock.getMany.mockRejectedValue(err);

      await expect(repo.getValidExperimentsForContextAndDecisionPoint('context', 'site1', 'target1')).rejects.toThrow();

      expect(repo.createQueryBuilder).toHaveBeenCalledTimes(3);
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
    manager.connection.entityMetadatas = entities;
    manager.connection.getRepository = jest.fn().mockReturnValue(repo);

    jest.spyOn(globalExcludeSegment, 'createGlobalExcludeSegment').mockResolvedValue(Promise.resolve());

    await expect(async () => {
      await repo.clearDB(manager, new UpgradeLogger());
    }).rejects.toThrow('test error');

    expect(manager.connection.getRepository).toHaveBeenCalledTimes(1);
    expect(manager.connection.getRepository).toHaveBeenCalledWith('Experiment');

    expect(repo.query).toHaveBeenCalledTimes(1);
    expect(repo.query).toHaveBeenCalledWith('TRUNCATE Experiment CASCADE;');
  });
});
