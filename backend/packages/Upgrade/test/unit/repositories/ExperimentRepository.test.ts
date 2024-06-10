import { DataSource } from 'typeorm';
import { ExperimentRepository } from '../../../src/api/repositories/ExperimentRepository';
import { Experiment } from '../../../src/api/models/Experiment';
import { EXPERIMENT_STATE } from 'upgrade_types';
//import * as globalExcludeSegment from '../../../src/init/seed/globalExcludeSegment';
import { Container } from '../../../src/typeorm-typedi-extensions';
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

    expect(mock.leftJoinAndSelect).toHaveBeenCalledTimes(22);
    expect(mock.select).toHaveBeenCalledTimes(1);
    expect(mock.getMany).toHaveBeenCalledTimes(4);

    expect(res).toEqual(result);
  });

  it('should throw an error when find all experiments fails', async () => {
    mock.getMany.mockRejectedValue(err);

    expect(async () => {
      await repo.findAllExperiments();
    }).rejects.toThrow(err);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(4);

    expect(mock.leftJoinAndSelect).toHaveBeenCalledTimes(22);
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

  // TODO: Work in progress for following test cases
  /*it('should clear the database', async () => {
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
    manager.connection = connection;
    connection.entityMetadatas = entities;
    connection.getRepository = sandbox.stub().returns(ExperimentRepository.prototype);

    const queryStub = sandbox.stub(ExperimentRepository.prototype, 'query').returns(Promise.resolve());

    const segStub = sandbox.stub(globalExcludeSegment, 'createGlobalExcludeSegment').returns(Promise.resolve());

    const res = await repo.clearDB(manager, new UpgradeLogger());

    sinon.assert.calledOnce(queryStub);
    sinon.assert.calledOnce(segStub);

    expect(res).toBeUndefined();
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
    manager.connection = connection;
    connection.entityMetadatas = entities;
    connection.getRepository = sandbox.stub().returns(ExperimentRepository.prototype);
    sandbox.stub(ExperimentRepository.prototype, 'query').returns(Promise.reject(err));

    expect(async () => {
      await repo.clearDB(manager, new UpgradeLogger());
    }).rejects.toThrow('test error');
  });*/
});
