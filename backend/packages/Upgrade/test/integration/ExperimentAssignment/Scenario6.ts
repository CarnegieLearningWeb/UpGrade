import { Container } from 'typedi';
import { groupAssignmentWithGroupConsistencyExperimentSwitchBeforeAssignment } from '../mockData/experiment';
import { ExperimentService } from '../../../src/api/services/ExperimentService';
import { EXPERIMENT_STATE } from 'upgrade_types';
import { getAllExperimentCondition, markExperimentPoint, checkDeletedExperiment } from '../utils';
import { UserService } from '../../../src/api/services/UserService';
import { systemUser } from '../mockData/user/index';
import { ExperimentUserService } from '../../../src/api/services/ExperimentUserService';
import { experimentUsers } from '../mockData/experimentUsers/index';
import {
  checkMarkExperimentPointForUser,
  checkExperimentAssignedIsNotDefault,
  checkExperimentAssignedIsNull,
} from '../utils/index';
import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';

export default async function testCase(): Promise<void> {
  const experimentService = Container.get<ExperimentService>(ExperimentService);
  const experimentUserService = Container.get<ExperimentUserService>(ExperimentUserService);
  const userService = Container.get<UserService>(UserService);

  // creating new user
  const user = await userService.upsertUser(systemUser as any, new UpgradeLogger());

  // experiment object
  const experimentObject = groupAssignmentWithGroupConsistencyExperimentSwitchBeforeAssignment;
  // getOriginalUserDoc
  let experimentUserDoc = await experimentUserService.getOriginalUserDoc(experimentUsers[0].id, new UpgradeLogger());
  // change user group
  await experimentUserService.updateGroupMembership(
    experimentUsers[0].id,
    {
      teacher: ['2'],
      class: ['2'],
    },
    { logger: new UpgradeLogger(), userDoc: experimentUserDoc }
  );
  experimentUserDoc = await experimentUserService.getOriginalUserDoc(experimentUsers[0].id, new UpgradeLogger());
  await experimentUserService.updateWorkingGroup(
    experimentUsers[0].id,
    {
      teacher: '2',
      class: '2',
    },
    { logger: new UpgradeLogger(), userDoc: experimentUserDoc }
  );
  experimentUserDoc = await experimentUserService.getOriginalUserDoc(experimentUsers[0].id, new UpgradeLogger());
  let experimentUser = await experimentUserService.findOne(experimentUserDoc.id, new UpgradeLogger());
  let objectToCheck = {
    ...experimentUsers[0],
    group: {
      teacher: ['2'],
      class: ['2'],
    },
    workingGroup: {
      teacher: '2',
      class: '2',
    },
  };
  delete objectToCheck.versionNumber;
  delete objectToCheck.createdAt;
  delete objectToCheck.updatedAt;
  delete experimentUser.versionNumber;
  delete experimentUser.createdAt;
  delete experimentUser.updatedAt;
  expect(experimentUser).toEqual(objectToCheck);

  const experimentName = experimentObject.partitions[0].target;
  const experimentPoint = experimentObject.partitions[0].site;
  const condition = experimentObject.conditions[0].conditionCode;

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

  // get all experiment condition for user 1
  let experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[0].id, new UpgradeLogger());
  expect(experimentConditionAssignments).toHaveLength(0);
  // mark experiment point
  let markedExperimentPoint = await markExperimentPoint(
    experimentUsers[0].id,
    experimentName,
    experimentPoint,
    condition,
    new UpgradeLogger()
  );
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[0].id, experimentName, experimentPoint);
  // change user group
  // experimentUsers[0].group['teacher'] = 1;
  await experimentUserService.updateGroupMembership(
    experimentUsers[0].id,
    {
      teacher: ['1'],
      class: ['1'],
    },
    { logger: new UpgradeLogger(), userDoc: experimentUserDoc }
  );
  experimentUserDoc = await experimentUserService.getOriginalUserDoc(experimentUsers[0].id, new UpgradeLogger());
  await experimentUserService.updateWorkingGroup(
    experimentUsers[0].id,
    {
      teacher: '1',
      class: '1',
    },
    { logger: new UpgradeLogger(), userDoc: experimentUserDoc }
  );
  experimentUserDoc = await experimentUserService.getOriginalUserDoc(experimentUsers[0].id, new UpgradeLogger());
  experimentUser = await experimentUserService.findOne(experimentUserDoc.id, new UpgradeLogger());
  objectToCheck = {
    ...experimentUsers[0],
    group: {
      teacher: ['1'],
      class: ['1'],
    },
    workingGroup: {
      teacher: '1',
      class: '1',
    },
  };
  delete objectToCheck.versionNumber;
  delete objectToCheck.createdAt;
  delete objectToCheck.updatedAt;
  delete experimentUser.versionNumber;
  delete experimentUser.createdAt;
  delete experimentUser.updatedAt;
  expect(experimentUser).toEqual(objectToCheck);
  // change experiment status to scheduled
  let experimentId = experiments[0].id;
  const date = new Date();
  await experimentService.updateState(experimentId, EXPERIMENT_STATE.SCHEDULED, user, new UpgradeLogger(), date);

  // fetch experiment
  experiments = await experimentService.find(new UpgradeLogger());
  expect(experiments).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        name: experimentObject.name,
        state: EXPERIMENT_STATE.SCHEDULED,
        postExperimentRule: experimentObject.postExperimentRule,
        assignmentUnit: experimentObject.assignmentUnit,
        consistencyRule: experimentObject.consistencyRule,
      }),
    ])
  );

  // get all experiment condition for user 1
  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[0].id, new UpgradeLogger());
  expect(experimentConditionAssignments).toHaveLength(0);

  // mark experiment point
  markedExperimentPoint = await markExperimentPoint(
    experimentUsers[0].id,
    experimentName,
    experimentPoint,
    condition,
    new UpgradeLogger()
  );
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[0].id, experimentName, experimentPoint);

  // change experiment status to Enrolling
  experimentId = experiments[0].id;
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
  // get all experiment condition for user 2
  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[1].id, new UpgradeLogger());
  checkExperimentAssignedIsNull(experimentConditionAssignments, experimentName, experimentPoint);

  // mark experiment point for user 2
  markedExperimentPoint = await markExperimentPoint(
    experimentUsers[1].id,
    experimentName,
    experimentPoint,
    condition,
    new UpgradeLogger()
  );
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[1].id, experimentName, experimentPoint);

  // get all experiment condition for user 1
  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[0].id, new UpgradeLogger());
  checkExperimentAssignedIsNull(experimentConditionAssignments, experimentName, experimentPoint);

  // mark experiment point for user 1
  markedExperimentPoint = await markExperimentPoint(
    experimentUsers[0].id,
    experimentName,
    experimentPoint,
    condition,
    new UpgradeLogger()
  );
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[0].id, experimentName, experimentPoint);

  // get all experiment condition for user 3
  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[2].id, new UpgradeLogger());
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName, experimentPoint);

  // mark experiment point for user 3
  markedExperimentPoint = await markExperimentPoint(
    experimentUsers[2].id,
    experimentName,
    experimentPoint,
    condition,
    new UpgradeLogger()
  );
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

  // get all experiment condition for user 1
  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[0].id, new UpgradeLogger());
  checkExperimentAssignedIsNull(experimentConditionAssignments, experimentName, experimentPoint);

  // mark experiment point for user 1
  markedExperimentPoint = await markExperimentPoint(
    experimentUsers[0].id,
    experimentName,
    experimentPoint,
    condition,
    new UpgradeLogger()
  );
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[0].id, experimentName, experimentPoint);

  // get all experiment condition for user 2
  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[1].id, new UpgradeLogger());
  checkExperimentAssignedIsNull(experimentConditionAssignments, experimentName, experimentPoint);

  // mark experiment point for user 2
  markedExperimentPoint = await markExperimentPoint(
    experimentUsers[1].id,
    experimentName,
    experimentPoint,
    condition,
    new UpgradeLogger()
  );
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[1].id, experimentName, experimentPoint);

  // get all experiment condition for user 3
  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[2].id, new UpgradeLogger());
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName, experimentPoint);

  // mark experiment point for user 3
  markedExperimentPoint = await markExperimentPoint(
    experimentUsers[2].id,
    experimentName,
    experimentPoint,
    condition,
    new UpgradeLogger()
  );
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[2].id, experimentName, experimentPoint);

  // get all experiment condition for user 4
  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[3].id, new UpgradeLogger());
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName, experimentPoint);

  // mark experiment point for user 4
  markedExperimentPoint = await markExperimentPoint(
    experimentUsers[3].id,
    experimentName,
    experimentPoint,
    condition,
    new UpgradeLogger()
  );
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[3].id, experimentName, experimentPoint);

  await checkDeletedExperiment(experimentId, user);
}
