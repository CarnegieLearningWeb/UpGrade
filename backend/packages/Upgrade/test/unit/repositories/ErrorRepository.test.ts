import { DataSource } from 'typeorm';
import { ErrorRepository } from '../../../src/api/repositories/ErrorRepository';
import { ExperimentError } from '../../../src/api/models/ExperimentError';
import { SERVER_ERROR } from 'upgrade_types';
import { Container } from '../../../src/typeorm-typedi-extensions';
import { initializeMocks } from '../mockdata/mockRepo';

let mock;
let dataSource: DataSource;
let repo: ErrorRepository;
const err = new Error('test error');

const experiment = new ExperimentError();
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
    entities: [ExperimentError],
    synchronize: true,
  });
  Container.setDataSource('default', dataSource);
});

beforeAll(() => {
  dataSource = new DataSource({
    type: 'postgres',
    database: 'postgres',
    entities: [ErrorRepository],
    synchronize: true,
  });
  Container.setDataSource('default', dataSource);
});

beforeEach(() => {
  repo = Container.getCustomRepository(ErrorRepository);
  const commonMockData = initializeMocks(result);
  repo.createQueryBuilder = commonMockData.createQueryBuilder;
  mock = commonMockData.mocks;
});

afterEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('ErrorRepository Testing', () => {
  it('should save new audit log', async () => {
    const res = await repo.saveRawJson(experiment);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.insert).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledWith(experiment);
    expect(mock.returning).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledWith('*');
    expect(mock.execute).toHaveBeenCalledTimes(1);

    expect(res).toEqual(experiment);
  });

  it('should throw an error when insert fails', async () => {
    mock.execute.mockRejectedValue(err);

    expect(async () => {
      await repo.saveRawJson(experiment as any);
    }).rejects.toThrow(err);

    expect(mock.insert).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledWith(experiment);
    expect(mock.returning).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledWith('*');
    expect(mock.execute).toHaveBeenCalledTimes(1);
    expect(mock.execute).toHaveBeenCalledWith();
  });

  it('should clear logs', async () => {
    const res = await repo.clearLogs(4);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(2);

    expect(mock.select).toHaveBeenCalledTimes(1);
    expect(mock.orderBy).toHaveBeenCalledTimes(1);
    expect(mock.limit).toHaveBeenCalledTimes(1);
    expect(mock.limit).toHaveBeenCalledWith(4);
    expect(mock.getQuery).toHaveBeenCalledTimes(1);

    expect(mock.delete).toHaveBeenCalledTimes(1);
    expect(mock.from).toHaveBeenCalledTimes(1);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.execute).toHaveBeenCalledTimes(1);

    expect(res).toEqual([experiment]);
  });

  it('should throw an error when clear fails', async () => {
    mock.execute.mockRejectedValue(err);

    await expect(() => repo.clearLogs(4)).rejects.toThrow();

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(2);

    expect(mock.select).toHaveBeenCalledTimes(1);
    expect(mock.orderBy).toHaveBeenCalledTimes(1);
    expect(mock.limit).toHaveBeenCalledTimes(1);
    expect(mock.limit).toHaveBeenCalledWith(4);
    expect(mock.getQuery).toHaveBeenCalledTimes(1);

    expect(mock.delete).toHaveBeenCalledTimes(1);
    expect(mock.from).toHaveBeenCalledTimes(1);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.execute).toHaveBeenCalledTimes(1);
  });

  it('should get total logs', async () => {
    const res = await repo.getTotalLogs(SERVER_ERROR.CONDITION_NOT_FOUND);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.getCount).toHaveBeenCalledTimes(1);

    expect(res).toEqual(5);
  });

  it('should throw an error when get total logs fails', async () => {
    mock.getCount.mockRejectedValue(err);

    expect(async () => {
      await repo.getTotalLogs(SERVER_ERROR.CONDITION_NOT_FOUND);
    }).rejects.toThrow(err);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.getCount).toHaveBeenCalledTimes(1);
  });

  it('should find paginated', async () => {
    const res = await repo.paginatedFind(3, 0, SERVER_ERROR.ASSIGNMENT_ERROR);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.offset).toHaveBeenCalledTimes(1);
    expect(mock.offset).toHaveBeenCalledWith(0);
    expect(mock.limit).toHaveBeenCalledTimes(1);
    expect(mock.limit).toHaveBeenCalledWith(3);
    expect(mock.orderBy).toHaveBeenCalledTimes(1);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.getMany).toHaveBeenCalledTimes(1);

    expect(res).toEqual(result);
  });

  it('should find paginated with no filter', async () => {
    const res = await repo.paginatedFind(3, 0, null);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.offset).toHaveBeenCalledTimes(1);
    expect(mock.offset).toHaveBeenCalledWith(0);
    expect(mock.limit).toHaveBeenCalledTimes(1);
    expect(mock.limit).toHaveBeenCalledWith(3);
    expect(mock.orderBy).toHaveBeenCalledTimes(1);
    expect(mock.where).not.toHaveBeenCalled();
    expect(mock.getMany).toHaveBeenCalledTimes(1);

    expect(res).toEqual(result);
  });

  it('should throw an error when find paginated fails', async () => {
    mock.getMany.mockRejectedValue(err);

    expect(async () => {
      await repo.paginatedFind(3, 0, SERVER_ERROR.ASSIGNMENT_ERROR);
    }).rejects.toThrow(err);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.offset).toHaveBeenCalledTimes(1);
    expect(mock.offset).toHaveBeenCalledWith(0);
    expect(mock.limit).toHaveBeenCalledTimes(1);
    expect(mock.limit).toHaveBeenCalledWith(3);
    expect(mock.orderBy).toHaveBeenCalledTimes(1);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.getMany).toHaveBeenCalledTimes(1);
  });
});
