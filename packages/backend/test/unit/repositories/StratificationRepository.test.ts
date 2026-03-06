import { DataSource } from 'typeorm';
import { StratificationFactorRepository } from '../../../src/api/repositories/StratificationFactorRepository';
import { StratificationFactor } from '../../../src/api/models/StratificationFactor';
import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';
import { Container } from '../../../src/typeorm-typedi-extensions';
import { initializeMocks } from '../mockdata/mockRepo';

let mock;
let manager;
let dataSource: DataSource;
let repo: StratificationFactorRepository;
const err = new Error('test error');
const logger = new UpgradeLogger();

const stratificationFactor = new StratificationFactor();
stratificationFactor.stratificationFactorName = 'factor1';

const result = {
  identifiers: [{ stratificationFactor: stratificationFactor.stratificationFactorName }],
  generatedMaps: [stratificationFactor],
  raw: [stratificationFactor],
};

beforeAll(() => {
  dataSource = new DataSource({
    type: 'postgres',
    database: 'postgres',
    entities: [StratificationFactorRepository],
    synchronize: true,
  });
  Container.setDataSource('default', dataSource);
});

beforeEach(() => {
  repo = Container.getCustomRepository(StratificationFactorRepository);
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

describe('StratificationFactorRepository Testing', () => {
  it('should insert a new stratification factor', async () => {
    const res = await repo.insertStratificationFactor([stratificationFactor], manager);

    expect(manager.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.insert).toHaveBeenCalledTimes(1);
    expect(mock.into).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledWith([stratificationFactor]);
    expect(mock.returning).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledWith('*');
    expect(mock.execute).toHaveBeenCalledTimes(1);

    expect(res).toEqual([stratificationFactor]);
  });

  it('should throw an error when insert fails', async () => {
    mock.execute.mockRejectedValueOnce(err);

    expect(async () => {
      await repo.insertStratificationFactor([stratificationFactor], manager);
    }).rejects.toThrow(err);

    expect(manager.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.insert).toHaveBeenCalledTimes(1);
    expect(mock.into).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledWith([stratificationFactor]);
    expect(mock.returning).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledWith('*');
    expect(mock.execute).toHaveBeenCalledTimes(1);
  });

  it('should delete stratification factor', async () => {
    const res = await repo.deleteStratificationFactorByName(stratificationFactor.stratificationFactorName, logger);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.delete).toHaveBeenCalledTimes(1);
    expect(mock.from).toHaveBeenCalledTimes(1);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledWith('*');
    expect(mock.execute).toHaveBeenCalledTimes(1);

    expect(res).toEqual(stratificationFactor);
  });

  it('should throw an error when delete fails', async () => {
    mock.execute.mockRejectedValueOnce(err);

    expect(async () => {
      await repo.deleteStratificationFactorByName(stratificationFactor.stratificationFactorName, logger);
    }).rejects.toThrow(err);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.delete).toHaveBeenCalledTimes(1);
    expect(mock.from).toHaveBeenCalledTimes(1);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledWith('*');
    expect(mock.execute).toHaveBeenCalledTimes(1);
  });
});
