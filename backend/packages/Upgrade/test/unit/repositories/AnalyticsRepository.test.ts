import { Connection, ConnectionManager, EntityManager, SelectQueryBuilder } from 'typeorm';
import * as sinon from 'sinon';
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

let sandbox;
const connection = sinon.createStubInstance(Connection);
const manager = new EntityManager(connection);
const repo = new AnalyticsRepository(manager);
let createQueryBuilderStub;
let selectMock;
const selectQueryBuilder = new SelectQueryBuilder<AnalyticsRepository>(null);
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

beforeEach(() => {
  sandbox = sinon.createSandbox();

  const repocallback = sinon.stub();
  repocallback.withArgs(IndividualEnrollmentRepository).returns(IndividualEnrollmentRepository.prototype);
  repocallback.withArgs(IndividualExclusionRepository).returns(IndividualExclusionRepository.prototype);
  repocallback.withArgs(ExperimentRepository).returns(ExperimentRepository.prototype);
  repocallback.withArgs(GroupExclusionRepository).returns(GroupExclusionRepository.prototype);
  repocallback.returns(AnalyticsRepository.prototype);

  sandbox.stub(ConnectionManager.prototype, 'get').returns({
    getRepository: repocallback,
  } as unknown as Connection);

  selectMock = sandbox.mock(selectQueryBuilder);
});

afterEach(() => {
  sandbox.restore();
});

