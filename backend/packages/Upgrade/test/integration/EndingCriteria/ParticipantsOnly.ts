import { EXPERIMENT_STATE } from 'upgrade_types';
import { UserService } from './../../../src/api/services/UserService';
import { ExperimentService } from './../../../src/api/services/ExperimentService';
import { Container } from 'typedi';
import { systemUser } from '../mockData/user/index';
import { participantsOnlyExperiment } from '../mockData/experiment/index';
import { getAllExperimentCondition, markExperimentPoint } from '../utils';
import { experimentUsers } from '../mockData/experimentUsers/index';
import { checkMarkExperimentPointForUser, checkExperimentAssignedIsNotDefault } from '../utils/index';
import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';

export default async function ParticipantsOnly() {
  // const logger = new WinstonLogger(__filename);
  const experimentService = Container.get<ExperimentService>(ExperimentService);
  const userService = Container.get<UserService>(UserService);

  // creating new user
  const user = await userService.upsertUser(systemUser as any, new UpgradeLogger());

  // experiment object
  const experimentObject = participantsOnlyExperiment;
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
        enrollmentCompleteCondition: expect.objectContaining({
          userCount: experimentObject.enrollmentCompleteCondition.userCount,
        }),
      }),
    ])
  );

  const experimentName1 = experimentObject.partitions[0].target;
  const experimentPoint1 = experimentObject.partitions[0].site;

  const experimentName2 = experimentObject.partitions[1].target;
  const experimentPoint2 = experimentObject.partitions[1].site;

  const condition = experimentObject.conditions[0].conditionCode;

  // get all experiment condition for user 1
  let experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[0].id, new UpgradeLogger());
  expect(experimentConditionAssignments).toHaveLength(0);

  // mark experiment point
  let markedExperimentPoint = await markExperimentPoint(
    experimentUsers[0].id,
    experimentName1,
    experimentPoint1,
    condition,
    new UpgradeLogger()
  );
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[0].id, experimentName1, experimentPoint1);

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

  // get all experiment condition for user 2
  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[1].id, new UpgradeLogger());
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName1, experimentPoint1);
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName2, experimentPoint2);

  // mark experiment point
  markedExperimentPoint = await markExperimentPoint(
    experimentUsers[1].id,
    experimentName1,
    experimentPoint1,
    condition,
    new UpgradeLogger()
  );
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[1].id, experimentName1, experimentPoint1);

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

  // mark experiment point
  markedExperimentPoint = await markExperimentPoint(
    experimentUsers[1].id,
    experimentName2,
    experimentPoint2,
    condition,
    new UpgradeLogger()
  );
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[1].id, experimentName2, experimentPoint2);

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

  // get all experiment condition for user 3
  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[2].id, new UpgradeLogger());
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName1, experimentPoint1);
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName2, experimentPoint2);

  // mark experiment point
  markedExperimentPoint = await markExperimentPoint(
    experimentUsers[2].id,
    experimentName1,
    experimentPoint1,
    condition,
    new UpgradeLogger()
  );
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[2].id, experimentName1, experimentPoint1);

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

  markedExperimentPoint = await markExperimentPoint(
    experimentUsers[2].id,
    experimentName2,
    experimentPoint2,
    condition,
    new UpgradeLogger()
  );
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[2].id, experimentName2, experimentPoint2);

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
}
