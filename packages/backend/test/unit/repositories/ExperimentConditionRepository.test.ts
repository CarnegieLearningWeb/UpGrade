import { DataSource } from 'typeorm';
import { ExperimentConditionRepository } from '../../../src/api/repositories/ExperimentConditionRepository';
import { ExperimentCondition } from '../../../src/api/models/ExperimentCondition';
import { Container } from '../../../src/typeorm-typedi-extensions';
import { initializeMocks } from '../mockdata/mockRepo';

let mock;
let manager;
let dataSource: DataSource;
let repo: ExperimentConditionRepository;
const err = new Error('test error');

const experimentCond = new ExperimentCondition();
experimentCond.id = 'id1';
experimentCond.twoCharacterId = 'ab';

const result = {
  identifiers: [{ id: experimentCond.id }],
  generatedMaps: [experimentCond],
  raw: [experimentCond],
};

beforeAll(() => {
  dataSource = new DataSource({
    type: 'postgres',
    database: 'postgres',
    entities: [ExperimentConditionRepository],
    synchronize: true,
  });
  Container.setDataSource('default', dataSource);
});

beforeEach(() => {
  repo = Container.getCustomRepository(ExperimentConditionRepository);
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

describe('ExperimentConditionRepository Testing', () => {
  it('should upsert a new experiment condition', async () => {
    const res = await repo.upsertExperimentCondition(experimentCond, manager);

    expect(manager.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.insert).toHaveBeenCalledTimes(1);
    expect(mock.into).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledWith(experimentCond);
    expect(mock.orUpdate).toHaveBeenCalledTimes(1);
    expect(mock.setParameter).toHaveBeenCalledTimes(5);
    expect(mock.returning).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledWith('*');
    expect(mock.execute).toHaveBeenCalledTimes(1);

    expect(res).toEqual(experimentCond);
  });

  it('should throw an error when upsert fails', async () => {
    mock.execute.mockRejectedValue(err);

    expect(async () => {
      await repo.upsertExperimentCondition(experimentCond, manager);
    }).rejects.toThrow(err);

    expect(mock.insert).toHaveBeenCalledTimes(1);
    expect(mock.into).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledWith(experimentCond);
    expect(mock.orUpdate).toHaveBeenCalledTimes(1);
    expect(mock.setParameter).toHaveBeenCalledTimes(5);
    expect(mock.returning).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledWith('*');
    expect(mock.execute).toHaveBeenCalledTimes(1);
  });

  it('should insert new experiment conditions', async () => {
    const res = await repo.insertConditions([experimentCond], manager);

    expect(manager.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.insert).toHaveBeenCalledTimes(1);
    expect(mock.into).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledWith([experimentCond]);
    expect(mock.returning).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledWith('*');
    expect(mock.execute).toHaveBeenCalledTimes(1);

    expect(res).toEqual([experimentCond]);
  });

  it('should throw an error when insert fails', async () => {
    mock.execute.mockRejectedValue(err);

    expect(async () => {
      await repo.insertConditions([experimentCond], manager);
    }).rejects.toThrow(err);

    expect(manager.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.insert).toHaveBeenCalledTimes(1);
    expect(mock.into).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledWith([experimentCond]);
    expect(mock.returning).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledWith('*');
    expect(mock.execute).toHaveBeenCalledTimes(1);
  });

  it('should delete experiment conditions', async () => {
    const res = await repo.deleteByIds([experimentCond.id], manager);

    expect(manager.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.delete).toHaveBeenCalledTimes(1);
    expect(mock.from).toHaveBeenCalledTimes(1);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.execute).toHaveBeenCalledTimes(1);

    expect(res).toEqual([experimentCond]);
  });

  it('should throw an error when delete fails', async () => {
    mock.execute.mockRejectedValue(err);

    expect(async () => {
      await repo.deleteByIds([experimentCond.id], manager);
    }).rejects.toThrow(err);

    expect(manager.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.delete).toHaveBeenCalledTimes(1);
    expect(mock.from).toHaveBeenCalledTimes(1);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.execute).toHaveBeenCalledTimes(1);
  });

  it('should delete an experiment condition', async () => {
    await repo.deleteCondition(experimentCond.id, manager);

    expect(manager.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.delete).toHaveBeenCalledTimes(1);
    expect(mock.from).toHaveBeenCalledTimes(1);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.execute).toHaveBeenCalledTimes(1);
  });

  it('should throw an error when delete fails', async () => {
    mock.execute.mockRejectedValue(err);

    expect(async () => {
      await repo.deleteCondition(experimentCond.id, manager);
    }).rejects.toThrow(err);

    expect(mock.delete).toHaveBeenCalledTimes(1);
    expect(mock.from).toHaveBeenCalledTimes(1);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.execute).toHaveBeenCalledTimes(1);
  });

  it('should get all unique experiment conditions', async () => {
    mock.getMany.mockResolvedValue([experimentCond, experimentCond]);
    const res = await repo.getAllUniqueIdentifier();

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.select).toHaveBeenCalledTimes(1);
    expect(mock.getMany).toHaveBeenCalledTimes(1);

    expect(res).toEqual([experimentCond.twoCharacterId, experimentCond.twoCharacterId]);
  });

  it('should throw an error when get unique experiment conditions fails', async () => {
    mock.getMany.mockRejectedValue(err);

    expect(async () => {
      await repo.getAllUniqueIdentifier();
    }).rejects.toThrow(err);

    expect(mock.select).toHaveBeenCalledTimes(1);
    expect(mock.getMany).toHaveBeenCalledTimes(1);
  });
});
