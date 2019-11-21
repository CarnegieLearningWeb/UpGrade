import { Container } from 'typedi';
import { Connection } from 'typeorm';
import { inidividualAssignmentExperiment } from '../mockData/experiment';
import { multipleUsers } from '../mockData/users';
import { ExperimentService } from '../../../src/api/services/ExperimentService';
import {
  closeDatabase,
  createDatabaseConnection,
  synchronizeDatabase,
} from '../../utils/database';
import { configureLogger } from '../../utils/logger';
import { UserService } from '../../../src/api/services/UserService';
import { ExperimentAssignmentService } from '../../../src/api/services/ExperimentAssignmentService';
import { EXPERIMENT_STATE } from '../../../src/api/models/Experiment';
import { CheckService } from '../../../src/api/services/CheckService';
import { User } from '../../../src/api/models/User';
import { MonitoredExperimentPoint } from '../../../src/api/models/MonitoredExperimentPoint';
import { Logger as WinstonLogger } from '../../../src/lib/logger';

describe('Experiment Scenerio', () => {
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

  test('Scenario 1', async done => {
    const logger = new WinstonLogger(__filename);
    const experimentService = Container.get<ExperimentService>(
      ExperimentService
    );
    const experimentAssignmentService = Container.get<
      ExperimentAssignmentService
    >(ExperimentAssignmentService);
    // const checkService = Container.get<CheckService>(CheckService);

    // create experiemnt
    await experimentService.create(inidividualAssignmentExperiment as any);
    let experiemnts = await experimentService.find();
    expect(experiemnts[0].name).toBe(inidividualAssignmentExperiment.name);
    expect(experiemnts[0].state).toBe(inidividualAssignmentExperiment.state);
    expect(experiemnts[0].postExperimentRule).toBe(
      inidividualAssignmentExperiment.postExperimentRule
    );
    expect(experiemnts[0].assignmentUnit).toBe(
      inidividualAssignmentExperiment.assignmentUnit
    );
    expect(experiemnts[0].consistencyRule).toBe(
      inidividualAssignmentExperiment.consistencyRule
    );

    // get all experiment condition for user 1
    let experimentConditionAssignments = await getAllExperimentCondition(
      multipleUsers[0]
    );
    expect(experimentConditionAssignments).toHaveLength(0);

    // mark experiment point
    let markedExperimentPoint = await markExperimentPoint(multipleUsers[0]);
    expect(markedExperimentPoint).toContainEqual({
      experimentId: 'W2',
      experimentPoint: 'CurriculumSequence',
      userId: multipleUsers[0].id,
    });

    // change experiemnt status to Enrolling
    const experimentId = experiemnts[0].id;
    await experimentAssignmentService.updateState(
      experimentId,
      EXPERIMENT_STATE.ENROLLING
    );

    // fetch experiment
    experiemnts = await experimentService.find();
    expect(experiemnts[0].state).toBe(EXPERIMENT_STATE.ENROLLING);

    // get all experiment condition for user 2
    experimentConditionAssignments = await getAllExperimentCondition(
      multipleUsers[1]
    );
    let experimentAssignment = experimentConditionAssignments.find(
      assignment => {
        return (
          assignment.id === 'W2' && assignment.point === 'CurriculumSequence'
        );
      }
    );
    expect(experimentAssignment.assignedCondition.conditionCode).not.toEqual(
      'default'
    );

    // mark experiment point for user 2
    markedExperimentPoint = await markExperimentPoint(multipleUsers[1]);
    expect(markedExperimentPoint).toContainEqual({
      experimentId: 'W2',
      experimentPoint: 'CurriculumSequence',
      userId: multipleUsers[1].id,
    });

    // get all experiment condition for user 1
    experimentConditionAssignments = await getAllExperimentCondition(
      multipleUsers[0]
    );
    experimentAssignment = experimentConditionAssignments.find(assignment => {
      return (
        assignment.id === 'W2' && assignment.point === 'CurriculumSequence'
      );
    });
    expect(experimentAssignment.assignedCondition.conditionCode).toEqual(
      'default'
    );

    // // mark experiment point for user 1
    markedExperimentPoint = await markExperimentPoint(multipleUsers[0]);
    expect(markedExperimentPoint).toContainEqual({
      experimentId: 'W2',
      experimentPoint: 'CurriculumSequence',
      userId: multipleUsers[0].id,
    });

    // get all experiment condition for user 3
    experimentConditionAssignments = await getAllExperimentCondition(
      multipleUsers[2]
    );
    experimentAssignment = experimentConditionAssignments.find(assignment => {
      return (
        assignment.id === 'W2' && assignment.point === 'CurriculumSequence'
      );
    });
    expect(experimentAssignment.assignedCondition.conditionCode).not.toEqual(
      'default'
    );

    // mark experiment point for user 1
    markedExperimentPoint = await markExperimentPoint(multipleUsers[2]);
    expect(markedExperimentPoint).toContainEqual({
      experimentId: 'W2',
      experimentPoint: 'CurriculumSequence',
      userId: multipleUsers[2].id,
    });

    await experimentAssignmentService.updateState(
      experimentId,
      EXPERIMENT_STATE.ENROLLMENT_COMPLETE
    );

    // fetch experiment
    experiemnts = await experimentService.find();
    expect(experiemnts[0].state).toBe(EXPERIMENT_STATE.ENROLLMENT_COMPLETE);

    // get all experiment condition for user 1
    experimentConditionAssignments = await getAllExperimentCondition(
      multipleUsers[0]
    );
    experimentAssignment = experimentConditionAssignments.find(assignment => {
      return (
        assignment.id === 'W2' && assignment.point === 'CurriculumSequence'
      );
    });
    expect(experimentAssignment.assignedCondition.conditionCode).toEqual(
      'default'
    );

    // // mark experiment point for user 1
    markedExperimentPoint = await markExperimentPoint(multipleUsers[0]);
    expect(markedExperimentPoint).toContainEqual({
      experimentId: 'W2',
      experimentPoint: 'CurriculumSequence',
      userId: multipleUsers[0].id,
    });

    // get all experiment condition for user 2
    experimentConditionAssignments = await getAllExperimentCondition(
      multipleUsers[1]
    );
    experimentAssignment = experimentConditionAssignments.find(assignment => {
      return (
        assignment.id === 'W2' && assignment.point === 'CurriculumSequence'
      );
    });
    expect(experimentAssignment.assignedCondition.conditionCode).not.toEqual(
      'default'
    );

    // // mark experiment point for user 2
    markedExperimentPoint = await markExperimentPoint(multipleUsers[1]);
    expect(markedExperimentPoint).toContainEqual({
      experimentId: 'W2',
      experimentPoint: 'CurriculumSequence',
      userId: multipleUsers[1].id,
    });

    // get all experiment condition for user 3
    experimentConditionAssignments = await getAllExperimentCondition(
      multipleUsers[2]
    );
    experimentAssignment = experimentConditionAssignments.find(assignment => {
      return (
        assignment.id === 'W2' && assignment.point === 'CurriculumSequence'
      );
    });
    expect(experimentAssignment.assignedCondition.conditionCode).not.toEqual(
      'default'
    );

    // // mark experiment point for user 3
    markedExperimentPoint = await markExperimentPoint(multipleUsers[2]);
    expect(markedExperimentPoint).toContainEqual({
      experimentId: 'W2',
      experimentPoint: 'CurriculumSequence',
      userId: multipleUsers[2].id,
    });

    // get all experiment condition for user 4
    experimentConditionAssignments = await getAllExperimentCondition(
      multipleUsers[3]
    );
    experimentAssignment = experimentConditionAssignments.find(assignment => {
      return (
        assignment.id === 'W2' && assignment.point === 'CurriculumSequence'
      );
    });
    expect(experimentAssignment.assignedCondition.conditionCode).toEqual(
      'default'
    );

    // // mark experiment point for user 4
    markedExperimentPoint = await markExperimentPoint(multipleUsers[3]);
    expect(markedExperimentPoint).toContainEqual({
      experimentId: 'W2',
      experimentPoint: 'CurriculumSequence',
      userId: multipleUsers[3].id,
    });

    done();
  });
});

async function getAllExperimentCondition(user: User): Promise<any> {
  const experimentAssignmentService = Container.get<
    ExperimentAssignmentService
  >(ExperimentAssignmentService);
  // getAllExperimentCondition and MarkExperimentPoint before experiment creation
  const { id, group } = user;

  // getAllExperimentConditions
  return experimentAssignmentService.getAllExperimentConditions(id, group);
}

async function markExperimentPoint(
  user: User
): Promise<MonitoredExperimentPoint[]> {
  const experimentAssignmentService = Container.get<
    ExperimentAssignmentService
  >(ExperimentAssignmentService);
  const checkService = Container.get<CheckService>(CheckService);

  const { id, group } = user;
  // mark experiment point
  await experimentAssignmentService.markExperimentPoint(
    'W2',
    'CurriculumSequence',
    id,
    group
  );
  return checkService.getAllMarkedExperimentPoints();
}
