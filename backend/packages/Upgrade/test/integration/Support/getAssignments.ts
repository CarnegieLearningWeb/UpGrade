import { Container } from 'typedi';
import { ExperimentService } from '../../../src/api/services/ExperimentService';
import { UserService } from '../../../src/api/services/UserService';
import { systemUser } from '../mockData/user/index';
import { experimentUsers } from '../mockData/experimentUsers/index';
import { individualAssignmentExperiment } from '../mockData/experiment/index';
import { getAllExperimentCondition, getUserAssignments, markExperimentPoint, checkDeletedExperiment } from '../utils';
import {
  checkMarkExperimentPointForUser,
  checkExperimentAssignedIsNotDefault,
  checkExperimentAssignedIsNull,
} from '../utils/index';
import { EXPERIMENT_STATE } from 'upgrade_types';
import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';

export default async function testCase(): Promise<void> {
  const experimentService = Container.get<ExperimentService>(ExperimentService);
  const userService = Container.get<UserService>(UserService);

  // creating new user
  const user = await userService.upsertUser(systemUser as any, new UpgradeLogger());

  // experiment object
  const experimentObject = individualAssignmentExperiment;

  // create experiment
  await experimentService.create(experimentObject as any, user, new UpgradeLogger());
  let experiments = await experimentService.find(new UpgradeLogger());
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
  const condition = experimentObject.conditions[0].conditionCode;

  // get all experiment condition for user 1
  let experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[0].id, new UpgradeLogger());
  expect(experimentConditionAssignments).toHaveLength(0);

  let userAssignments = await getUserAssignments(experimentUsers[0].id);
  expect(userAssignments).toHaveLength(0);

  // mark experiment point
  let markedExperimentPoint = await markExperimentPoint(experimentUsers[0].id, experimentName, experimentPoint, condition, new UpgradeLogger());
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[0].id, experimentName, experimentPoint);

  // change experiment status to Enrolling
  const experimentId = experiments[0].id;
  await experimentService.updateState(experimentId, EXPERIMENT_STATE.ENROLLING, user, new UpgradeLogger());

  // fetch experiment
  experiments = await experimentService.find(new UpgradeLogger());
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

  userAssignments = await getUserAssignments(experimentUsers[1].id);
  checkExperimentAssignedIsNull(userAssignments, experimentName, experimentPoint);

  // get all experiment condition for user 2
  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[1].id, new UpgradeLogger());
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName, experimentPoint);

  // mark experiment point for user 2
  markedExperimentPoint = await markExperimentPoint(experimentUsers[1].id, experimentName, experimentPoint, condition, new UpgradeLogger());
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[1].id, experimentName, experimentPoint);

  // get all experiment condition for user 1
  userAssignments = await getUserAssignments(experimentUsers[0].id);
  checkExperimentAssignedIsNull(userAssignments, experimentName, experimentPoint);

  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[0].id, new UpgradeLogger());
  checkExperimentAssignedIsNull(experimentConditionAssignments, experimentName, experimentPoint);

  // mark experiment point for user 1
  markedExperimentPoint = await markExperimentPoint(experimentUsers[0].id, experimentName, experimentPoint, condition, new UpgradeLogger());
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[0].id, experimentName, experimentPoint);

  // get all experiment condition for user 3
  userAssignments = await getUserAssignments(experimentUsers[2].id);
  checkExperimentAssignedIsNull(userAssignments, experimentName, experimentPoint);

  // get all experiment condition for user 3
  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[2].id, new UpgradeLogger());
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName, experimentPoint);

  userAssignments = await getUserAssignments(experimentUsers[2].id);
  checkExperimentAssignedIsNotDefault(userAssignments, experimentName, experimentPoint);

  // mark experiment point for user 1
  markedExperimentPoint = await markExperimentPoint(experimentUsers[2].id, experimentName, experimentPoint, condition, new UpgradeLogger());
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[2].id, experimentName, experimentPoint);

  // change experiment status to complete
  await experimentService.updateState(experimentId, EXPERIMENT_STATE.ENROLLMENT_COMPLETE, user, new UpgradeLogger());

  // fetch experiment
  experiments = await experimentService.find(new UpgradeLogger());
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

  // get all experiment condition for user 3
  userAssignments = await getUserAssignments(experimentUsers[0].id);
  checkExperimentAssignedIsNull(userAssignments, experimentName, experimentPoint);

  // get all experiment condition for user 1
  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[0].id, new UpgradeLogger());
  checkExperimentAssignedIsNull(experimentConditionAssignments, experimentName, experimentPoint);

  // mark experiment point for user 1
  markedExperimentPoint = await markExperimentPoint(experimentUsers[0].id, experimentName, experimentPoint, condition, new UpgradeLogger());
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[0].id, experimentName, experimentPoint);

  // get all experiment condition for user 2
  userAssignments = await getUserAssignments(experimentUsers[1].id);
  checkExperimentAssignedIsNotDefault(userAssignments, experimentName, experimentPoint);

  // get all experiment condition for user 2
  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[1].id, new UpgradeLogger());
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName, experimentPoint);

  // mark experiment point for user 2
  markedExperimentPoint = await markExperimentPoint(experimentUsers[1].id, experimentName, experimentPoint, condition, new UpgradeLogger());
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[1].id, experimentName, experimentPoint);

  // get all experiment condition for user 3
  userAssignments = await getUserAssignments(experimentUsers[2].id);
  checkExperimentAssignedIsNotDefault(userAssignments, experimentName, experimentPoint);

  // get all experiment condition for user 3
  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[2].id, new UpgradeLogger());
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName, experimentPoint);

  // mark experiment point for user 3
  markedExperimentPoint = await markExperimentPoint(experimentUsers[2].id, experimentName, experimentPoint, condition, new UpgradeLogger());
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[2].id, experimentName, experimentPoint);

  // get all experiment condition for user 2
  userAssignments = await getUserAssignments(experimentUsers[3].id);
  checkExperimentAssignedIsNull(userAssignments, experimentName, experimentPoint);

  // get all experiment condition for user 4
  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[3].id, new UpgradeLogger());
  checkExperimentAssignedIsNull(experimentConditionAssignments, experimentName, experimentPoint);

  // mark experiment point for user 4
  markedExperimentPoint = await markExperimentPoint(experimentUsers[3].id, experimentName, experimentPoint, condition, new UpgradeLogger());
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[3].id, experimentName, experimentPoint);

  await checkDeletedExperiment(experimentId, user);
}