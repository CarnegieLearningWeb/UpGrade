import { DataSource } from 'typeorm';
import { MonitoredDecisionPointRepository } from '../../../src/api/repositories/MonitoredDecisionPointRepository';
import { MonitoredDecisionPoint } from '../../../src/api/models/MonitoredDecisionPoint';
import { ExperimentUser } from '../../../src/api/models/ExperimentUser';
import { Container } from '../../../src/typeorm-typedi-extensions';
import { initializeMocks } from '../mockdata/mockRepo';

let mock;
let manager;
let dataSource: DataSource;
let repo: MonitoredDecisionPointRepository;
const err = new Error('test error');

const point = new MonitoredDecisionPoint();
point.id = 'id1';
const user = new ExperimentUser();
user.id = 'user1';
point.user = user;

const result = {
  identifiers: [{ id: point.id }],
  generatedMaps: [point],
  raw: [point],
};

beforeAll(() => {
  dataSource = new DataSource({
    type: 'postgres',
    database: 'postgres',
    entities: [MonitoredDecisionPointRepository],
    synchronize: true,
  });
  Container.setDataSource('default', dataSource);
});

beforeEach(() => {
  repo = Container.getCustomRepository(MonitoredDecisionPointRepository);
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

describe('MonitoredDecisionPointRepository Testing', () => {
  it('should insert a new monitored experiment point', async () => {
    const res = await repo.saveRawJson(point);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.insert).toHaveBeenCalledTimes(1);
    expect(mock.into).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledWith(point);
    expect(mock.orUpdate).toHaveBeenCalledTimes(1);
    expect(mock.setParameter).toHaveBeenCalledTimes(2);
    expect(mock.returning).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledWith('*');
    expect(mock.execute).toHaveBeenCalledTimes(1);

    expect(res).toEqual(point);
  });

  it('should insert a new monitored experiment point with no data', async () => {
    mock.execute.mockResolvedValue({ raw: [] });
    const res = await repo.saveRawJson(point);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.insert).toHaveBeenCalledTimes(1);
    expect(mock.into).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledWith(point);
    expect(mock.orUpdate).toHaveBeenCalledTimes(1);
    expect(mock.setParameter).toHaveBeenCalledTimes(2);
    expect(mock.returning).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledWith('*');
    expect(mock.execute).toHaveBeenCalledTimes(1);

    expect(res).toEqual({});
  });

  it('should throw an error when insert fails', async () => {
    mock.execute.mockRejectedValue(err);

    expect(async () => {
      await repo.saveRawJson(point);
    }).rejects.toThrow(err);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.insert).toHaveBeenCalledTimes(1);
    expect(mock.into).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledWith(point);
    expect(mock.orUpdate).toHaveBeenCalledTimes(1);
    expect(mock.setParameter).toHaveBeenCalledTimes(2);
    expect(mock.returning).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledWith('*');
    expect(mock.execute).toHaveBeenCalledTimes(1);
  });

  it('should delete a monitored experiment point', async () => {
    const res = await repo.deleteByExperimentId([point.id], manager);

    expect(manager.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.delete).toHaveBeenCalledTimes(1);
    expect(mock.from).toHaveBeenCalledTimes(1);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.execute).toHaveBeenCalledTimes(1);

    expect(res).toEqual([point]);
  });

  it('should throw an error when delete fails', async () => {
    mock.execute.mockRejectedValue(err);

    expect(async () => {
      await repo.deleteByExperimentId([point.id], manager);
    }).rejects.toThrow(err);

    expect(manager.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.delete).toHaveBeenCalledTimes(1);
    expect(mock.from).toHaveBeenCalledTimes(1);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.execute).toHaveBeenCalledTimes(1);
  });

  it('should get monitored experiment point count', async () => {
    const res = await repo.getMonitoredExperimentPointCount([point.id]);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.getCount).toHaveBeenCalledTimes(1);
    expect(res).toEqual(5);
  });

  it('should throw an error when find point by id fails', async () => {
    mock.getCount.mockRejectedValue(err);

    expect(async () => {
      await repo.getMonitoredExperimentPointCount([point.id]);
    }).rejects.toThrow(err);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.getCount).toHaveBeenCalledTimes(1);
  });

  it('should get monitored experiment point by date range', async () => {
    const res = await repo.getByDateRange([point.id], new Date('2019-01-16'), new Date('2019-01-20'));

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.leftJoinAndSelect).toHaveBeenCalledTimes(1);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.andWhere).toHaveBeenCalledTimes(1);
    expect(mock.getMany).toHaveBeenCalledTimes(1);
    expect(res).toEqual(result);
  });

  it('should get monitored experiment point by date range with from undefined', async () => {
    const res = await repo.getByDateRange([point.id], undefined, new Date('2019-01-20'));

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.leftJoinAndSelect).toHaveBeenCalledTimes(1);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.andWhere).toHaveBeenCalledTimes(1);
    expect(mock.getMany).toHaveBeenCalledTimes(1);

    expect(res).toEqual(result);
  });

  it('should get monitored experiment point by date range with to undefined', async () => {
    const res = await repo.getByDateRange([point.id], new Date('2019-01-20'), undefined);

    expect(mock.leftJoinAndSelect).toHaveBeenCalledTimes(1);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.andWhere).toHaveBeenCalledTimes(1);
    expect(mock.getMany).toHaveBeenCalledTimes(1);

    expect(res).toEqual(result);
  });

  it('should throw an error when get monitored experiment point by date range fails', async () => {
    mock.getMany.mockRejectedValue(err);

    expect(async () => {
      await repo.getByDateRange([point.id], new Date('2019-01-16'), new Date('2019-01-20'));
    }).rejects.toThrow(err);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.leftJoinAndSelect).toHaveBeenCalledTimes(1);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.andWhere).toHaveBeenCalledTimes(1);
    expect(mock.getMany).toHaveBeenCalledTimes(1);
  });
});
