import { Container } from 'typedi';
import { revertToCondition } from '../mockData/experiment';
import { systemUser } from '../mockData/user';
import { ExperimentService } from '../../../src/api/services/ExperimentService';
import { EXPERIMENT_STATE } from 'upgrade_types';
import { Logger as WinstonLogger } from '../../../src/lib/logger';
import { getAllExperimentCondition, markExperimentPoint } from '../utils';
import { checkMarkExperimentPointForUser, checkExperimentAssignedIsNotDefault } from '../utils/index';
import { UserService } from '../../../src/api/services/UserService';
import { experimentUsers } from '../mockData/experimentUsers/index';

export default async function testCase(): Promise<void> {
  const logger = new WinstonLogger(__filename);
  const experimentService = Container.get<ExperimentService>(ExperimentService);
  const userService = Container.get<UserService>(UserService);

  // creating new user
  const user = await userService.create(systemUser as any);

  // experiment object
  const experimentObject = revertToCondition;

  // create experiment
  await experimentService.create(experimentObject as any, user);
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

  const experimentName = experimentObject.partitions[0].expId;
  const experimentPoint = experimentObject.partitions[0].expPoint;

  // get all experiment condition for user 1
  let experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[0].id);
  expect(experimentConditionAssignments).toHaveLength(0);

  // mark experiment point
  let markedExperimentPoint = await markExperimentPoint(experimentUsers[0].id, experimentName, experimentPoint);
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[0].id, experimentName, experimentPoint);

  // change experiment status to Enrolling
  const experimentId = experiments[0].id;
  await experimentService.updateState(experimentId, EXPERIMENT_STATE.ENROLLING, user);

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

  //   get all experiment condition for user 2
  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[1].id);
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName, experimentPoint);

  // mark experiment point for user 2
  markedExperimentPoint = await markExperimentPoint(experimentUsers[1].id, experimentName, experimentPoint);
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[1].id, experimentName, experimentPoint);

  // get all experiment condition for user 1
  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[0].id);
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName, experimentPoint);

  // mark experiment point for user 1
  markedExperimentPoint = await markExperimentPoint(experimentUsers[0].id, experimentName, experimentPoint);
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[0].id, experimentName, experimentPoint);

  // get all experiment condition for user 3
  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[2].id);
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName, experimentPoint);

  // mark experiment point for user 1
  markedExperimentPoint = await markExperimentPoint(experimentUsers[2].id, experimentName, experimentPoint);
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[2].id, experimentName, experimentPoint);

  // change experiment status to complete
  await experimentService.updateState(experimentId, EXPERIMENT_STATE.ENROLLMENT_COMPLETE, user);

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
  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[0].id);
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName, experimentPoint);
  checkConditionAssigned(experimentConditionAssignments, experimentName, experimentPoint, experimentObject.revertTo);

  // mark experiment point for user 1
  markedExperimentPoint = await markExperimentPoint(experimentUsers[0].id, experimentName, experimentPoint);
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[0].id, experimentName, experimentPoint);

  // get all experiment condition for user 2
  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[1].id);
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName, experimentPoint);
  checkConditionAssigned(experimentConditionAssignments, experimentName, experimentPoint, experimentObject.revertTo);

  // mark experiment point for user 2
  markedExperimentPoint = await markExperimentPoint(experimentUsers[1].id, experimentName, experimentPoint);
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[1].id, experimentName, experimentPoint);

  // get all experiment condition for user 3
  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[2].id);
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName, experimentPoint);
  checkConditionAssigned(experimentConditionAssignments, experimentName, experimentPoint, experimentObject.revertTo);

  // mark experiment point for user 3
  markedExperimentPoint = await markExperimentPoint(experimentUsers[2].id, experimentName, experimentPoint);
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[2].id, experimentName, experimentPoint);

  // get all experiment condition for user 4
  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[3].id);
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName, experimentPoint);
  checkConditionAssigned(experimentConditionAssignments, experimentName, experimentPoint, experimentObject.revertTo);

  // mark experiment point for user 4
  markedExperimentPoint = await markExperimentPoint(experimentUsers[3].id, experimentName, experimentPoint);
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[3].id, experimentName, experimentPoint);
}

function checkConditionAssigned(
  experimentConditionAssignments: any,
  experimentName: string,
  experimentPoint: string,
  conditionAssigned: string
): void {
  expect(experimentConditionAssignments).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        expId: experimentName,
        expPoint: experimentPoint,
        assignedCondition: expect.objectContaining({ id: conditionAssigned }),
      }),
    ])
  );
}
