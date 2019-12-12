import { Container } from 'typedi';
import { Connection } from 'typeorm';
import { individualAssignmentExperimentConsistencyRuleExperiemnt } from '../mockData/experiment';
import { multipleUsers } from '../mockData/users';
import { ExperimentService } from '../../../src/api/services/ExperimentService';
import { closeDatabase, createDatabaseConnection, synchronizeDatabase } from '../../utils/database';
import { configureLogger } from '../../utils/logger';
import { UserService } from '../../../src/api/services/UserService';
import { ExperimentAssignmentService } from '../../../src/api/services/ExperimentAssignmentService';
import { EXPERIMENT_STATE } from 'ees_types';
import { CheckService } from '../../../src/api/services/CheckService';
import { User } from '../../../src/api/models/User';
import { MonitoredExperimentPoint } from '../../../src/api/models/MonitoredExperimentPoint';
import { Logger as WinstonLogger } from '../../../src/lib/logger';

describe('Experiment Scenario', () => {
  // -------------------------------------------------------------------------
  // Setup up
  // -------------------------------------------------------------------------

  let connection: Connection;
  beforeAll(async () => {
    configureLogger();
    connection = await createDatabaseConnection();
  });

  beforeEach(async () => {
    await synchronizeDatabase(connection);
    // create users over here
    const userService = Container.get<UserService>(UserService);
    await userService.create(multipleUsers as any);

    // get all user here
    const userList = await userService.find();
    expect(userList.length).toBe(multipleUsers.length);
    multipleUsers.map(user => {
      expect(userList).toContainEqual(user);
    });
  });

  // -------------------------------------------------------------------------
  // Tear down
  // -------------------------------------------------------------------------

  afterAll(() => closeDatabase(connection));

  // -------------------------------------------------------------------------
  // Test cases
  // -------------------------------------------------------------------------

  test('Scenario 2 - Individual Assignment with Experiment consistency rule', async done => {
    const logger = new WinstonLogger(__filename);
    const experimentService = Container.get<ExperimentService>(ExperimentService);
    const experimentAssignmentService = Container.get<ExperimentAssignmentService>(ExperimentAssignmentService);
    // const checkService = Container.get<CheckService>(CheckService);

    // experiment object
    const experimentObject = individualAssignmentExperimentConsistencyRuleExperiemnt;

    // create experiment
    await experimentService.create(experimentObject as any);
    let experiments = await experimentService.find();
    expect(experiments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: experimentObject.name,
          state: experimentObject.state,
          postExperimentRule: experimentObject.postExperimentRule,
          assignmentUnit: experimentObject.assignmentUnit,
          consistencyRule: experimentObject.consistencyRule,
        }),
      ])
    );

    // get all experiment condition for user 1
    let experimentConditionAssignments = await getAllExperimentCondition(multipleUsers[0]);
    expect(experimentConditionAssignments).toHaveLength(0);

    // mark experiment point
    let markedExperimentPoint = await markExperimentPoint(multipleUsers[0]);
    checkMarkExperimentPointForUser(markedExperimentPoint, multipleUsers[0].id);

    // change experiment status to Enrolling
    const experimentId = experiments[0].id;
    await experimentAssignmentService.updateState(experimentId, EXPERIMENT_STATE.ENROLLING);

    // fetch experiment
    experiments = await experimentService.find();
    expect(experiments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: experimentObject.name,
          state: EXPERIMENT_STATE.ENROLLING,
          postExperimentRule: experimentObject.postExperimentRule,
          assignmentUnit: experimentObject.assignmentUnit,
          consistencyRule: experimentObject.consistencyRule,
        }),
      ])
    );

    // get all experiment condition for user 2
    experimentConditionAssignments = await getAllExperimentCondition(multipleUsers[1]);
    checkExperimentAssignedIsNotDefault(experimentConditionAssignments);

    // mark experiment point for user 2
    markedExperimentPoint = await markExperimentPoint(multipleUsers[1]);
    checkMarkExperimentPointForUser(markedExperimentPoint, multipleUsers[1].id);

    // get all experiment condition for user 1
    experimentConditionAssignments = await getAllExperimentCondition(multipleUsers[0]);
    checkExperimentAssignedIsNotDefault(experimentConditionAssignments);

    // mark experiment point for user 1
    markedExperimentPoint = await markExperimentPoint(multipleUsers[0]);
    checkMarkExperimentPointForUser(markedExperimentPoint, multipleUsers[0].id);

    // get all experiment condition for user 3
    experimentConditionAssignments = await getAllExperimentCondition(multipleUsers[2]);
    checkExperimentAssignedIsNotDefault(experimentConditionAssignments);

    // mark experiment point for user 1
    markedExperimentPoint = await markExperimentPoint(multipleUsers[2]);
    checkMarkExperimentPointForUser(markedExperimentPoint, multipleUsers[2].id);

    // change experiment status to complete
    await experimentAssignmentService.updateState(experimentId, EXPERIMENT_STATE.ENROLLMENT_COMPLETE);

    // fetch experiment
    experiments = await experimentService.find();
    expect(experiments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: experimentObject.name,
          state: EXPERIMENT_STATE.ENROLLMENT_COMPLETE,
          postExperimentRule: experimentObject.postExperimentRule,
          assignmentUnit: experimentObject.assignmentUnit,
          consistencyRule: experimentObject.consistencyRule,
        }),
      ])
    );

    // get all experiment condition for user 1
    experimentConditionAssignments = await getAllExperimentCondition(multipleUsers[0]);
    checkExperimentAssignedIsDefault(experimentConditionAssignments);

    // mark experiment point for user 1
    markedExperimentPoint = await markExperimentPoint(multipleUsers[0]);
    checkMarkExperimentPointForUser(markedExperimentPoint, multipleUsers[0].id);

    // get all experiment condition for user 2
    experimentConditionAssignments = await getAllExperimentCondition(multipleUsers[1]);
    checkExperimentAssignedIsDefault(experimentConditionAssignments);

    // mark experiment point for user 2
    markedExperimentPoint = await markExperimentPoint(multipleUsers[1]);
    checkMarkExperimentPointForUser(markedExperimentPoint, multipleUsers[1].id);

    // get all experiment condition for user 3
    experimentConditionAssignments = await getAllExperimentCondition(multipleUsers[2]);
    checkExperimentAssignedIsDefault(experimentConditionAssignments);

    // mark experiment point for user 3
    markedExperimentPoint = await markExperimentPoint(multipleUsers[2]);
    checkMarkExperimentPointForUser(markedExperimentPoint, multipleUsers[2].id);

    // get all experiment condition for user 4
    experimentConditionAssignments = await getAllExperimentCondition(multipleUsers[3]);
    checkExperimentAssignedIsDefault(experimentConditionAssignments);

    // mark experiment point for user 4
    markedExperimentPoint = await markExperimentPoint(multipleUsers[3]);
    checkMarkExperimentPointForUser(markedExperimentPoint, multipleUsers[3].id);

    done();
  });
});

