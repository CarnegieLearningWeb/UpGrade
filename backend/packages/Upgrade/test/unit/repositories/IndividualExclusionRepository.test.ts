import { DataSource } from 'typeorm';
import { IndividualExclusionRepository } from '../../../src/api/repositories/IndividualExclusionRepository';
import { IndividualExclusion } from '../../../src/api/models/IndividualExclusion';
import { Experiment } from '../../../src/api/models/Experiment';
import { ExperimentUser } from '../../../src/api/models/ExperimentUser';
import { Container } from '../../../src/typeorm-typedi-extensions';
import { initializeMocks } from '../mockdata/mockRepo';

let mock;
let dataSource: DataSource;
let repo: IndividualExclusionRepository;
const err = new Error('test error');

const individual = new IndividualExclusion();
individual.id = 'id1';
const user = new ExperimentUser();
user.id = 'uid1';
const exp = new Experiment();
exp.id = 'exp1';
individual.experiment = exp;
individual.user = user;

const result = {
  identifiers: [{ id: individual.id }],
  generatedMaps: [individual],
  raw: [individual],
};

beforeAll(() => {
  dataSource = new DataSource({
    type: 'postgres',
    database: 'postgres',
    entities: [IndividualExclusionRepository],
    synchronize: true,
  });
  Container.setDataSource('default', dataSource);
});

beforeEach(() => {
  repo = Container.getCustomRepository(IndividualExclusionRepository);
  const commonMockData = initializeMocks(result);
  repo.createQueryBuilder = commonMockData.createQueryBuilder;
  mock = commonMockData.mocks;
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('IndividualExclusionRepository Testing', () => {
  it('should insert a new individual experiment exclusion', async () => {
    const res = await repo.saveRawJson([individual]);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.insert).toHaveBeenCalledTimes(1);
    expect(mock.into).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledWith([individual]);
    expect(mock.orIgnore).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledWith('*');
    expect(mock.execute).toHaveBeenCalledTimes(1);

    expect(res).toEqual([individual]);
  });

  it('should throw an error when insert fails', async () => {
    mock.execute.mockRejectedValue(err);

    expect(async () => {
      await repo.saveRawJson([individual]);
    }).rejects.toThrow(err);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.insert).toHaveBeenCalledTimes(1);
    expect(mock.into).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledWith([individual]);
    expect(mock.orIgnore).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledWith('*');
    expect(mock.execute).toHaveBeenCalledTimes(1);
  });

  it('should delete a individual experiment exclusion', async () => {
    const res = await repo.deleteExperimentsForUserId(individual.id, [exp.id]);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.delete).toHaveBeenCalledTimes(1);
    expect(mock.from).toHaveBeenCalledTimes(1);
    expect(mock.whereInIds).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledWith('*');
    expect(mock.execute).toHaveBeenCalledTimes(1);

    expect(res).toEqual([individual]);
  });

  it('should throw an error when delete fails', async () => {
    mock.execute.mockRejectedValue(err);

    expect(async () => {
      await repo.deleteExperimentsForUserId(individual.id, [exp.id]);
    }).rejects.toThrow(err);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.delete).toHaveBeenCalledTimes(1);
    expect(mock.from).toHaveBeenCalledTimes(1);
    expect(mock.whereInIds).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledWith('*');
    expect(mock.execute).toHaveBeenCalledTimes(1);
  });

  it('should determine if user is excluded from experiment', async () => {
    repo.count = jest.fn().mockResolvedValue(1);

    const res = await repo.isUserExcludedFromExperiment(individual.id, exp.id);

    expect(repo.count).toHaveBeenCalledTimes(1);
    expect(repo.count).toHaveBeenCalledWith({
      where: { experiment: { id: exp.id }, user: { id: individual.id } },
    });
    expect(res).toEqual(true);
  });

  it('should throw an error when count fails', async () => {
    repo.count = jest.fn().mockRejectedValue(err);

    expect(async () => {
      await repo.isUserExcludedFromExperiment(individual.id, exp.id);
    }).rejects.toThrow(err);

    expect(repo.count).toHaveBeenCalledTimes(1);
    expect(repo.count).toHaveBeenCalledWith({
      where: { experiment: { id: exp.id }, user: { id: individual.id } },
    });
  });

  it('should find excluded users', async () => {
    const res = await repo.findExcluded(individual.id, [exp.id]);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.whereInIds).toHaveBeenCalledTimes(1);
    expect(mock.getMany).toHaveBeenCalledTimes(1);

    expect(res).toEqual(result);
  });

  it('should throw an error when find excluded users fails', async () => {
    mock.getMany.mockRejectedValue(err);

    expect(async () => {
      await repo.findExcluded(individual.id, [exp.id]);
    }).rejects.toThrow(err);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.whereInIds).toHaveBeenCalledTimes(1);
    expect(mock.getMany).toHaveBeenCalledTimes(1);
  });

  it('should find excluded users by experiment Id', async () => {
    const res = await repo.findExcludedByExperimentId(exp.id);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.leftJoinAndSelect).toHaveBeenCalledTimes(2);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.getMany).toHaveBeenCalledTimes(1);

    expect(res).toEqual(result);

    expect(res).toEqual(result);
  });

  it('should throw an error when find excluded users by experiment Id fails', async () => {
    mock.getMany.mockRejectedValue(err);

    expect(async () => {
      await repo.findExcludedByExperimentId(exp.id);
    }).rejects.toThrow(err);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.leftJoinAndSelect).toHaveBeenCalledTimes(2);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.getMany).toHaveBeenCalledTimes(1);
  });
});
