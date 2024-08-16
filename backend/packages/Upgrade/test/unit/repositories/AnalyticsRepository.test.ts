import { DataSource } from 'typeorm';
import { AnalyticsRepository } from '../../../src/api/repositories/AnalyticsRepository';
import { Experiment } from '../../../src/api/models/Experiment';
import { IndividualEnrollmentRepository } from '../../../src/api/repositories/IndividualEnrollmentRepository';
import { IndividualExclusionRepository } from '../../../src/api/repositories/IndividualExclusionRepository';
import { ExperimentRepository } from '../../../src/api/repositories/ExperimentRepository';
import { GroupExclusionRepository } from '../../../src/api/repositories/GroupExclusionRepository';
import { ASSIGNMENT_UNIT, DATE_RANGE } from 'upgrade_types';
import { User } from '../../../src/api/models/User';
import { ExperimentCondition } from '../../../src/api/models/ExperimentCondition';
import { DecisionPoint } from '../../../src/api/models/DecisionPoint';
import { GroupEnrollmentRepository } from '../../../src/api/repositories/GroupEnrollmentRepository';
import { Container } from '../../../src/typeorm-typedi-extensions';
import { initializeMocks } from '../mockdata/mockRepo';

let individualEnrollmentMock;
let dataSource: DataSource;
let repo: AnalyticsRepository;
let individualEnrollmentRepo: IndividualEnrollmentRepository;
let individualExclusionRepo: IndividualExclusionRepository;
let groupEnrollmentRepo: GroupEnrollmentRepository;
let groupExclusionRepo: GroupExclusionRepository;
let experimentRepo: ExperimentRepository;
let individualExclusionMock;
let groupEnrollmentMock;
let groupExclusionMock;
const err = new Error('test error');

const user = new User();
user.email = 'user@test.com';
const cond = new ExperimentCondition();
cond.id = 'cond1';
const point = new DecisionPoint();
point.id = 'point1';
const experiment = new Experiment();
experiment.id = 'id1';
experiment.assignmentUnit = ASSIGNMENT_UNIT.INDIVIDUAL;
experiment.conditions = [cond];
experiment.partitions = [point];

const result = {
  identifiers: [{ id: experiment.id }],
  generatedMaps: [experiment],
  raw: [experiment],
};

const userResult = [
  {
    identifiers: [{ id: user.email }],
    generatedMaps: [user],
    raw: [user],
    count: 4,
    userCount: 4,
    groupCount: 2,
    conditionId: cond.id,
    partitionId: point.id,
  },
];

beforeAll(() => {
  dataSource = new DataSource({
    type: 'postgres',
    database: 'postgres',
    entities: [AnalyticsRepository, IndividualEnrollmentRepository],
    synchronize: true,
  });
  Container.setDataSource('default', dataSource);
});

