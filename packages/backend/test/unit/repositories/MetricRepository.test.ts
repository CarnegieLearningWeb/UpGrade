import { DataSource } from 'typeorm';
import { MetricRepository } from '../../../src/api/repositories/MetricRepository';
import { Metric } from '../../../src/api/models/Metric';
import { Container } from '../../../src/typeorm-typedi-extensions';
import { initializeMocks } from '../mockdata/mockRepo';

let mock;
let dataSource: DataSource;
let repo: MetricRepository;
const err = new Error('test error');

const metric = new Metric();
metric.key = 'key1';

const result = {
  identifiers: [{ id: metric.key }],
  generatedMaps: [metric],
  raw: [metric],
};

beforeAll(() => {
  dataSource = new DataSource({
    type: 'postgres',
    database: 'postgres',
    entities: [MetricRepository],
    synchronize: true,
  });
  Container.setDataSource('default', dataSource);
});

beforeEach(() => {
  repo = Container.getCustomRepository(MetricRepository);
  const commonMockData = initializeMocks(result);
  repo.createQueryBuilder = commonMockData.createQueryBuilder;
  mock = commonMockData.mocks;
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('MetricRepository Testing', () => {
  it('should delete a metric', async () => {
    const res = await repo.deleteMetricsByKeys(metric.key, 'jointext');

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.delete).toHaveBeenCalledTimes(1);
    expect(mock.from).toHaveBeenCalledTimes(1);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledWith('*');
    expect(mock.execute).toHaveBeenCalledTimes(1);

    expect(res).toEqual([metric]);
  });

  it('should throw an error when delete fails', async () => {
    mock.execute.mockRejectedValue(err);

    expect(async () => {
      await repo.deleteMetricsByKeys(metric.key, 'jointext');
    }).rejects.toThrow(err);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.delete).toHaveBeenCalledTimes(1);
    expect(mock.from).toHaveBeenCalledTimes(1);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledWith('*');
    expect(mock.execute).toHaveBeenCalledTimes(1);
  });

  it('should get metrics by key', async () => {
    const res = await repo.getMetricsByKeys(metric.key, 'jointext');

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.getMany).toHaveBeenCalledTimes(1);

    expect(res).toEqual(result);
  });

  it('should throw an error when get metric by key fails', async () => {
    mock.getMany.mockRejectedValue(err);

    expect(async () => {
      await repo.getMetricsByKeys(metric.key, 'jointext');
    }).rejects.toThrow(err);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.getMany).toHaveBeenCalledTimes(1);
  });

  it('should get find metrics with queries', async () => {
    const res = await repo.findMetricsWithQueries([metric.key]);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.innerJoin).toHaveBeenCalledTimes(2);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.andWhere).toHaveBeenCalledTimes(1);
    expect(mock.getMany).toHaveBeenCalledTimes(1);

    expect(res).toEqual(result);
  });

  it('should throw an error when get monitored experiment metric by date range fails', async () => {
    mock.getMany.mockRejectedValue(err);

    expect(async () => {
      await repo.findMetricsWithQueries([metric.key]);
    }).rejects.toThrow(err);

    expect(mock.innerJoin).toHaveBeenCalledTimes(2);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.andWhere).toHaveBeenCalledTimes(1);
    expect(mock.getMany).toHaveBeenCalledTimes(1);
  });
});
