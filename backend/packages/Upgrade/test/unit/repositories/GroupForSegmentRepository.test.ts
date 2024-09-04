import { DataSource } from 'typeorm';
import { GroupForSegmentRepository } from '../../../src/api/repositories/GroupForSegmentRepository';
import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';
import { GroupForSegment } from '../../../src/api/models/GroupForSegment';
import { Container } from '../../../src/typeorm-typedi-extensions';
import { initializeMocks } from '../mockdata/mockRepo';

let mock;
let manager;
let dataSource: DataSource;
let repo: GroupForSegmentRepository;
const err = new Error('test error');
const logger = new UpgradeLogger();

const segment = new GroupForSegment();
segment.groupId = 'id1';
segment.type = 'schoolId';

const result = {
  identifiers: [{ id: segment.groupId }],
  generatedMaps: [segment],
  raw: [segment],
};

beforeAll(() => {
  dataSource = new DataSource({
    type: 'postgres',
    database: 'postgres',
    entities: [GroupForSegmentRepository],
    synchronize: true,
  });
  Container.setDataSource('default', dataSource);
});

beforeEach(() => {
  repo = Container.getCustomRepository(GroupForSegmentRepository);
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

describe('GroupForSegmentRepository Testing', () => {
  it('should insert a new group for segment', async () => {
    const res = await repo.insertGroupForSegment([segment], manager, logger);

    expect(manager.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.insert).toHaveBeenCalledTimes(1);
    expect(mock.into).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledWith([segment]);
    expect(mock.orIgnore).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledWith('*');
    expect(mock.execute).toHaveBeenCalledTimes(1);

    expect(res).toEqual([segment]);
  });

  it('should throw an error when insert fails', async () => {
    mock.execute.mockRejectedValue(err);

    expect(async () => {
      await repo.insertGroupForSegment([segment], manager, logger);
    }).rejects.toThrow(err);

    expect(manager.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.insert).toHaveBeenCalledTimes(1);
    expect(mock.into).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledWith([segment]);
    expect(mock.orIgnore).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledWith('*');
    expect(mock.execute).toHaveBeenCalledTimes(1);
  });

  it('should delete a group segment', async () => {
    const res = await repo.deleteGroupForSegment('segment1', segment.groupId, segment.type, logger);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.delete).toHaveBeenCalledTimes(1);
    expect(mock.from).toHaveBeenCalledTimes(1);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledWith('*');
    expect(mock.execute).toHaveBeenCalledTimes(1);

    expect(res).toEqual([segment]);
  });

  it('should throw an error when delete fails', async () => {
    mock.execute.mockRejectedValue(err);

    expect(async () => {
      await repo.deleteGroupForSegment('segment1', segment.groupId, segment.type, logger);
    }).rejects.toThrow(err);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.delete).toHaveBeenCalledTimes(1);
    expect(mock.from).toHaveBeenCalledTimes(1);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledWith('*');
    expect(mock.execute).toHaveBeenCalledTimes(1);
  });

  it('should delete a group for segment by id', async () => {
    const res = await repo.deleteGroupForSegmentById(segment.groupId, manager, logger);

    expect(manager.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.delete).toHaveBeenCalledTimes(1);
    expect(mock.from).toHaveBeenCalledTimes(1);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledWith('*');
    expect(mock.execute).toHaveBeenCalledTimes(1);

    expect(res).toEqual([segment]);
  });

  it('should throw an error when delete fails', async () => {
    mock.execute.mockRejectedValue(err);

    expect(async () => {
      await repo.deleteGroupForSegmentById(segment.groupId, manager, logger);
    }).rejects.toThrow(err);

    expect(manager.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.delete).toHaveBeenCalledTimes(1);
    expect(mock.from).toHaveBeenCalledTimes(1);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledWith('*');
    expect(mock.execute).toHaveBeenCalledTimes(1);
  });

  it('should get group for segment by id', async () => {
    mock.getMany.mockResolvedValue(result.raw);

    const res = await repo.getGroupForSegmentById(segment.groupId, logger);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.leftJoinAndSelect).toHaveBeenCalledTimes(1);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.getMany).toHaveBeenCalledTimes(1);
    expect(res).toEqual([segment]);
  });

  it('should throw an error when get group for segment by id fails', async () => {
    mock.getMany.mockRejectedValue(err);

    expect(async () => {
      await repo.getGroupForSegmentById(segment.groupId, logger);
    }).rejects.toThrow(err);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.leftJoinAndSelect).toHaveBeenCalledTimes(1);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.getMany).toHaveBeenCalledTimes(1);
  });
});