beforeEach(() => {
  repo = Container.getCustomRepository(AnalyticsRepository);
  individualEnrollmentRepo = Container.getCustomRepository(IndividualEnrollmentRepository);
  experimentRepo = Container.getCustomRepository(ExperimentRepository);
  individualExclusionRepo = Container.getCustomRepository(IndividualExclusionRepository);
  groupEnrollmentRepo = Container.getCustomRepository(GroupEnrollmentRepository);
  groupExclusionRepo = Container.getCustomRepository(GroupExclusionRepository);

  const commonMockData = initializeMocks(result);
  const experimentMockData = initializeMocks(result);
  const individualExclusionMockData = initializeMocks(result);
  const groupEnrollmentMockData = initializeMocks(result);
  const grtoupExclusionMockData = initializeMocks(result);

  //repo.createQueryBuilder = commonMockData.createQueryBuilder;
  individualEnrollmentRepo.createQueryBuilder = commonMockData.createQueryBuilder;
  experimentRepo.createQueryBuilder = experimentMockData.createQueryBuilder;
  individualExclusionRepo.createQueryBuilder = individualExclusionMockData.createQueryBuilder;
  groupEnrollmentRepo.createQueryBuilder = groupEnrollmentMockData.createQueryBuilder;
  groupExclusionRepo.createQueryBuilder = grtoupExclusionMockData.createQueryBuilder;

  individualEnrollmentMock = commonMockData.mocks;
  individualExclusionMock = individualExclusionMockData.mocks;
  groupEnrollmentMock = groupEnrollmentMockData.mocks;
  groupExclusionMock = grtoupExclusionMockData.mocks;
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('AnalyticsRepository Testing', () => {
  it('should get enrollment count per group', async () => {
    jest.spyOn(Container, 'getCustomRepository').mockReturnValueOnce(individualEnrollmentRepo);

    const res = await repo.getEnrollmentCountPerGroup(experiment.id);

    expect(Container.getCustomRepository).toHaveBeenCalledWith(IndividualEnrollmentRepository);

    expect(individualEnrollmentRepo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(individualEnrollmentMock.select).toHaveBeenCalledTimes(1);
    expect(individualEnrollmentMock.where).toHaveBeenCalledTimes(1);
    expect(individualEnrollmentMock.innerJoin).toHaveBeenCalledTimes(1);
    expect(individualEnrollmentMock.groupBy).toHaveBeenCalledTimes(1);
    expect(individualEnrollmentMock.execute).toHaveBeenCalledTimes(1);

    expect(res).toEqual(result);
  });

  it('should throw an error when get enrollment count per group fails', async () => {
    jest.spyOn(Container, 'getCustomRepository').mockReturnValueOnce(individualEnrollmentRepo);
    individualEnrollmentMock.execute.mockRejectedValue(err);

    expect(async () => {
      await repo.getEnrollmentCountPerGroup(experiment.id);
    }).rejects.toThrow(err);

    expect(Container.getCustomRepository).toHaveBeenCalledWith(IndividualEnrollmentRepository);

    expect(individualEnrollmentRepo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(individualEnrollmentMock.select).toHaveBeenCalledTimes(1);
    expect(individualEnrollmentMock.where).toHaveBeenCalledTimes(1);
    expect(individualEnrollmentMock.innerJoin).toHaveBeenCalledTimes(1);
    expect(individualEnrollmentMock.groupBy).toHaveBeenCalledTimes(1);
    expect(individualEnrollmentMock.execute).toHaveBeenCalledTimes(1);
  });

  it('should get enrollment count per decision point for individual assignment', async () => {
    jest
      .spyOn(Container, 'getCustomRepository')
      .mockReturnValueOnce(experimentRepo)
      .mockReturnValueOnce(individualEnrollmentRepo)
      .mockReturnValueOnce(individualExclusionRepo)
      .mockReturnValueOnce(groupExclusionRepo);

    const decisionPointResult = {
      id: experiment.id,
      users: userResult[0].count,
      groups: 0,
      groupsExcluded: 0,
      usersExcluded: userResult[0].count,
      conditions: [
        {
          id: cond.id,
          users: 4,
          groups: 0,
          partitions: [
            {
              groups: 0,
              users: 4,
              id: point.id,
            },
          ],
        },
      ],
    };

    experimentRepo.findOne = jest.fn().mockResolvedValue(experiment);
    individualEnrollmentMock.execute.mockResolvedValue(userResult);
    individualExclusionMock.execute.mockResolvedValue(userResult);

    const res = await repo.getEnrollmentPerPartitionCondition(experiment.id);

    expect(Container.getCustomRepository).toHaveBeenCalledWith(IndividualEnrollmentRepository);
    expect(Container.getCustomRepository).toHaveBeenCalledWith(ExperimentRepository);
    expect(Container.getCustomRepository).toHaveBeenCalledWith(IndividualExclusionRepository);
    expect(Container.getCustomRepository).toHaveBeenCalledWith(GroupExclusionRepository);

    expect(experimentRepo.findOne).toHaveBeenCalledTimes(1);
    expect(experimentRepo.findOne).toHaveBeenCalledWith({
      where: { id: experiment.id },
      relations: ['partitions', 'conditions'],
    });

    expect(individualEnrollmentRepo.createQueryBuilder).toHaveBeenCalledTimes(3);

    expect(individualEnrollmentMock.select).toHaveBeenCalledTimes(3);
    expect(individualEnrollmentMock.where).toHaveBeenCalledTimes(3);
    expect(individualEnrollmentMock.groupBy).toHaveBeenCalledTimes(5);
    expect(individualEnrollmentMock.execute).toHaveBeenCalledTimes(3);

    expect(individualExclusionRepo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(individualExclusionMock.select).toHaveBeenCalledTimes(1);
    expect(individualExclusionMock.where).toHaveBeenCalledTimes(1);
    expect(individualExclusionMock.execute).toHaveBeenCalledTimes(1);

    expect(res).toEqual(decisionPointResult);
  });

  it('should get enrollment count per decision point for individual assignment with none enrolled', async () => {
    jest
      .spyOn(Container, 'getCustomRepository')
      .mockReturnValueOnce(experimentRepo)
      .mockReturnValueOnce(individualEnrollmentRepo)
      .mockReturnValueOnce(individualExclusionRepo)
      .mockReturnValueOnce(groupExclusionRepo);
    individualEnrollmentMock.execute
      .mockReturnValueOnce([{ count: 0, userCount: 0, groupCount: 0 }])
      .mockReturnValueOnce([{ count: 0 }])
      .mockReturnValueOnce([{ count: 0 }]);
    individualExclusionMock.execute.mockReturnValueOnce([{ count: 0 }]);

    const decisionPointResult = {
      id: experiment.id,
      users: 0,
      groups: 0,
      groupsExcluded: 0,
      usersExcluded: 0,
      conditions: [
        {
          id: cond.id,
          users: 0,
          groups: 0,
          partitions: [
            {
              groups: 0,
              users: 0,
              id: point.id,
            },
          ],
        },
      ],
    };

    experimentRepo.findOne = jest.fn().mockResolvedValue(experiment);
    individualEnrollmentMock.execute.mockResolvedValue(userResult);
    individualExclusionMock.execute.mockResolvedValue(userResult);

    const res = await repo.getEnrollmentPerPartitionCondition(experiment.id);

    expect(Container.getCustomRepository).toHaveBeenCalledWith(IndividualEnrollmentRepository);
    expect(Container.getCustomRepository).toHaveBeenCalledWith(ExperimentRepository);
    expect(Container.getCustomRepository).toHaveBeenCalledWith(IndividualExclusionRepository);
    expect(Container.getCustomRepository).toHaveBeenCalledWith(GroupExclusionRepository);

    expect(experimentRepo.findOne).toHaveBeenCalledTimes(1);
    expect(experimentRepo.findOne).toHaveBeenCalledWith({
      where: { id: experiment.id },
      relations: ['partitions', 'conditions'],
    });

    expect(individualEnrollmentRepo.createQueryBuilder).toHaveBeenCalledTimes(3);

    expect(individualEnrollmentMock.select).toHaveBeenCalledTimes(3);
    expect(individualEnrollmentMock.where).toHaveBeenCalledTimes(3);
    expect(individualEnrollmentMock.groupBy).toHaveBeenCalledTimes(5);
    expect(individualEnrollmentMock.execute).toHaveBeenCalledTimes(3);

    expect(individualExclusionRepo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(individualExclusionMock.select).toHaveBeenCalledTimes(1);
    expect(individualExclusionMock.where).toHaveBeenCalledTimes(1);
    expect(individualExclusionMock.execute).toHaveBeenCalledTimes(1);

    expect(res).toEqual(decisionPointResult);
  });

  it('should get enrollment count per decision point for group assignment', async () => {
    experiment.assignmentUnit = ASSIGNMENT_UNIT.GROUP;

    jest
      .spyOn(Container, 'getCustomRepository')
      .mockReturnValueOnce(experimentRepo)
      .mockReturnValueOnce(individualEnrollmentRepo)
      .mockReturnValueOnce(individualExclusionRepo)
      .mockReturnValueOnce(groupExclusionRepo);

    const decisionPointResult = {
      id: experiment.id,
      users: userResult[0].count,
      groups: userResult[0].groupCount,
      groupsExcluded: userResult[0].userCount,
      usersExcluded: userResult[0].userCount,
      conditions: [
        {
          id: cond.id,
          users: 4,
          groups: 2,
          partitions: [
            {
              groups: 2,
              users: 4,
              id: point.id,
            },
          ],
        },
      ],
    };

    experimentRepo.findOne = jest.fn().mockResolvedValue(experiment);
    individualEnrollmentMock.execute.mockResolvedValue(userResult);
    individualExclusionMock.execute.mockResolvedValue(userResult);
    groupExclusionMock.execute.mockResolvedValue(userResult);

    const res = await repo.getEnrollmentPerPartitionCondition(experiment.id);

    expect(Container.getCustomRepository).toHaveBeenCalledWith(IndividualEnrollmentRepository);
    expect(Container.getCustomRepository).toHaveBeenCalledWith(ExperimentRepository);
    expect(Container.getCustomRepository).toHaveBeenCalledWith(IndividualExclusionRepository);
    expect(Container.getCustomRepository).toHaveBeenCalledWith(GroupExclusionRepository);

    expect(experimentRepo.findOne).toHaveBeenCalledTimes(1);
    expect(experimentRepo.findOne).toHaveBeenCalledWith({
      where: { id: experiment.id },
      relations: ['partitions', 'conditions'],
    });

    expect(individualEnrollmentRepo.createQueryBuilder).toHaveBeenCalledTimes(3);

    expect(individualEnrollmentMock.select).toHaveBeenCalledTimes(3);
    expect(individualEnrollmentMock.where).toHaveBeenCalledTimes(3);
    expect(individualEnrollmentMock.innerJoin).toHaveBeenCalledTimes(3);
    expect(individualEnrollmentMock.groupBy).toHaveBeenCalledTimes(5);
    expect(individualEnrollmentMock.execute).toHaveBeenCalledTimes(3);

    expect(individualExclusionRepo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(individualExclusionMock.select).toHaveBeenCalledTimes(1);
    expect(individualExclusionMock.where).toHaveBeenCalledTimes(1);
    expect(individualExclusionMock.execute).toHaveBeenCalledTimes(1);

    expect(groupExclusionRepo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(groupExclusionMock.select).toHaveBeenCalledTimes(1);
    expect(groupExclusionMock.where).toHaveBeenCalledTimes(1);
    expect(groupExclusionMock.execute).toHaveBeenCalledTimes(1);

    expect(res).toEqual(decisionPointResult);
  });

  it('should get enrollment count per decision point for group assignment with none enrolled', async () => {
    experiment.assignmentUnit = ASSIGNMENT_UNIT.GROUP;

    jest
      .spyOn(Container, 'getCustomRepository')
      .mockReturnValueOnce(experimentRepo)
      .mockReturnValueOnce(individualEnrollmentRepo)
      .mockReturnValueOnce(individualExclusionRepo)
      .mockReturnValueOnce(groupExclusionRepo);

    const decisionPointResult = {
      id: experiment.id,
      users: 0,
      groups: 0,
      groupsExcluded: 0,
      usersExcluded: 0,
      conditions: [
        {
          id: cond.id,
          users: 0,
          groups: 0,
          partitions: [
            {
              groups: 0,
              users: 0,
              id: point.id,
            },
          ],
        },
      ],
    };

    experimentRepo.findOne = jest.fn().mockResolvedValue(experiment);
    individualEnrollmentMock.execute
      .mockResolvedValueOnce([{ count: 0, userCount: 0, groupCount: 0 }])
      .mockResolvedValueOnce([{ count: 0 }])
      .mockResolvedValueOnce([{ count: 0 }]);
    individualExclusionMock.execute.mockResolvedValue([{ count: 0 }]);
    groupExclusionMock.execute.mockResolvedValue([{ count: 0 }]);

    const res = await repo.getEnrollmentPerPartitionCondition(experiment.id);

    expect(Container.getCustomRepository).toHaveBeenCalledWith(IndividualEnrollmentRepository);
    expect(Container.getCustomRepository).toHaveBeenCalledWith(ExperimentRepository);
    expect(Container.getCustomRepository).toHaveBeenCalledWith(IndividualExclusionRepository);
    expect(Container.getCustomRepository).toHaveBeenCalledWith(GroupExclusionRepository);

    expect(experimentRepo.findOne).toHaveBeenCalledTimes(1);
    expect(experimentRepo.findOne).toHaveBeenCalledWith({
      where: { id: experiment.id },
      relations: ['partitions', 'conditions'],
    });

    expect(individualEnrollmentRepo.createQueryBuilder).toHaveBeenCalledTimes(3);

    expect(individualEnrollmentMock.select).toHaveBeenCalledTimes(3);
    expect(individualEnrollmentMock.where).toHaveBeenCalledTimes(3);
    expect(individualEnrollmentMock.innerJoin).toHaveBeenCalledTimes(3);
    expect(individualEnrollmentMock.groupBy).toHaveBeenCalledTimes(5);
    expect(individualEnrollmentMock.execute).toHaveBeenCalledTimes(3);

    expect(individualExclusionRepo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(individualExclusionMock.select).toHaveBeenCalledTimes(1);
    expect(individualExclusionMock.where).toHaveBeenCalledTimes(1);
    expect(individualExclusionMock.execute).toHaveBeenCalledTimes(1);

    expect(groupExclusionRepo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(groupExclusionMock.select).toHaveBeenCalledTimes(1);
    expect(groupExclusionMock.where).toHaveBeenCalledTimes(1);
    expect(groupExclusionMock.execute).toHaveBeenCalledTimes(1);

    expect(res).toEqual(decisionPointResult);
  });

  it('should get empty enrollments for empty experiments', async () => {
    const res = await repo.getEnrollments([]);

    expect(res).toEqual([]);
  });

  it('should get enrollments for experiments', async () => {
    jest
      .spyOn(Container, 'getCustomRepository')
      .mockReturnValueOnce(individualEnrollmentRepo)
      .mockReturnValueOnce(groupEnrollmentRepo);

    const result = {
      groups: 3,
      id: experiment.id,
      users: 4,
    };

    individualEnrollmentMock.execute.mockResolvedValue([{ id: experiment.id, users: 4, groups: 3 }]);
    groupEnrollmentMock.execute.mockResolvedValue([{ id: experiment.id, users: 4, groups: 3 }]);

    const res = await repo.getEnrollments([experiment.id]);

    expect(Container.getCustomRepository).toHaveBeenCalledWith(IndividualEnrollmentRepository);
    expect(Container.getCustomRepository).toHaveBeenCalledWith(GroupEnrollmentRepository);

    expect(individualEnrollmentRepo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(individualEnrollmentMock.select).toHaveBeenCalledTimes(1);
    expect(individualEnrollmentMock.groupBy).toHaveBeenCalledTimes(1);
    expect(individualEnrollmentMock.where).toHaveBeenCalledTimes(1);
    expect(individualEnrollmentMock.andWhere).toHaveBeenCalledTimes(1);
    expect(individualEnrollmentMock.execute).toHaveBeenCalledTimes(1);

    expect(groupEnrollmentRepo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(groupEnrollmentMock.select).toHaveBeenCalledTimes(1);
    expect(groupEnrollmentMock.groupBy).toHaveBeenCalledTimes(1);
    expect(groupEnrollmentMock.where).toHaveBeenCalledTimes(1);
    expect(groupEnrollmentMock.execute).toHaveBeenCalledTimes(1);

    expect(res).toEqual([result]);
  });

  it('should get enrollments for experiments with none enrolled', async () => {
    jest
      .spyOn(Container, 'getCustomRepository')
      .mockReturnValueOnce(individualEnrollmentRepo)
      .mockReturnValueOnce(groupEnrollmentRepo);

    const result = {
      groups: 0,
      id: experiment.id,
      users: 0,
    };

    individualEnrollmentMock.execute.mockResolvedValue([{}]);
    groupEnrollmentMock.execute.mockResolvedValue([{}]);

    const res = await repo.getEnrollments([experiment.id]);

    expect(Container.getCustomRepository).toHaveBeenCalledWith(IndividualEnrollmentRepository);
    expect(Container.getCustomRepository).toHaveBeenCalledWith(GroupEnrollmentRepository);

    expect(individualEnrollmentRepo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(individualEnrollmentMock.select).toHaveBeenCalledTimes(1);
    expect(individualEnrollmentMock.groupBy).toHaveBeenCalledTimes(1);
    expect(individualEnrollmentMock.where).toHaveBeenCalledTimes(1);
    expect(individualEnrollmentMock.andWhere).toHaveBeenCalledTimes(1);
    expect(individualEnrollmentMock.execute).toHaveBeenCalledTimes(1);

    expect(groupEnrollmentRepo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(groupEnrollmentMock.select).toHaveBeenCalledTimes(1);
    expect(groupEnrollmentMock.groupBy).toHaveBeenCalledTimes(1);
    expect(groupEnrollmentMock.where).toHaveBeenCalledTimes(1);
    expect(groupEnrollmentMock.execute).toHaveBeenCalledTimes(1);

    expect(res).toEqual([result]);
  });

  it('should get enrollments by date range last seven days', async () => {
    jest
      .spyOn(Container, 'getCustomRepository')
      .mockReturnValueOnce(experimentRepo)
      .mockReturnValueOnce(individualEnrollmentRepo)
      .mockReturnValueOnce(groupEnrollmentRepo);

    const result = {
      count: 1,
      conditionId: cond.id,
      partitionId: point.id,
      date_range: DATE_RANGE.LAST_SEVEN_DAYS,
    };

    experimentRepo.findOneBy = jest.fn().mockResolvedValue(experiment);
    individualEnrollmentMock.execute.mockResolvedValue([result]);
    groupEnrollmentMock.execute.mockResolvedValue([result]);

    const res = await repo.getEnrollmentByDateRange(experiment.id, DATE_RANGE.LAST_SEVEN_DAYS, 3);

    expect(Container.getCustomRepository).toHaveBeenCalledWith(ExperimentRepository);
    expect(Container.getCustomRepository).toHaveBeenCalledWith(IndividualEnrollmentRepository);
    expect(Container.getCustomRepository).toHaveBeenCalledWith(GroupEnrollmentRepository);

    expect(experimentRepo.findOneBy).toHaveBeenCalledTimes(1);
    expect(experimentRepo.findOneBy).toHaveBeenCalledWith({
      id: experiment.id,
    });

    expect(individualEnrollmentRepo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(individualEnrollmentMock.select).toHaveBeenCalledTimes(1);
    expect(individualEnrollmentMock.where).toHaveBeenCalledTimes(1);
    expect(individualEnrollmentMock.andWhere).toHaveBeenCalledTimes(2);
    expect(individualEnrollmentMock.groupBy).toHaveBeenCalledTimes(3);
    expect(individualEnrollmentMock.execute).toHaveBeenCalledTimes(1);

    expect(groupEnrollmentRepo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(groupEnrollmentMock.select).toHaveBeenCalledTimes(1);
    expect(groupEnrollmentMock.where).toHaveBeenCalledTimes(1);
    expect(groupEnrollmentMock.andWhere).toHaveBeenCalledTimes(1);
    expect(groupEnrollmentMock.groupBy).toHaveBeenCalledTimes(3);
    expect(groupEnrollmentMock.execute).toHaveBeenCalledTimes(1);

    expect(res).toEqual([[result], [result]]);
  });

  it('should get enrollments by date range last six months', async () => {
    jest
      .spyOn(Container, 'getCustomRepository')
      .mockReturnValueOnce(experimentRepo)
      .mockReturnValueOnce(individualEnrollmentRepo)
      .mockReturnValueOnce(groupEnrollmentRepo);

    const result = {
      count: 1,
      conditionId: cond.id,
      partitionId: point.id,
      date_range: DATE_RANGE.LAST_SIX_MONTHS,
    };

    experimentRepo.findOneBy = jest.fn().mockResolvedValue(experiment);
    individualEnrollmentMock.execute.mockResolvedValue([result]);
    groupEnrollmentMock.execute.mockResolvedValue([result]);

    const res = await repo.getEnrollmentByDateRange(experiment.id, DATE_RANGE.LAST_SIX_MONTHS, 3);

    expect(Container.getCustomRepository).toHaveBeenCalledWith(ExperimentRepository);
    expect(Container.getCustomRepository).toHaveBeenCalledWith(IndividualEnrollmentRepository);
    expect(Container.getCustomRepository).toHaveBeenCalledWith(GroupEnrollmentRepository);

    expect(experimentRepo.findOneBy).toHaveBeenCalledTimes(1);
    expect(experimentRepo.findOneBy).toHaveBeenCalledWith({
      id: experiment.id,
    });

    expect(individualEnrollmentRepo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(individualEnrollmentMock.select).toHaveBeenCalledTimes(1);
    expect(individualEnrollmentMock.where).toHaveBeenCalledTimes(1);
    expect(individualEnrollmentMock.andWhere).toHaveBeenCalledTimes(2);
    expect(individualEnrollmentMock.groupBy).toHaveBeenCalledTimes(3);
    expect(individualEnrollmentMock.execute).toHaveBeenCalledTimes(1);

    expect(groupEnrollmentRepo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(groupEnrollmentMock.select).toHaveBeenCalledTimes(1);
    expect(groupEnrollmentMock.where).toHaveBeenCalledTimes(1);
    expect(groupEnrollmentMock.andWhere).toHaveBeenCalledTimes(1);
    expect(groupEnrollmentMock.groupBy).toHaveBeenCalledTimes(3);
    expect(groupEnrollmentMock.execute).toHaveBeenCalledTimes(1);

    expect(res).toEqual([[result], [result]]);
  });

  it('should get enrollments by date range last three months', async () => {
    jest
      .spyOn(Container, 'getCustomRepository')
      .mockReturnValueOnce(experimentRepo)
      .mockReturnValueOnce(individualEnrollmentRepo)
      .mockReturnValueOnce(groupEnrollmentRepo);

    const result = {
      count: 1,
      conditionId: cond.id,
      partitionId: point.id,
      date_range: DATE_RANGE.LAST_THREE_MONTHS,
    };

    experimentRepo.findOneBy = jest.fn().mockResolvedValue(experiment);
    individualEnrollmentMock.execute.mockResolvedValue([result]);
    groupEnrollmentMock.execute.mockResolvedValue([result]);

    const res = await repo.getEnrollmentByDateRange(experiment.id, DATE_RANGE.LAST_THREE_MONTHS, 3);

    expect(Container.getCustomRepository).toHaveBeenCalledWith(ExperimentRepository);
    expect(Container.getCustomRepository).toHaveBeenCalledWith(IndividualEnrollmentRepository);
    expect(Container.getCustomRepository).toHaveBeenCalledWith(GroupEnrollmentRepository);

    expect(experimentRepo.findOneBy).toHaveBeenCalledTimes(1);
    expect(experimentRepo.findOneBy).toHaveBeenCalledWith({
      id: experiment.id,
    });

    expect(individualEnrollmentRepo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(individualEnrollmentMock.select).toHaveBeenCalledTimes(1);
    expect(individualEnrollmentMock.where).toHaveBeenCalledTimes(1);
    expect(individualEnrollmentMock.andWhere).toHaveBeenCalledTimes(2);
    expect(individualEnrollmentMock.groupBy).toHaveBeenCalledTimes(3);
    expect(individualEnrollmentMock.execute).toHaveBeenCalledTimes(1);

    expect(groupEnrollmentRepo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(groupEnrollmentMock.select).toHaveBeenCalledTimes(1);
    expect(groupEnrollmentMock.where).toHaveBeenCalledTimes(1);
    expect(groupEnrollmentMock.andWhere).toHaveBeenCalledTimes(1);
    expect(groupEnrollmentMock.groupBy).toHaveBeenCalledTimes(3);
    expect(groupEnrollmentMock.execute).toHaveBeenCalledTimes(1);

    expect(res).toEqual([[result], [result]]);
  });

  it('should get enrollments by date range last twelve months', async () => {
    jest
      .spyOn(Container, 'getCustomRepository')
      .mockReturnValueOnce(experimentRepo)
      .mockReturnValueOnce(individualEnrollmentRepo)
      .mockReturnValueOnce(groupEnrollmentRepo);

    const result = {
      count: 1,
      conditionId: cond.id,
      partitionId: point.id,
      date_range: DATE_RANGE.LAST_TWELVE_MONTHS,
    };

    experimentRepo.findOneBy = jest.fn().mockResolvedValue(experiment);
    individualEnrollmentMock.execute.mockResolvedValue([result]);
    groupEnrollmentMock.execute.mockResolvedValue([result]);

    const res = await repo.getEnrollmentByDateRange(experiment.id, DATE_RANGE.LAST_TWELVE_MONTHS, 3);

    expect(Container.getCustomRepository).toHaveBeenCalledWith(ExperimentRepository);
    expect(Container.getCustomRepository).toHaveBeenCalledWith(IndividualEnrollmentRepository);
    expect(Container.getCustomRepository).toHaveBeenCalledWith(GroupEnrollmentRepository);

    expect(experimentRepo.findOneBy).toHaveBeenCalledTimes(1);
    expect(experimentRepo.findOneBy).toHaveBeenCalledWith({
      id: experiment.id,
    });

    expect(individualEnrollmentRepo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(individualEnrollmentMock.select).toHaveBeenCalledTimes(1);
    expect(individualEnrollmentMock.where).toHaveBeenCalledTimes(1);
    expect(individualEnrollmentMock.andWhere).toHaveBeenCalledTimes(2);
    expect(individualEnrollmentMock.groupBy).toHaveBeenCalledTimes(3);
    expect(individualEnrollmentMock.execute).toHaveBeenCalledTimes(1);

    expect(groupEnrollmentRepo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(groupEnrollmentMock.select).toHaveBeenCalledTimes(1);
    expect(groupEnrollmentMock.where).toHaveBeenCalledTimes(1);
    expect(groupEnrollmentMock.andWhere).toHaveBeenCalledTimes(1);
    expect(groupEnrollmentMock.groupBy).toHaveBeenCalledTimes(3);
    expect(groupEnrollmentMock.execute).toHaveBeenCalledTimes(1);

    expect(res).toEqual([[result], [result]]);
  });
});
