import { DataSource } from 'typeorm';
import { SegmentRepository } from '../../../src/api/repositories/SegmentRepository';
import { Segment } from '../../../src/api/models/Segment';
import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';
import { Container } from '../../../src/typeorm-typedi-extensions';
import { initializeMocks } from '../mockdata/mockRepo';

let mock;
let dataSource: DataSource;
let repo: SegmentRepository;
const err = new Error('test error');
const logger = new UpgradeLogger();

const segment = new Segment();
segment.id = 'id1';

const result = {
  identifiers: [{ id: segment.id }],
  generatedMaps: [segment],
  raw: [segment],
};

beforeAll(() => {
  dataSource = new DataSource({
    type: 'postgres',
    database: 'postgres',
    entities: [SegmentRepository],
    synchronize: true,
  });
  Container.setDataSource('default', dataSource);
});

beforeEach(() => {
  repo = Container.getCustomRepository(SegmentRepository);
  const commonMockData = initializeMocks(result);
  repo.createQueryBuilder = commonMockData.createQueryBuilder;
  mock = commonMockData.mocks;
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('SegmentRepository Testing', () => {
  it('should upsert a new segment', async () => {
    const res = await repo.upsertSegment(segment, logger);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.insert).toHaveBeenCalledTimes(1);
    expect(mock.into).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledWith(segment);
    expect(mock.orUpdate).toHaveBeenCalledTimes(1);
    expect(mock.setParameter).toHaveBeenCalledTimes(3);
    expect(mock.returning).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledWith('*');
    expect(mock.execute).toHaveBeenCalledTimes(1);

    expect(res).toEqual(segment);
  });

  it('should throw an error when upsert fails', async () => {
    mock.execute.mockRejectedValue(err);

    expect(async () => {
      await repo.upsertSegment(segment, logger);
    }).rejects.toThrow(err);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.insert).toHaveBeenCalledTimes(1);
    expect(mock.into).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledWith(segment);
    expect(mock.orUpdate).toHaveBeenCalledTimes(1);
    expect(mock.setParameter).toHaveBeenCalledTimes(3);
    expect(mock.returning).toHaveBeenCalledTimes(1);
  });

  it('should insert a new segment', async () => {
    const res = await repo.insertSegment(segment, logger);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.insert).toHaveBeenCalledTimes(1);
    expect(mock.into).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledWith(segment);
    expect(mock.orIgnore).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledWith('*');
    expect(mock.execute).toHaveBeenCalledTimes(1);

    expect(res).toEqual([segment]);
  });

  it('should throw an error when insert fails', async () => {
    mock.execute.mockRejectedValue(err);

    expect(async () => {
      await repo.insertSegment(segment, logger);
    }).rejects.toThrow(err);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.insert).toHaveBeenCalledTimes(1);
    expect(mock.into).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledWith(segment);
    expect(mock.orIgnore).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledTimes(1);
  });

  it('should delete segment', async () => {
    const res = await repo.deleteSegment(segment.id, logger);

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
      await repo.deleteSegment(segment.id, logger);
    }).rejects.toThrow(err);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.delete).toHaveBeenCalledTimes(1);
    expect(mock.from).toHaveBeenCalledTimes(1);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledWith('*');
    expect(mock.execute).toHaveBeenCalledTimes(1);
  });

  it('should get all segments', async () => {
    mock.getMany.mockResolvedValue([segment]);
    const res = await repo.getAllSegments(logger);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.leftJoinAndSelect).toHaveBeenCalledTimes(2);
    expect(mock.getMany).toHaveBeenCalledTimes(1);

    expect(res).toEqual([segment]);
  });

  it('should throw an error when get all segments fails', async () => {
    mock.getMany.mockRejectedValue(err);

    expect(async () => {
      await repo.getAllSegments(logger);
    }).rejects.toThrow(err);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.leftJoinAndSelect).toHaveBeenCalledTimes(2);
    expect(mock.getMany).toHaveBeenCalledTimes(1);
  });

  it('should get segment by id', async () => {
    const res = await repo.getSegmentById(segment.id, logger);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.getOne).toHaveBeenCalledTimes(1);

    expect(res).toEqual(segment);
  });

  it('should throw an error when get segment by id fails', async () => {
    mock.getOne.mockRejectedValue(err);

    expect(async () => {
      await repo.getSegmentById(segment.id, logger);
    }).rejects.toThrow(err);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.getOne).toHaveBeenCalledTimes(1);
  });
});
