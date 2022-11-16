import { Container } from 'typedi';
import { groupAssignmentWithIndividualConsistencyExperimentSwitchAfterAssignment } from '../mockData/experiment';
import { ExperimentService } from '../../../src/api/services/ExperimentService';
import { EXPERIMENT_STATE } from 'upgrade_types';
import { getAllExperimentCondition, markExperimentPoint, checkDeletedExperiment } from '../utils';
import { UserService } from '../../../src/api/services/UserService';
import { systemUser } from '../mockData/user/index';
import { ExperimentUserService } from '../../../src/api/services/ExperimentUserService';
import { experimentUsers } from '../mockData/experimentUsers/index';
import { checkMarkExperimentPointForUser, checkExperimentAssignedIsNotDefault } from '../utils/index';
import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';

export default async function testCase(): Promise<void> {
  const experimentService = Container.get<ExperimentService>(ExperimentService);
  const experimentUserService = Container.get<ExperimentUserService>(ExperimentUserService);
  const userService = Container.get<UserService>(UserService);

  // creating new user
  const user = await userService.upsertUser(systemUser as any, new UpgradeLogger());

  // experiment object
  const experimentObject = groupAssignmentWithIndividualConsistencyExperimentSwitchAfterAssignment;

  const experimentName = experimentObject.partitions[0].target;
  const experimentPoint = experimentObject.partitions[0].site;
  const condition = experimentObject.conditions[0].conditionCode;
  let experimentUserDoc = await experimentUserService.getOriginalUserDoc(experimentUsers[0].id, new UpgradeLogger());
  // ===================     set user groups for user 1
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
  let experimentUser = await experimentUserService.findOne(experimentUserDoc.id, new UpgradeLogger());
  let objectToCheck = {
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
  experimentUserDoc = await experimentUserService.getOriginalUserDoc(experimentUsers[1].id, new UpgradeLogger());
  // ===================     set user groups for user 2
  await experimentUserService.updateGroupMembership(
    experimentUsers[1].id,
    {
      teacher: ['2'],
      class: ['2'],
    },
    { logger: new UpgradeLogger(), userDoc: experimentUserDoc }
  );
  experimentUserDoc = await experimentUserService.getOriginalUserDoc(experimentUsers[1].id, new UpgradeLogger());
  await experimentUserService.updateWorkingGroup(
    experimentUsers[1].id,
    {
      teacher: '2',
      class: '2',
    },
    { logger: new UpgradeLogger(), userDoc: experimentUserDoc }
  );
  experimentUserDoc = await experimentUserService.getOriginalUserDoc(experimentUsers[1].id, new UpgradeLogger());
  experimentUser = await experimentUserService.findOne(experimentUserDoc.id, new UpgradeLogger());
  objectToCheck = {
    ...experimentUsers[1],
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
  experimentUserDoc = await experimentUserService.getOriginalUserDoc(experimentUsers[2].id, new UpgradeLogger());
  // ===================     set user groups for user 3
  await experimentUserService.updateGroupMembership(
    experimentUsers[2].id,
    {
      teacher: ['2'],
      class: ['2'],
    },
    { logger: new UpgradeLogger(), userDoc: experimentUserDoc }
  );
  experimentUserDoc = await experimentUserService.getOriginalUserDoc(experimentUsers[2].id, new UpgradeLogger());
  await experimentUserService.updateWorkingGroup(
    experimentUsers[2].id,
    {
      teacher: '2',
      class: '2',
    },
    { logger: new UpgradeLogger(), userDoc: experimentUserDoc }
  );
  experimentUserDoc = await experimentUserService.getOriginalUserDoc(experimentUsers[2].id, new UpgradeLogger());
  experimentUser = await experimentUserService.findOne(experimentUserDoc.id, new UpgradeLogger());
  objectToCheck = {
    ...experimentUsers[2],
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
  experimentUserDoc = await experimentUserService.getOriginalUserDoc(experimentUsers[3].id, new UpgradeLogger());
  // ===================     set user groups for user 4
  await experimentUserService.updateGroupMembership(
    experimentUsers[3].id,
    {
      teacher: ['1'],
      class: ['1'],
    },
    { logger: new UpgradeLogger(), userDoc: experimentUserDoc }
  );
  experimentUserDoc = await experimentUserService.getOriginalUserDoc(experimentUsers[3].id, new UpgradeLogger());
  await experimentUserService.updateWorkingGroup(
    experimentUsers[3].id,
    {
      teacher: '1',
      class: '1',
    },
    { logger: new UpgradeLogger(), userDoc: experimentUserDoc }
  );
  experimentUserDoc = await experimentUserService.getOriginalUserDoc(experimentUsers[3].id, new UpgradeLogger());
  experimentUser = await experimentUserService.findOne(experimentUserDoc.id, new UpgradeLogger());
  objectToCheck = {
    ...experimentUsers[3],
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
  // ===============  create experiment
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

  // get all experiment condition for user 1
  const experimentConditionAssignmentsForUser1Old = await getAllExperimentCondition(
    experimentUsers[0].id,
    new UpgradeLogger()
  );
  checkExperimentAssignedIsNotDefault(experimentConditionAssignmentsForUser1Old, experimentName, experimentPoint);

  let markedExperimentPoint = await markExperimentPoint(
    experimentUsers[0].id,
    experimentName,
    experimentPoint,
    condition,
    new UpgradeLogger()
  );
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[0].id, experimentName, experimentPoint);

  // get all experiment condition for user 2
  const experimentConditionAssignmentForUser2 = await getAllExperimentCondition(
    experimentUsers[1].id,
    new UpgradeLogger()
  );
  checkExperimentAssignedIsNotDefault(experimentConditionAssignmentForUser2, experimentName, experimentPoint);

  markedExperimentPoint = await markExperimentPoint(
    experimentUsers[1].id,
    experimentName,
    experimentPoint,
    condition,
    new UpgradeLogger()
  );
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[1].id, experimentName, experimentPoint);
  experimentUserDoc = await experimentUserService.getOriginalUserDoc(experimentUsers[0].id, new UpgradeLogger());
  // update groupMembership for user1
  await experimentUserService.updateGroupMembership(
    experimentUsers[0].id,
    {
      teacher: ['2'],
      class: ['2'],
    },
    { logger: new UpgradeLogger(), userDoc: experimentUserDoc }
  );
  experimentUserDoc = await experimentUserService.getOriginalUserDoc(experimentUsers[0].id, new UpgradeLogger());
  // updating working group for user1
  await experimentUserService.updateWorkingGroup(
    experimentUsers[0].id,
    {
      teacher: '2',
      class: '2',
    },
    { logger: new UpgradeLogger(), userDoc: experimentUserDoc }
  );
  experimentUserDoc = await experimentUserService.getOriginalUserDoc(experimentUsers[0].id, new UpgradeLogger());
  experimentUser = await experimentUserService.findOne(experimentUserDoc.id, new UpgradeLogger());
  objectToCheck = {
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
  // get all experiment condition for user1
  const experimentConditionAssignmentForUser1 = await getAllExperimentCondition(
    experimentUsers[0].id,
    new UpgradeLogger()
  );
  checkExperimentAssignedIsNotDefault(experimentConditionAssignmentForUser1, experimentName, experimentPoint);

  experimentConditionAssignmentsForUser1Old.map((experimentCondition) => {
    expect(experimentConditionAssignmentForUser1).toEqual(
      expect.arrayContaining([expect.objectContaining(experimentCondition)])
    );
  });

  markedExperimentPoint = await markExperimentPoint(
    experimentUsers[0].id,
    experimentName,
    experimentPoint,
    condition,
    new UpgradeLogger()
  );
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[0].id, experimentName, experimentPoint);

  // get all experiment condition for user 3
  let experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[2].id, new UpgradeLogger());
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName, experimentPoint);

  experimentConditionAssignments.map((experimentCondition) => {
    expect(experimentConditionAssignmentForUser2).toEqual(
      expect.arrayContaining([expect.objectContaining(experimentCondition)])
    );
  });

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
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName, experimentPoint);

  experimentConditionAssignmentForUser1.map((experimentCondition) => {
    expect(experimentConditionAssignments).toEqual(
      expect.arrayContaining([expect.objectContaining(experimentCondition)])
    );
  });

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
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName, experimentPoint);

  experimentConditionAssignmentForUser2.map((experimentCondition) => {
    expect(experimentConditionAssignments).toEqual(
      expect.arrayContaining([expect.objectContaining(experimentCondition)])
    );
  });

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

  experimentConditionAssignmentForUser2.map((experimentCondition) => {
    expect(experimentConditionAssignments).toEqual(
      expect.arrayContaining([expect.objectContaining(experimentCondition)])
    );
  });

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

  experimentConditionAssignmentsForUser1Old.map((experimentCondition) => {
    expect(experimentConditionAssignments).toEqual(
      expect.arrayContaining([expect.objectContaining(experimentCondition)])
    );
  });

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
