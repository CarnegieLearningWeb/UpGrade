import { DataSource } from 'typeorm';
import { DecisionPointRepository } from '../../../src/api/repositories/DecisionPointRepository';
import { DecisionPoint } from '../../../src/api/models/DecisionPoint';
import { Container } from '../../../src/typeorm-typedi-extensions';
import { initializeMocks } from '../mockdata/mockRepo';

let mock;
let manager;
let repo: DecisionPointRepository;
let dataSource: DataSource;
const err = new Error('test error');

const decisionPoint = new DecisionPoint();
decisionPoint.id = 'id1';
decisionPoint.excludeIfReached = true;

const result = {
  identifiers: [{ id: decisionPoint.id }],
  generatedMaps: [decisionPoint],
  raw: [decisionPoint],
};

beforeAll(() => {
  dataSource = new DataSource({
    type: 'postgres',
    database: 'postgres',
    entities: [DecisionPointRepository],
    synchronize: true,
  });
  Container.setDataSource('default', dataSource);
});

beforeEach(() => {
  repo = Container.getCustomRepository(DecisionPointRepository);
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

describe('DecisionPointRepository Testing', () => {
  it('should upsert a new decision point', async () => {
    const res = await repo.upsertDecisionPoint(decisionPoint, manager);

    expect(manager.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.insert).toHaveBeenCalledTimes(1);
    expect(mock.into).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledWith(decisionPoint);
    expect(mock.orUpdate).toHaveBeenCalledTimes(1);
    expect(mock.setParameter).toHaveBeenCalledTimes(4);
    expect(mock.returning).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledWith('*');
    expect(mock.execute).toHaveBeenCalledTimes(1);

    expect(res).toEqual(decisionPoint);
  });

  it('should throw an error when upsert fails', async () => {
    mock.execute.mockRejectedValue(err);

    expect(async () => {
      await repo.upsertDecisionPoint(decisionPoint, manager);
    }).rejects.toThrow(err);

    expect(manager.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.into).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledWith(decisionPoint);
    expect(mock.orUpdate).toHaveBeenCalledTimes(1);
    expect(mock.setParameter).toHaveBeenCalledTimes(4);
    expect(mock.returning).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledWith('*');
    expect(mock.execute).toHaveBeenCalledTimes(1);
  });

  it('should insert new decision points', async () => {
    const res = await repo.insertDecisionPoint([decisionPoint], manager);

    expect(manager.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.insert).toHaveBeenCalledTimes(1);
    expect(mock.into).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledWith([decisionPoint]);
    expect(mock.returning).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledWith('*');
    expect(mock.execute).toHaveBeenCalledTimes(1);

    expect(res).toEqual([decisionPoint]);
  });

  it('should throw an error when insert fails', async () => {
    mock.execute.mockRejectedValue(err);

    expect(async () => {
      await repo.insertDecisionPoint([decisionPoint], manager);
    }).rejects.toThrow(err);

    expect(manager.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.insert).toHaveBeenCalledTimes(1);
    expect(mock.into).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledWith([decisionPoint]);
    expect(mock.returning).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledWith('*');
    expect(mock.execute).toHaveBeenCalledTimes(1);
  });

  it('should delete decision points', async () => {
    const res = await repo.deleteByIds([decisionPoint.id], manager);

    expect(manager.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.delete).toHaveBeenCalledTimes(1);
    expect(mock.from).toHaveBeenCalledTimes(1);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.execute).toHaveBeenCalledTimes(1);

    expect(res).toEqual([decisionPoint]);
  });

  it('should throw an error when delete fails', async () => {
    mock.execute.mockRejectedValue(err);

    expect(async () => {
      await repo.deleteByIds([decisionPoint.id], manager);
    }).rejects.toThrow(err);

    expect(manager.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.delete).toHaveBeenCalledTimes(1);
    expect(mock.from).toHaveBeenCalledTimes(1);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.execute).toHaveBeenCalledTimes(1);
  });

  it('should delete an decision point', async () => {
    await repo.deleteDecisionPoint(decisionPoint.id, manager);

    expect(manager.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.delete).toHaveBeenCalledTimes(1);
    expect(mock.from).toHaveBeenCalledTimes(1);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.execute).toHaveBeenCalledTimes(1);
  });

  it('should throw an error when delete fails', async () => {
    mock.execute.mockRejectedValue(err);

    expect(async () => {
      await repo.deleteDecisionPoint(decisionPoint.id, manager);
    }).rejects.toThrow(err);

    expect(manager.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.delete).toHaveBeenCalledTimes(1);
    expect(mock.from).toHaveBeenCalledTimes(1);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.execute).toHaveBeenCalledTimes(1);
  });

  it('should get all unique decision points', async () => {
    mock.getMany.mockResolvedValue([decisionPoint, decisionPoint]);
    const res = await repo.getAllUniqueIdentifier();

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.select).toHaveBeenCalledTimes(1);
    expect(mock.getMany).toHaveBeenCalledTimes(1);

    expect(res).toEqual([decisionPoint.twoCharacterId, decisionPoint.twoCharacterId]);
  });

  it('should throw an error when get unique decision points fails', async () => {
    mock.getMany.mockRejectedValue(err);

    expect(async () => {
      await repo.getAllUniqueIdentifier();
    }).rejects.toThrow(err);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.select).toHaveBeenCalledTimes(1);
    expect(mock.getMany).toHaveBeenCalledTimes(1);
  });

  it('should get decision point and name', async () => {
    mock.getMany.mockResolvedValue([decisionPoint, decisionPoint]);
    const res = await repo.partitionPointAndName();

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.select).toHaveBeenCalledTimes(1);
    expect(mock.getMany).toHaveBeenCalledTimes(1);

    expect(res).toEqual([decisionPoint, decisionPoint]);
  });

  it('should throw an error when get decision point and name fails', async () => {
    mock.getMany.mockRejectedValue(err);

    expect(async () => {
      await repo.partitionPointAndName();
    }).rejects.toThrow(err);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.select).toHaveBeenCalledTimes(1);
    expect(mock.getMany).toHaveBeenCalledTimes(1);
  });
});
