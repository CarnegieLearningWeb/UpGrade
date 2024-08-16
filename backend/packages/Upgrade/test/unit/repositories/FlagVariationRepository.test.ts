import { DataSource } from 'typeorm';
import { FlagVariationRepository } from '../../../src/api/repositories/FlagVariationRepository';
import { FlagVariation } from '../../../src/api/models/FlagVariation';
import { Container } from '../../../src/typeorm-typedi-extensions';
import { initializeMocks } from '../mockdata/mockRepo';

let mock;
let manager;
let dataSource: DataSource;
let repo: FlagVariationRepository;
const err = new Error('test error');

const flag = new FlagVariation();
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
    entities: [FlagVariationRepository],
    synchronize: true,
  });
  Container.setDataSource('default', dataSource);
});

beforeEach(() => {
  repo = Container.getCustomRepository(FlagVariationRepository);
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

describe('FlagVariationRepository Testing', () => {
  it('should insert a new flag', async () => {
    const res = await repo.insertVariations([flag], manager);

    expect(manager.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.insert).toHaveBeenCalledTimes(1);
    expect(mock.into).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledWith([flag]);
    expect(mock.returning).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledWith('*');
    expect(mock.execute).toHaveBeenCalledTimes(1);

    expect(res).toEqual([flag]);
  });

  it('should throw an error when insert fails', async () => {
    mock.execute.mockRejectedValue(err);

    expect(async () => {
      await repo.insertVariations([flag], manager);
    }).rejects.toThrow(err);

    expect(manager.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.insert).toHaveBeenCalledTimes(1);
    expect(mock.into).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledWith([flag]);
    expect(mock.returning).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledWith('*');
    expect(mock.execute).toHaveBeenCalledTimes(1);
  });

  it('should delete a flag', async () => {
    await repo.deleteVariation(flag.id, manager);

    expect(manager.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.delete).toHaveBeenCalledTimes(1);
    expect(mock.from).toHaveBeenCalledTimes(1);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.execute).toHaveBeenCalledTimes(1);
  });

  it('should throw an error when delete fails', async () => {
    mock.execute.mockRejectedValue(err);

    expect(async () => {
      await repo.deleteVariation(flag.id, manager);
    }).rejects.toThrow(err);

    expect(manager.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.delete).toHaveBeenCalledTimes(1);
    expect(mock.from).toHaveBeenCalledTimes(1);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.execute).toHaveBeenCalledTimes(1);
  });

  it('should update flag', async () => {
    const res = await repo.upsertFlagVariation(flag, manager);

    expect(manager.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.insert).toHaveBeenCalledTimes(1);
    expect(mock.into).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledWith(flag);
    expect(mock.orUpdate).toHaveBeenCalledTimes(1);
    expect(mock.setParameter).toHaveBeenCalledTimes(4);
    expect(mock.returning).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledWith('*');
    expect(mock.execute).toHaveBeenCalledTimes(1);

    expect(res).toEqual(flag);
  });

  it('should throw an error when update flag fails', async () => {
    mock.execute.mockRejectedValue(err);

    expect(async () => {
      await repo.upsertFlagVariation(flag, manager);
    }).rejects.toThrow(err);

    expect(manager.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.insert).toHaveBeenCalledTimes(1);
    expect(mock.into).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledWith(flag);
    expect(mock.orUpdate).toHaveBeenCalledTimes(1);
    expect(mock.setParameter).toHaveBeenCalledTimes(4);
    expect(mock.returning).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledWith('*');
    expect(mock.execute).toHaveBeenCalledTimes(1);
  });
});
