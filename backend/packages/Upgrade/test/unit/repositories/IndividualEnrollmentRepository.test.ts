import { DataSource, In } from 'typeorm';
import { IndividualEnrollmentRepository } from '../../../src/api/repositories/IndividualEnrollmentRepository';
import { IndividualEnrollment } from '../../../src/api/models/IndividualEnrollment';
import { Experiment } from '../../../src/api/models/Experiment';
import { ExperimentUser } from '../../../src/api/models/ExperimentUser';
import { Container } from '../../../src/typeorm-typedi-extensions';
import { initializeMocks } from '../mockdata/mockRepo';

let mock;
let dataSource: DataSource;
let repo: IndividualEnrollmentRepository;
const err = new Error('test error');

const individual = new IndividualEnrollment();
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
    entities: [IndividualEnrollmentRepository],
    synchronize: true,
  });
  Container.setDataSource('default', dataSource);
});

beforeEach(() => {
  repo = Container.getCustomRepository(IndividualEnrollmentRepository);
  const commonMockData = initializeMocks(result);
  repo.createQueryBuilder = commonMockData.createQueryBuilder;
  mock = commonMockData.mocks;
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('IndividualEnrollmentRepository Testing', () => {
  it('should delete a individual experiment enrollment', async () => {
    repo.delete = jest.fn().mockResolvedValue(result);

    const res = await repo.deleteEnrollmentsOfUserInExperiments(individual.id, [exp.id]);

    expect(repo.delete).toHaveBeenCalledTimes(1);
    expect(repo.delete).toHaveBeenCalledWith({
      user: { id: individual.id },
      experiment: { id: In([exp.id]) },
    });

    expect(res).toEqual(result);
  });

  it('should throw an error when delete fails', async () => {
    repo.delete = jest.fn().mockRejectedValue(err);

    expect(async () => {
      await repo.deleteEnrollmentsOfUserInExperiments(individual.id, [exp.id]);
    }).rejects.toThrow(err);

    expect(repo.delete).toHaveBeenCalledTimes(1);
    expect(repo.delete).toHaveBeenCalledWith({
      user: { id: individual.id },
      experiment: { id: In([exp.id]) },
    });
  });

  it('should find enrollments', async () => {
    repo.find = jest.fn().mockResolvedValue(result);

    const res = await repo.findEnrollments(individual.id, [exp.id]);

    expect(repo.find).toHaveBeenCalledTimes(1);
    expect(repo.find).toHaveBeenCalledWith({
      where: { experimentId: In([exp.id]), userId: individual.id },
      select: ['id', 'experimentId', 'enrollmentCode', 'conditionId'],
    });

    expect(res).toEqual(result);
  });

  it('should throw an error when find enrollments fails', async () => {
    repo.find = jest.fn().mockRejectedValue(err);

    expect(async () => {
      await repo.findEnrollments(individual.id, [exp.id]);
    }).rejects.toThrow(err);

    expect(repo.find).toHaveBeenCalledTimes(1);
    expect(repo.find).toHaveBeenCalledWith({
      where: { experimentId: In([exp.id]), userId: individual.id },
      select: ['id', 'experimentId', 'enrollmentCode', 'conditionId'],
    });
  });

  it('should get enrollment count for experiment', async () => {
    const result = [
      {
        id: exp.id,
        count: 40,
      },
    ];
    mock.execute.mockResolvedValue(result);

    const res = await repo.getEnrollmentCountForExperiment(exp.id);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.select).toHaveBeenCalledTimes(1);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.execute).toHaveBeenCalledTimes(1);

    expect(res).toEqual(result[0].count);
  });

  it('should throw an error when get enrollment count for experiment fails', async () => {
    mock.execute.mockRejectedValue(err);

    expect(async () => {
      await repo.getEnrollmentCountForExperiment(exp.id);
    }).rejects.toThrow(err);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.select).toHaveBeenCalledTimes(1);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.execute).toHaveBeenCalledTimes(1);
  });
});
