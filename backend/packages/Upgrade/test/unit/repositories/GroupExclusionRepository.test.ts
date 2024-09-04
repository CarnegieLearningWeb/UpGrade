import { DataSource } from 'typeorm';
import { GroupExclusionRepository } from '../../../src/api/repositories/GroupExclusionRepository';
import { GroupExclusion } from '../../../src/api/models/GroupExclusion';
import { Experiment } from '../../../src/api/models/Experiment';
import { Container } from '../../../src/typeorm-typedi-extensions';
import { initializeMocks } from '../mockdata/mockRepo';

let mock;
let dataSource: DataSource;
let repo: GroupExclusionRepository;
const err = new Error('test error');

const group = new GroupExclusion();
group.id = 'id1';
const exp = new Experiment();
exp.id = 'exp1';
group.experiment = exp;

const result = {
  identifiers: [{ id: group.id }],
  generatedMaps: [group],
  raw: [group],
};

beforeAll(() => {
  dataSource = new DataSource({
    type: 'postgres',
    database: 'postgres',
    entities: [GroupExclusionRepository],
    synchronize: true,
  });
  Container.setDataSource('default', dataSource);
});

beforeEach(() => {
  repo = Container.getCustomRepository(GroupExclusionRepository);
  const commonMockData = initializeMocks(result);
  repo.createQueryBuilder = commonMockData.createQueryBuilder;
  mock = commonMockData.mocks;
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('GroupExclusionRepository Testing', () => {
  it('should insert a new group experiment exclusion', async () => {
    const res = await repo.saveRawJson([group]);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.insert).toHaveBeenCalledTimes(1);
    expect(mock.into).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledWith([group]);
    expect(mock.orIgnore).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledWith('*');
    expect(mock.execute).toHaveBeenCalledTimes(1);

    expect(res).toEqual([group]);
  });

  it('should throw an error when insert fails', async () => {
    mock.execute.mockRejectedValue(err);

    expect(async () => {
      await repo.saveRawJson([group]);
    }).rejects.toThrow(err);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.insert).toHaveBeenCalledTimes(1);
    expect(mock.into).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledWith([group]);
    expect(mock.orIgnore).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledWith('*');
    expect(mock.execute).toHaveBeenCalledTimes(1);
  });

  it('should delete a group experiment exclusion', async () => {
    const res = await repo.deleteByExperimentIds([exp.id]);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.delete).toHaveBeenCalledTimes(1);
    expect(mock.from).toHaveBeenCalledTimes(1);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledWith('*');
    expect(mock.execute).toHaveBeenCalledTimes(1);

    expect(res).toEqual([group]);
  });

  it('should throw an error when delete fails', async () => {
    mock.execute.mockRejectedValue(err);

    expect(async () => {
      await repo.deleteByExperimentIds([exp.id]);
    }).rejects.toThrow(err);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.delete).toHaveBeenCalledTimes(1);
    expect(mock.from).toHaveBeenCalledTimes(1);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledWith('*');
    expect(mock.execute).toHaveBeenCalledTimes(1);
  });

  it('should determine if user is excluded from experiment', async () => {
    repo.count = jest.fn().mockResolvedValue(1);

    const res = await repo.isGroupExcludedFromExperiment(group.id, exp.id);

    expect(repo.count).toHaveBeenCalledTimes(1);
    expect(repo.count).toHaveBeenCalledWith({
      where: { groupId: group.id, experiment: { id: exp.id } },
    });

    expect(res).toEqual(true);
  });

  it('should throw an error when count fails', async () => {
    repo.count = jest.fn().mockRejectedValue(err);

    expect(async () => {
      await repo.isGroupExcludedFromExperiment(group.id, exp.id);
    }).rejects.toThrow(err);

    expect(repo.count).toHaveBeenCalledTimes(1);
    expect(repo.count).toHaveBeenCalledWith({
      where: { groupId: group.id, experiment: { id: exp.id } },
    });
  });

  it('should find excluded users', async () => {
    const res = await repo.findExcluded([group.id], [exp.id]);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.leftJoinAndSelect).toHaveBeenCalledTimes(1);
    expect(mock.whereInIds).toHaveBeenCalledTimes(1);
    expect(mock.getMany).toHaveBeenCalledTimes(1);

    expect(res).toEqual(result);
  });

  it('should throw an error when find excluded users fails', async () => {
    mock.getMany.mockRejectedValue(err);

    expect(async () => {
      await repo.findExcluded([group.id], [exp.id]);
    }).rejects.toThrow(err);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.leftJoinAndSelect).toHaveBeenCalledTimes(1);
    expect(mock.whereInIds).toHaveBeenCalledTimes(1);
    expect(mock.getMany).toHaveBeenCalledTimes(1);
  });

  it('should find excluded users by experiment Id', async () => {
    const res = await repo.findExcludedByExperimentId(exp.id);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.leftJoinAndSelect).toHaveBeenCalledTimes(1);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.getMany).toHaveBeenCalledTimes(1);

    expect(res).toEqual(result);
  });

  it('should throw an error when find excluded users by experiment Id fails', async () => {
    mock.getMany.mockRejectedValue(err);

    expect(async () => {
      await repo.findExcludedByExperimentId(exp.id);
    }).rejects.toThrow(err);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.leftJoinAndSelect).toHaveBeenCalledTimes(1);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.getMany).toHaveBeenCalledTimes(1);
  });
});