async function getAllExperimentCondition(user: Partial<User>): Promise<any> {
  const experimentAssignmentService = Container.get<ExperimentAssignmentService>(ExperimentAssignmentService);
  // getAllExperimentCondition and MarkExperimentPoint before experiment creation
  const { id, group } = user;

  // getAllExperimentConditions
  return experimentAssignmentService.getAllExperimentConditions(id, group);
}

async function markExperimentPoint(user: Partial<User>): Promise<MonitoredExperimentPoint[]> {
  const experimentAssignmentService = Container.get<ExperimentAssignmentService>(ExperimentAssignmentService);
  const checkService = Container.get<CheckService>(CheckService);

  const { id, group } = user;
  // mark experiment point
  await experimentAssignmentService.markExperimentPoint('W2', 'CurriculumSequence', id, group);
  return checkService.getAllMarkedExperimentPoints();
}

function checkMarkExperimentPointForUser(markedExperimentPoint: MonitoredExperimentPoint[], userId: string): void {
  expect(markedExperimentPoint).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        experimentId: 'W2',
        experimentPoint: 'CurriculumSequence',
        userId,
      }),
    ])
  );
}

function checkExperimentAssignedIsDefault(experimentConditionAssignments: any): void {
  expect(experimentConditionAssignments).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: 'W2',
        point: 'CurriculumSequence',
        assignedCondition: 'default',
      }),
    ])
  );
}

function checkExperimentAssignedIsNotDefault(experimentConditionAssignments: any): void {
  expect(experimentConditionAssignments).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: 'W2',
        point: 'CurriculumSequence',
      }),
      expect.not.objectContaining({
        id: 'W2',
        point: 'CurriculumSequence',
        assignedCondition: 'default',
      }),
    ])
  );
}
