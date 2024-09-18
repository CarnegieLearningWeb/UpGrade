import { DataSource, In } from 'typeorm';
import { GroupEnrollmentRepository } from '../../../src/api/repositories/GroupEnrollmentRepository';
import { GroupEnrollment } from '../../../src/api/models/GroupEnrollment';
import { Experiment } from '../../../src/api/models/Experiment';
import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';
import { Container } from '../../../src/typeorm-typedi-extensions';
import { initializeMocks } from '../mockdata/mockRepo';

let mock;
let dataSource: DataSource;
let repo: GroupEnrollmentRepository;
const err = new Error('test error');
const logger = new UpgradeLogger();

const group = new GroupEnrollment();
group.id = 'id1';
const exp = new Experiment();
exp.id = 'exp1';
group.experiment = exp;

const result = {
  identifiers: [{ id: group.id }],
  generatedMaps: [group],
  raw: group,
};

beforeAll(() => {
  dataSource = new DataSource({
    type: 'postgres',
    database: 'postgres',
    entities: [GroupEnrollmentRepository],
    synchronize: true,
  });
  Container.setDataSource('default', dataSource);
});

beforeEach(() => {
  repo = Container.getCustomRepository(GroupEnrollmentRepository);
  const commonMockData = initializeMocks(result);
  repo.createQueryBuilder = commonMockData.createQueryBuilder;
  mock = commonMockData.mocks;
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('GroupEnrollmentRepository Testing', () => {
  it('should find enrollments', async () => {
    repo.find = jest.fn().mockResolvedValue(result);

    const res = await repo.findEnrollments([group.id], [exp.id]);

    expect(repo.find).toHaveBeenCalledTimes(1);
    expect(repo.find).toHaveBeenCalledWith({
      where: { experiment: { id: In([exp.id]) }, groupId: In([group.id]) },
      relations: ['experiment', 'condition'],
    });

    expect(res).toEqual(result);
  });

  it('should throw an error when find enrollments fails', async () => {
    repo.find = jest.fn().mockRejectedValue(err);

    expect(async () => {
      await repo.findEnrollments([group.id], [exp.id]);
    }).rejects.toThrow(err);

    expect(repo.find).toHaveBeenCalledTimes(1);
    expect(repo.find).toHaveBeenCalledWith({
      where: { experiment: { id: In([exp.id]) }, groupId: In([group.id]) },
      relations: ['experiment', 'condition'],
    });
  });

  it('should delete group enrollment', async () => {
    const res = await repo.deleteGroupEnrollment(group.id, logger);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.delete).toHaveBeenCalledTimes(1);
    expect(mock.from).toHaveBeenCalledTimes(1);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.execute).toHaveBeenCalledTimes(1);

    expect(res).toEqual(group);
  });

  it('should throw an error when delete fails', async () => {
    mock.execute.mockRejectedValue(err);

    expect(async () => {
      await repo.deleteGroupEnrollment(group.id, logger);
    }).rejects.toThrow(err);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.delete).toHaveBeenCalledTimes(1);
    expect(mock.from).toHaveBeenCalledTimes(1);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.execute).toHaveBeenCalledTimes(1);
  });
});
