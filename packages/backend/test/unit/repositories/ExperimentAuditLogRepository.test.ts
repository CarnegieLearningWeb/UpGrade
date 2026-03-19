import { DataSource } from 'typeorm';
import { ExperimentAuditLogRepository } from '../../../src/api/repositories/ExperimentAuditLogRepository';
import { ExperimentAuditLog } from '../../../src/api/models/ExperimentAuditLog';
import { LOG_TYPE } from 'upgrade_types';
import { User } from '../../../src/api/models/User';
import { Container } from '../../../src/typeorm-typedi-extensions';
import { initializeMocks } from '../mockdata/mockRepo';

let mock;
let manager;
let dataSource: DataSource;
let repo: ExperimentAuditLogRepository;
const err = new Error('test error');

const experiment = new ExperimentAuditLog();
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
    entities: [ExperimentAuditLogRepository],
    synchronize: true,
  });
  Container.setDataSource('default', dataSource);
});

beforeEach(() => {
  repo = Container.getCustomRepository(ExperimentAuditLogRepository);
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

describe('ExperimentAuditLogRepository Testing', () => {
  it('should save new audit log', async () => {
    const res = await repo.saveRawJson(LOG_TYPE.EXPERIMENT_UPDATED, experiment, new User(), manager);

    expect(manager.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.insert).toHaveBeenCalledTimes(1);
    expect(mock.into).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledWith('*');
    expect(mock.execute).toHaveBeenCalledTimes(1);

    expect(res).toEqual([experiment]);
  });

  it('should save new audit log without entity manager', async () => {
    const res = await repo.saveRawJson(LOG_TYPE.EXPERIMENT_UPDATED, experiment, new User(), null);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.insert).toHaveBeenCalledTimes(1);
    expect(mock.into).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledWith('*');
    expect(mock.execute).toHaveBeenCalledTimes(1);

    expect(res).toEqual([experiment]);
  });

  it('should throw an error when insert fails', async () => {
    mock.execute.mockRejectedValue(err);

    expect(async () => {
      await repo.saveRawJson(LOG_TYPE.EXPERIMENT_UPDATED, experiment, new User(), manager);
    }).rejects.toThrow(err);

    expect(manager.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.insert).toHaveBeenCalledTimes(1);
    expect(mock.into).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledWith('*');
    expect(mock.execute).toHaveBeenCalledTimes(1);
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

    await expect(repo.clearLogs(4)).rejects.toThrow(err);

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
    const res = await repo.getTotalLogs({ filter: LOG_TYPE.EXPERIMENT_CREATED });

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.getCount).toHaveBeenCalledTimes(1);

    expect(res).toEqual(5);
  });

  it('should get total logs with experimentId', async () => {
    const experimentId = '550e8400-e29b-41d4-a716-446655440000';
    const res = await repo.getTotalLogs({ filter: LOG_TYPE.EXPERIMENT_CREATED, experimentId });

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.andWhere).toHaveBeenCalledTimes(1);
    expect(mock.getCount).toHaveBeenCalledTimes(1);

    expect(res).toEqual(5);
  });

  it('should get total logs with only experimentId (no filter)', async () => {
    const experimentId = '550e8400-e29b-41d4-a716-446655440000';
    const res = await repo.getTotalLogs({ experimentId });

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.andWhere).not.toHaveBeenCalled();
    expect(mock.getCount).toHaveBeenCalledTimes(1);

    expect(res).toEqual(5);
  });

  it('should get total logs with flagId', async () => {
    const flagId = '550e8400-e29b-41d4-a716-446655440001';
    const res = await repo.getTotalLogs({ filter: LOG_TYPE.FEATURE_FLAG_UPDATED, flagId });

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.andWhere).toHaveBeenCalledTimes(1);
    expect(mock.getCount).toHaveBeenCalledTimes(1);

    expect(res).toEqual(5);
  });

  it('should get total logs with only flagId (no filter)', async () => {
    const flagId = '550e8400-e29b-41d4-a716-446655440001';
    const res = await repo.getTotalLogs({ flagId });

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.andWhere).not.toHaveBeenCalled();
    expect(mock.getCount).toHaveBeenCalledTimes(1);

    expect(res).toEqual(5);
  });

  it('should throw an error when get total logs fails', async () => {
    mock.getCount.mockRejectedValue(err);

    await expect(repo.getTotalLogs({ filter: LOG_TYPE.EXPERIMENT_CREATED })).rejects.toThrow(err);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.getCount).toHaveBeenCalledTimes(1);
  });

  it('should find paginated', async () => {
    const res = await repo.paginatedFind({ take: 3, skip: 0, filter: LOG_TYPE.EXPERIMENT_CREATED });

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.offset).toHaveBeenCalledTimes(1);
    expect(mock.offset).toHaveBeenCalledWith(0);
    expect(mock.limit).toHaveBeenCalledTimes(1);
    expect(mock.limit).toHaveBeenCalledWith(3);
    expect(mock.leftJoinAndSelect).toHaveBeenCalledTimes(1);
    expect(mock.orderBy).toHaveBeenCalledTimes(1);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.getMany).toHaveBeenCalledTimes(1);

    expect(res).toEqual(result);
  });

  it('should find paginated with no filter', async () => {
    const res = await repo.paginatedFind({ take: 3, skip: 0, filter: null });

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.offset).toHaveBeenCalledTimes(1);
    expect(mock.offset).toHaveBeenCalledWith(0);
    expect(mock.limit).toHaveBeenCalledTimes(1);
    expect(mock.limit).toHaveBeenCalledWith(3);
    expect(mock.leftJoinAndSelect).toHaveBeenCalledTimes(1);
    expect(mock.orderBy).toHaveBeenCalledTimes(1);
    expect(mock.where).not.toHaveBeenCalled();
    expect(mock.getMany).toHaveBeenCalledTimes(1);

    expect(res).toEqual(result);
  });

  it('should find paginated with experimentId', async () => {
    const experimentId = '550e8400-e29b-41d4-a716-446655440000';
    const res = await repo.paginatedFind({ take: 3, skip: 0, filter: LOG_TYPE.EXPERIMENT_CREATED, experimentId });

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.offset).toHaveBeenCalledTimes(1);
    expect(mock.offset).toHaveBeenCalledWith(0);
    expect(mock.limit).toHaveBeenCalledTimes(1);
    expect(mock.limit).toHaveBeenCalledWith(3);
    expect(mock.leftJoinAndSelect).toHaveBeenCalledTimes(1);
    expect(mock.orderBy).toHaveBeenCalledTimes(1);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.andWhere).toHaveBeenCalledTimes(1);
    expect(mock.getMany).toHaveBeenCalledTimes(1);

    expect(res).toEqual(result);
  });

  it('should find paginated with only experimentId (no filter)', async () => {
    const experimentId = '550e8400-e29b-41d4-a716-446655440000';
    const res = await repo.paginatedFind({ take: 3, skip: 0, experimentId });

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.offset).toHaveBeenCalledTimes(1);
    expect(mock.offset).toHaveBeenCalledWith(0);
    expect(mock.limit).toHaveBeenCalledTimes(1);
    expect(mock.limit).toHaveBeenCalledWith(3);
    expect(mock.leftJoinAndSelect).toHaveBeenCalledTimes(1);
    expect(mock.orderBy).toHaveBeenCalledTimes(1);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.andWhere).not.toHaveBeenCalled();
    expect(mock.getMany).toHaveBeenCalledTimes(1);

    expect(res).toEqual(result);
  });

  it('should find paginated with flagId', async () => {
    const flagId = '550e8400-e29b-41d4-a716-446655440001';
    const res = await repo.paginatedFind({ take: 3, skip: 0, filter: LOG_TYPE.FEATURE_FLAG_UPDATED, flagId });

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.offset).toHaveBeenCalledTimes(1);
    expect(mock.offset).toHaveBeenCalledWith(0);
    expect(mock.limit).toHaveBeenCalledTimes(1);
    expect(mock.limit).toHaveBeenCalledWith(3);
    expect(mock.leftJoinAndSelect).toHaveBeenCalledTimes(1);
    expect(mock.orderBy).toHaveBeenCalledTimes(1);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.andWhere).toHaveBeenCalledTimes(1);
    expect(mock.getMany).toHaveBeenCalledTimes(1);

    expect(res).toEqual(result);
  });

  it('should find paginated with only flagId (no filter)', async () => {
    const flagId = '550e8400-e29b-41d4-a716-446655440001';
    const res = await repo.paginatedFind({ take: 3, skip: 0, flagId });

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.offset).toHaveBeenCalledTimes(1);
    expect(mock.offset).toHaveBeenCalledWith(0);
    expect(mock.limit).toHaveBeenCalledTimes(1);
    expect(mock.limit).toHaveBeenCalledWith(3);
    expect(mock.leftJoinAndSelect).toHaveBeenCalledTimes(1);
    expect(mock.orderBy).toHaveBeenCalledTimes(1);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.andWhere).not.toHaveBeenCalled();
    expect(mock.getMany).toHaveBeenCalledTimes(1);

    expect(res).toEqual(result);
  });

  it('should throw an error when find paginated fails', async () => {
    mock.getMany.mockRejectedValue(err);

    await expect(repo.paginatedFind({ take: 3, skip: 0, filter: LOG_TYPE.EXPERIMENT_CREATED })).rejects.toThrow(err);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.offset).toHaveBeenCalledTimes(1);
    expect(mock.offset).toHaveBeenCalledWith(0);
    expect(mock.limit).toHaveBeenCalledTimes(1);
    expect(mock.limit).toHaveBeenCalledWith(3);
    expect(mock.leftJoinAndSelect).toHaveBeenCalledTimes(1);
    expect(mock.orderBy).toHaveBeenCalledTimes(1);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.getMany).toHaveBeenCalledTimes(1);
  });
});