describe('AnalyticsRepository Testing', () => {
  it('should get enrollment count per group', async () => {
    const individualEnrollmentRepoStub = sandbox
      .stub(manager, 'getCustomRepository')
      .withArgs(IndividualEnrollmentRepository)
      .returns(IndividualEnrollmentRepository.prototype);
    createQueryBuilderStub = sandbox
      .stub(IndividualEnrollmentRepository.prototype, 'createQueryBuilder')
      .returns(selectQueryBuilder);

    selectMock.expects('select').once().returns(selectQueryBuilder);
    selectMock.expects('where').once().returns(selectQueryBuilder);
    selectMock.expects('innerJoin').once().returns(selectQueryBuilder);
    selectMock.expects('groupBy').once().returns(selectQueryBuilder);
    selectMock.expects('execute').once().returns(Promise.resolve(result));

    const res = await repo.getEnrollmentCountPerGroup(experiment.id);

    sinon.assert.calledOnce(individualEnrollmentRepoStub);
    sinon.assert.calledOnce(createQueryBuilderStub);
    selectMock.verify();

    expect(res).toEqual(result);
  });

  it('should throw an error when get enrollment count per group fails', async () => {
    const individualEnrollmentRepoStub = sandbox
      .stub(manager, 'getCustomRepository')
      .withArgs(IndividualEnrollmentRepository)
      .returns(IndividualEnrollmentRepository.prototype);
    createQueryBuilderStub = sandbox
      .stub(IndividualEnrollmentRepository.prototype, 'createQueryBuilder')
      .returns(selectQueryBuilder);

    selectMock.expects('select').once().returns(selectQueryBuilder);
    selectMock.expects('where').once().returns(selectQueryBuilder);
    selectMock.expects('innerJoin').once().returns(selectQueryBuilder);
    selectMock.expects('groupBy').once().returns(selectQueryBuilder);
    selectMock.expects('execute').once().returns(Promise.reject(err));

    expect(async () => {
      await repo.getEnrollmentCountPerGroup(experiment.id);
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(individualEnrollmentRepoStub);
    sinon.assert.calledOnce(createQueryBuilderStub);
    selectMock.verify();
  });

  it('should get enrollment count per decision point for individual assignment', async () => {
    const getCustomRepositoryStub = sandbox.stub(manager, 'getCustomRepository');
    const individualEnrollmentRepoStub = getCustomRepositoryStub
      .withArgs(IndividualEnrollmentRepository)
      .returns(IndividualEnrollmentRepository.prototype);
    const individualExclusionRepoStub = getCustomRepositoryStub
      .withArgs(IndividualExclusionRepository)
      .returns(IndividualExclusionRepository.prototype);
    const experimentRepoStub = getCustomRepositoryStub
      .withArgs(ExperimentRepository)
      .returns(ExperimentRepository.prototype);
    const groupExclusionRepoStub = getCustomRepositoryStub
      .withArgs(GroupExclusionRepository)
      .returns(GroupExclusionRepository.prototype);
    createQueryBuilderStub = sandbox
      .stub(IndividualEnrollmentRepository.prototype, 'createQueryBuilder')
      .returns(selectQueryBuilder);
    const findOneStub = sandbox.stub(ExperimentRepository.prototype, 'findOne').returns(experiment);
    sandbox.stub(IndividualExclusionRepository.prototype, 'createQueryBuilder').returns(selectQueryBuilder);

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

    selectMock.expects('select').exactly(4).returns(selectQueryBuilder);
    selectMock.expects('where').exactly(4).returns(selectQueryBuilder);
    selectMock.expects('groupBy').exactly(2).returns(selectQueryBuilder);
    selectMock.expects('addGroupBy').exactly(3).returns(selectQueryBuilder);
    selectMock.expects('execute').exactly(4).returns(Promise.resolve(userResult));

    const res = await repo.getEnrollmentPerPartitionCondition(experiment.id);

    sinon.assert.calledOnce(individualEnrollmentRepoStub);
    sinon.assert.calledOnce(individualExclusionRepoStub);
    sinon.assert.calledOnce(experimentRepoStub);
    sinon.assert.calledOnce(groupExclusionRepoStub);
    sinon.assert.calledThrice(createQueryBuilderStub);
    sinon.assert.calledOnce(findOneStub);
    selectMock.verify();

    expect(res).toEqual(decisionPointResult);
  });

  it('should get enrollment count per decision point for individual assignment with none enrolled', async () => {
    const getCustomRepositoryStub = sandbox.stub(manager, 'getCustomRepository');
    const individualEnrollmentRepoStub = getCustomRepositoryStub
      .withArgs(IndividualEnrollmentRepository)
      .returns(IndividualEnrollmentRepository.prototype);
    const individualExclusionRepoStub = getCustomRepositoryStub
      .withArgs(IndividualExclusionRepository)
      .returns(IndividualExclusionRepository.prototype);
    const experimentRepoStub = getCustomRepositoryStub
      .withArgs(ExperimentRepository)
      .returns(ExperimentRepository.prototype);
    const groupExclusionRepoStub = getCustomRepositoryStub
      .withArgs(GroupExclusionRepository)
      .returns(GroupExclusionRepository.prototype);
    createQueryBuilderStub = sandbox
      .stub(IndividualEnrollmentRepository.prototype, 'createQueryBuilder')
      .returns(selectQueryBuilder);
    const findOneStub = sandbox.stub(ExperimentRepository.prototype, 'findOne').returns(experiment);
    sandbox.stub(IndividualExclusionRepository.prototype, 'createQueryBuilder').returns(selectQueryBuilder);

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

    selectMock.expects('select').exactly(4).returns(selectQueryBuilder);
    selectMock.expects('where').exactly(4).returns(selectQueryBuilder);
    selectMock.expects('groupBy').exactly(2).returns(selectQueryBuilder);
    selectMock.expects('addGroupBy').exactly(3).returns(selectQueryBuilder);
    selectMock.expects('execute').returns(Promise.resolve([{ count: 0, userCount: 0, groupCount: 0 }]));
    selectMock
      .expects('execute')
      .exactly(3)
      .returns(Promise.resolve([{ count: 0 }]));

    const res = await repo.getEnrollmentPerPartitionCondition(experiment.id);

    sinon.assert.calledOnce(individualEnrollmentRepoStub);
    sinon.assert.calledOnce(individualExclusionRepoStub);
    sinon.assert.calledOnce(experimentRepoStub);
    sinon.assert.calledOnce(groupExclusionRepoStub);
    sinon.assert.calledThrice(createQueryBuilderStub);
    sinon.assert.calledOnce(findOneStub);
    selectMock.verify();

    expect(res).toEqual(decisionPointResult);
  });

  it('should get enrollment count per decision point for group assignment', async () => {
    experiment.assignmentUnit = ASSIGNMENT_UNIT.GROUP;
    const getCustomRepositoryStub = sandbox.stub(manager, 'getCustomRepository');
    const individualEnrollmentRepoStub = getCustomRepositoryStub
      .withArgs(IndividualEnrollmentRepository)
      .returns(IndividualEnrollmentRepository.prototype);
    const individualExclusionRepoStub = getCustomRepositoryStub
      .withArgs(IndividualExclusionRepository)
      .returns(IndividualExclusionRepository.prototype);
    const experimentRepoStub = getCustomRepositoryStub
      .withArgs(ExperimentRepository)
      .returns(ExperimentRepository.prototype);
    const groupExclusionRepoStub = getCustomRepositoryStub
      .withArgs(GroupExclusionRepository)
      .returns(GroupExclusionRepository.prototype);
    createQueryBuilderStub = sandbox
      .stub(IndividualEnrollmentRepository.prototype, 'createQueryBuilder')
      .returns(selectQueryBuilder);
    const findOneStub = sandbox.stub(ExperimentRepository.prototype, 'findOne').returns(experiment);
    sandbox.stub(IndividualExclusionRepository.prototype, 'createQueryBuilder').returns(selectQueryBuilder);
    sandbox.stub(GroupExclusionRepository.prototype, 'createQueryBuilder').returns(selectQueryBuilder);

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

    selectMock.expects('select').exactly(5).returns(selectQueryBuilder);
    selectMock.expects('where').exactly(5).returns(selectQueryBuilder);
    selectMock.expects('innerJoin').exactly(3).returns(selectQueryBuilder);
    selectMock.expects('groupBy').exactly(2).returns(selectQueryBuilder);
    selectMock.expects('addGroupBy').exactly(3).returns(selectQueryBuilder);
    selectMock.expects('execute').exactly(5).returns(Promise.resolve(userResult));

    const res = await repo.getEnrollmentPerPartitionCondition(experiment.id);

    sinon.assert.calledOnce(individualEnrollmentRepoStub);
    sinon.assert.calledOnce(individualExclusionRepoStub);
    sinon.assert.calledOnce(experimentRepoStub);
    sinon.assert.calledOnce(groupExclusionRepoStub);
    sinon.assert.calledThrice(createQueryBuilderStub);
    sinon.assert.calledOnce(findOneStub);
    selectMock.verify();

    expect(res).toEqual(decisionPointResult);
  });

  it('should get enrollment count per decision point for group assignment with none enrolled', async () => {
    experiment.assignmentUnit = ASSIGNMENT_UNIT.GROUP;
    const getCustomRepositoryStub = sandbox.stub(manager, 'getCustomRepository');
    const individualEnrollmentRepoStub = getCustomRepositoryStub
      .withArgs(IndividualEnrollmentRepository)
      .returns(IndividualEnrollmentRepository.prototype);
    const individualExclusionRepoStub = getCustomRepositoryStub
      .withArgs(IndividualExclusionRepository)
      .returns(IndividualExclusionRepository.prototype);
    const experimentRepoStub = getCustomRepositoryStub
      .withArgs(ExperimentRepository)
      .returns(ExperimentRepository.prototype);
    const groupExclusionRepoStub = getCustomRepositoryStub
      .withArgs(GroupExclusionRepository)
      .returns(GroupExclusionRepository.prototype);
    createQueryBuilderStub = sandbox
      .stub(IndividualEnrollmentRepository.prototype, 'createQueryBuilder')
      .returns(selectQueryBuilder);
    const findOneStub = sandbox.stub(ExperimentRepository.prototype, 'findOne').returns(experiment);
    sandbox.stub(IndividualExclusionRepository.prototype, 'createQueryBuilder').returns(selectQueryBuilder);
    sandbox.stub(GroupExclusionRepository.prototype, 'createQueryBuilder').returns(selectQueryBuilder);

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

    selectMock.expects('select').exactly(5).returns(selectQueryBuilder);
    selectMock.expects('where').exactly(5).returns(selectQueryBuilder);
    selectMock.expects('innerJoin').exactly(3).returns(selectQueryBuilder);
    selectMock.expects('groupBy').exactly(2).returns(selectQueryBuilder);
    selectMock.expects('addGroupBy').exactly(3).returns(selectQueryBuilder);
    selectMock.expects('execute').returns(Promise.resolve([{ count: 0, userCount: 0, groupCount: 0 }]));
    selectMock
      .expects('execute')
      .exactly(4)
      .returns(Promise.resolve([{ count: 0 }]));

    const res = await repo.getEnrollmentPerPartitionCondition(experiment.id);

    sinon.assert.calledOnce(individualEnrollmentRepoStub);
    sinon.assert.calledOnce(individualExclusionRepoStub);
    sinon.assert.calledOnce(experimentRepoStub);
    sinon.assert.calledOnce(groupExclusionRepoStub);
    sinon.assert.calledThrice(createQueryBuilderStub);
    sinon.assert.calledOnce(findOneStub);
    selectMock.verify();

    expect(res).toEqual(decisionPointResult);
  });

  it('should get empty enrollments for empty experiments', async () => {
    const res = await repo.getEnrollments([]);

    expect(res).toEqual([]);
  });

  it('should get enrollments for experiments', async () => {
    const getCustomRepositoryStub = sandbox.stub(manager, 'getCustomRepository');
    const individualEnrollmentRepoStub = getCustomRepositoryStub
      .withArgs(IndividualEnrollmentRepository)
      .returns(IndividualEnrollmentRepository.prototype);
    const groupEnrollmentRepoStub = getCustomRepositoryStub
      .withArgs(GroupEnrollmentRepository)
      .returns(GroupEnrollmentRepository.prototype);

    createQueryBuilderStub = sandbox
      .stub(IndividualEnrollmentRepository.prototype, 'createQueryBuilder')
      .returns(selectQueryBuilder);
    sandbox.stub(GroupEnrollmentRepository.prototype, 'createQueryBuilder').returns(selectQueryBuilder);

    const result = {
      groups: 3,
      id: experiment.id,
      users: 4,
    };

    selectMock.expects('select').twice().returns(selectQueryBuilder);
    selectMock.expects('groupBy').twice().returns(selectQueryBuilder);
    selectMock.expects('where').twice().returns(selectQueryBuilder);
    selectMock.expects('andWhere').once().returns(selectQueryBuilder);
    selectMock
      .expects('execute')
      .twice()
      .returns(Promise.resolve([{ id: experiment.id, users: 4, groups: 3 }]));

    const res = await repo.getEnrollments([experiment.id]);

    sinon.assert.calledOnce(individualEnrollmentRepoStub);
    sinon.assert.calledOnce(groupEnrollmentRepoStub);

    expect(res).toEqual([result]);
  });

  it('should get enrollments for experiments with none enrolled', async () => {
    const getCustomRepositoryStub = sandbox.stub(manager, 'getCustomRepository');
    const individualEnrollmentRepoStub = getCustomRepositoryStub
      .withArgs(IndividualEnrollmentRepository)
      .returns(IndividualEnrollmentRepository.prototype);
    const groupEnrollmentRepoStub = getCustomRepositoryStub
      .withArgs(GroupEnrollmentRepository)
      .returns(GroupEnrollmentRepository.prototype);

    createQueryBuilderStub = sandbox
      .stub(IndividualEnrollmentRepository.prototype, 'createQueryBuilder')
      .returns(selectQueryBuilder);
    sandbox.stub(GroupEnrollmentRepository.prototype, 'createQueryBuilder').returns(selectQueryBuilder);

    const result = {
      groups: 0,
      id: experiment.id,
      users: 0,
    };

    selectMock.expects('select').twice().returns(selectQueryBuilder);
    selectMock.expects('groupBy').twice().returns(selectQueryBuilder);
    selectMock.expects('where').twice().returns(selectQueryBuilder);
    selectMock.expects('andWhere').once().returns(selectQueryBuilder);
    selectMock
      .expects('execute')
      .twice()
      .returns(Promise.resolve([{}]));

    const res = await repo.getEnrollments([experiment.id]);

    sinon.assert.calledOnce(individualEnrollmentRepoStub);
    sinon.assert.calledOnce(groupEnrollmentRepoStub);

    expect(res).toEqual([result]);
  });

  it('should get enrollments by date range last seven days', async () => {
    const getCustomRepositoryStub = sandbox.stub(manager, 'getCustomRepository');
    const individualEnrollmentRepoStub = getCustomRepositoryStub
      .withArgs(IndividualEnrollmentRepository)
      .returns(IndividualEnrollmentRepository.prototype);
    const groupEnrollmentRepoStub = getCustomRepositoryStub
      .withArgs(GroupEnrollmentRepository)
      .returns(GroupEnrollmentRepository.prototype);
    const experimentRepoStub = getCustomRepositoryStub
      .withArgs(ExperimentRepository)
      .returns(ExperimentRepository.prototype);

    const findOneStub = sandbox.stub(ExperimentRepository.prototype, 'findOne').returns(experiment);
    createQueryBuilderStub = sandbox
      .stub(IndividualEnrollmentRepository.prototype, 'createQueryBuilder')
      .returns(selectQueryBuilder);
    sandbox.stub(GroupEnrollmentRepository.prototype, 'createQueryBuilder').returns(selectQueryBuilder);

    const result = {
      count: 1,
      conditionId: cond.id,
      partitionId: point.id,
      date_range: DATE_RANGE.LAST_SEVEN_DAYS,
    };

    selectMock.expects('select').twice().returns(selectQueryBuilder);
    selectMock.expects('where').twice().returns(selectQueryBuilder);
    selectMock.expects('andWhere').thrice().returns(selectQueryBuilder);
    selectMock.expects('groupBy').twice().returns(selectQueryBuilder);
    selectMock.expects('addGroupBy').exactly(4).returns(selectQueryBuilder);
    selectMock
      .expects('execute')
      .twice()
      .returns(Promise.resolve([result]));

    const res = await repo.getEnrollmentByDateRange(experiment.id, DATE_RANGE.LAST_SEVEN_DAYS, 3);
    sinon.assert.calledOnce(individualEnrollmentRepoStub);
    sinon.assert.calledOnce(groupEnrollmentRepoStub);
    sinon.assert.calledOnce(experimentRepoStub);
    sinon.assert.calledOnce(findOneStub);

    expect(res).toEqual([[result], [result]]);
  });

  it('should get enrollments by date range last six months', async () => {
    const getCustomRepositoryStub = sandbox.stub(manager, 'getCustomRepository');
    const individualEnrollmentRepoStub = getCustomRepositoryStub
      .withArgs(IndividualEnrollmentRepository)
      .returns(IndividualEnrollmentRepository.prototype);
    const groupEnrollmentRepoStub = getCustomRepositoryStub
      .withArgs(GroupEnrollmentRepository)
      .returns(GroupEnrollmentRepository.prototype);
    const experimentRepoStub = getCustomRepositoryStub
      .withArgs(ExperimentRepository)
      .returns(ExperimentRepository.prototype);

    const findOneStub = sandbox.stub(ExperimentRepository.prototype, 'findOne').returns(experiment);
    createQueryBuilderStub = sandbox
      .stub(IndividualEnrollmentRepository.prototype, 'createQueryBuilder')
      .returns(selectQueryBuilder);
    sandbox.stub(GroupEnrollmentRepository.prototype, 'createQueryBuilder').returns(selectQueryBuilder);

    const result = {
      count: 1,
      conditionId: cond.id,
      partitionId: point.id,
      date_range: DATE_RANGE.LAST_SIX_MONTHS,
    };

    selectMock.expects('select').twice().returns(selectQueryBuilder);
    selectMock.expects('where').twice().returns(selectQueryBuilder);
    selectMock.expects('andWhere').thrice().returns(selectQueryBuilder);
    selectMock.expects('groupBy').twice().returns(selectQueryBuilder);
    selectMock.expects('addGroupBy').exactly(4).returns(selectQueryBuilder);
    selectMock
      .expects('execute')
      .twice()
      .returns(Promise.resolve([result]));

    const res = await repo.getEnrollmentByDateRange(experiment.id, DATE_RANGE.LAST_SIX_MONTHS, 3);
    sinon.assert.calledOnce(individualEnrollmentRepoStub);
    sinon.assert.calledOnce(groupEnrollmentRepoStub);
    sinon.assert.calledOnce(experimentRepoStub);
    sinon.assert.calledOnce(findOneStub);

    expect(res).toEqual([[result], [result]]);
  });

  it('should get enrollments by date range last three months', async () => {
    const getCustomRepositoryStub = sandbox.stub(manager, 'getCustomRepository');
    const individualEnrollmentRepoStub = getCustomRepositoryStub
      .withArgs(IndividualEnrollmentRepository)
      .returns(IndividualEnrollmentRepository.prototype);
    const groupEnrollmentRepoStub = getCustomRepositoryStub
      .withArgs(GroupEnrollmentRepository)
      .returns(GroupEnrollmentRepository.prototype);
    const experimentRepoStub = getCustomRepositoryStub
      .withArgs(ExperimentRepository)
      .returns(ExperimentRepository.prototype);

    const findOneStub = sandbox.stub(ExperimentRepository.prototype, 'findOne').returns(experiment);
    createQueryBuilderStub = sandbox
      .stub(IndividualEnrollmentRepository.prototype, 'createQueryBuilder')
      .returns(selectQueryBuilder);
    sandbox.stub(GroupEnrollmentRepository.prototype, 'createQueryBuilder').returns(selectQueryBuilder);

    const result = {
      count: 1,
      conditionId: cond.id,
      partitionId: point.id,
      date_range: DATE_RANGE.LAST_THREE_MONTHS,
    };

    selectMock.expects('select').twice().returns(selectQueryBuilder);
    selectMock.expects('where').twice().returns(selectQueryBuilder);
    selectMock.expects('andWhere').thrice().returns(selectQueryBuilder);
    selectMock.expects('groupBy').twice().returns(selectQueryBuilder);
    selectMock.expects('addGroupBy').exactly(4).returns(selectQueryBuilder);
    selectMock
      .expects('execute')
      .twice()
      .returns(Promise.resolve([result]));

    const res = await repo.getEnrollmentByDateRange(experiment.id, DATE_RANGE.LAST_THREE_MONTHS, 3);
    sinon.assert.calledOnce(individualEnrollmentRepoStub);
    sinon.assert.calledOnce(groupEnrollmentRepoStub);
    sinon.assert.calledOnce(experimentRepoStub);
    sinon.assert.calledOnce(findOneStub);

    expect(res).toEqual([[result], [result]]);
  });

  it('should get enrollments by date range last twelve months', async () => {
    const getCustomRepositoryStub = sandbox.stub(manager, 'getCustomRepository');
    const individualEnrollmentRepoStub = getCustomRepositoryStub
      .withArgs(IndividualEnrollmentRepository)
      .returns(IndividualEnrollmentRepository.prototype);
    const groupEnrollmentRepoStub = getCustomRepositoryStub
      .withArgs(GroupEnrollmentRepository)
      .returns(GroupEnrollmentRepository.prototype);
    const experimentRepoStub = getCustomRepositoryStub
      .withArgs(ExperimentRepository)
      .returns(ExperimentRepository.prototype);

    const findOneStub = sandbox.stub(ExperimentRepository.prototype, 'findOne').returns(experiment);

    createQueryBuilderStub = sandbox
      .stub(IndividualEnrollmentRepository.prototype, 'createQueryBuilder')
      .returns(selectQueryBuilder);
    sandbox.stub(GroupEnrollmentRepository.prototype, 'createQueryBuilder').returns(selectQueryBuilder);

    const result = {
      count: 1,
      conditionId: cond.id,
      partitionId: point.id,
      date_range: DATE_RANGE.LAST_TWELVE_MONTHS,
    };

    selectMock.expects('select').twice().returns(selectQueryBuilder);
    selectMock.expects('where').twice().returns(selectQueryBuilder);
    selectMock.expects('andWhere').thrice().returns(selectQueryBuilder);
    selectMock.expects('groupBy').twice().returns(selectQueryBuilder);
    selectMock.expects('addGroupBy').exactly(4).returns(selectQueryBuilder);
    selectMock
      .expects('execute')
      .twice()
      .returns(Promise.resolve([result]));

    const res = await repo.getEnrollmentByDateRange(experiment.id, DATE_RANGE.LAST_TWELVE_MONTHS, 3);
    sinon.assert.calledOnce(individualEnrollmentRepoStub);
    sinon.assert.calledOnce(groupEnrollmentRepoStub);
    sinon.assert.calledOnce(experimentRepoStub);
    sinon.assert.calledOnce(findOneStub);

    expect(res).toEqual([[result], [result]]);
  });
});
