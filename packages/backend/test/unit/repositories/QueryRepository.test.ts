import { DataSource } from 'typeorm';
import { QueryRepository } from '../../../src/api/repositories/QueryRepository';
import { Query } from '../../../src/api/models/Query';
import { Container } from '../../../src/typeorm-typedi-extensions';
import { initializeMocks } from '../mockdata/mockRepo';

let mock;
let manager;
let dataSource: DataSource;
let repo: QueryRepository;
const err = new Error('test error');

const query = new Query();
query.id = 'id1';

const result = {
  identifiers: [{ id: query.id }],
  generatedMaps: [query],
  raw: [query],
};

beforeAll(() => {
  dataSource = new DataSource({
    type: 'postgres',
    database: 'postgres',
    entities: [QueryRepository],
    synchronize: true,
  });
  Container.setDataSource('default', dataSource);
});

beforeEach(() => {
  repo = Container.getCustomRepository(QueryRepository);
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

describe('QueryRepository Testing', () => {
  it('should upsert a new query', async () => {
    const res = await repo.upsertQuery(query, manager);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.insert).toHaveBeenCalledTimes(1);
    expect(mock.into).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledTimes(1);
    expect(mock.orUpdate).toHaveBeenCalledTimes(1);
    expect(mock.setParameter).toHaveBeenCalledTimes(4);
    expect(mock.returning).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledWith('*');
    expect(mock.execute).toHaveBeenCalledTimes(1);

    expect(res).toEqual(query);
  });

  it('should throw an error when insert fails', async () => {
    mock.execute.mockRejectedValue(err);

    expect(async () => {
      await repo.upsertQuery(query, manager);
    }).rejects.toThrow(err);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.insert).toHaveBeenCalledTimes(1);
    expect(mock.into).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledTimes(1);
    expect(mock.orUpdate).toHaveBeenCalledTimes(1);
    expect(mock.setParameter).toHaveBeenCalledTimes(4);
    expect(mock.returning).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledWith('*');
    expect(mock.execute).toHaveBeenCalledTimes(1);
  });

  it('should delete a query', async () => {
    await repo.deleteQuery(query.id, manager);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.delete).toHaveBeenCalledTimes(1);
    expect(mock.from).toHaveBeenCalledTimes(1);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.execute).toHaveBeenCalledTimes(1);
  });

  it('should throw an error when delete fails', async () => {
    mock.execute.mockRejectedValue(err);

    expect(async () => {
      await repo.deleteQuery(query.id, manager);
    }).rejects.toThrow(err);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.delete).toHaveBeenCalledTimes(1);
    expect(mock.from).toHaveBeenCalledTimes(1);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.execute).toHaveBeenCalledTimes(1);
  });

  it('should insert several queries', async () => {
    const res = await repo.insertQueries([query, query], manager);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.insert).toHaveBeenCalledTimes(1);
    expect(mock.into).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledWith([query, query]);
    expect(mock.returning).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledWith('*');
    expect(mock.execute).toHaveBeenCalledTimes(1);

    expect(res).toEqual([query]);
  });

  it('should throw an error when inserting queries fail', async () => {
    mock.execute.mockRejectedValue(err);

    expect(async () => {
      await repo.insertQueries([query, query], manager);
    }).rejects.toThrow(err);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.insert).toHaveBeenCalledTimes(1);
    expect(mock.into).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledWith([query, query]);
    expect(mock.returning).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledWith('*');
    expect(mock.execute).toHaveBeenCalledTimes(1);
  });

  it('should check if query exists and return true when query exists', async () => {
    mock.getMany.mockResolvedValue([query]);
    const res = await repo.checkIfQueryExists(query.id);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.innerJoinAndSelect).toHaveBeenCalledTimes(1);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.getMany).toHaveBeenCalledTimes(1);

    expect(res).toEqual(true);
  });

  it('should check if query exists and return false when query does not exist', async () => {
    const res = await repo.checkIfQueryExists('id2');

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.innerJoinAndSelect).toHaveBeenCalledTimes(1);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.getMany).toHaveBeenCalledTimes(1);

    expect(res).toEqual(false);
  });

  it('should throw an error when finding a query fails', async () => {
    mock.getMany.mockRejectedValue(err);

    expect(async () => {
      await repo.checkIfQueryExists(query.id);
    }).rejects.toThrow(err);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.innerJoinAndSelect).toHaveBeenCalledTimes(1);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.getMany).toHaveBeenCalledTimes(1);
  });
});
