import { Container } from 'typedi';
import { individualAssignmentExperiment } from '../mockData/experiment';
import { ExperimentService } from '../../../src/api/services/ExperimentService';
import { EXPERIMENT_STATE } from 'upgrade_types';
import { getAllExperimentCondition, markExperimentPoint } from '../utils';
import { UserService } from '../../../src/api/services/UserService';
import { systemUser } from '../mockData/user/index';
import { previewUsers } from '../mockData/previewUsers/index';
import { PreviewUserService } from '../../../src/api/services/PreviewUserService';
import {
  checkExperimentAssignedIsNotDefault,
  checkExperimentAssignedIsNull,
  checkMarkExperimentPointForUser
} from '../utils/index';
import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';

export default async function testCase(): Promise<void> {
  const experimentService = Container.get<ExperimentService>(ExperimentService);
  const userService = Container.get<UserService>(UserService);
  const previewService = Container.get<PreviewUserService>(PreviewUserService);

  // creating new user
  const user = await userService.upsertUser(systemUser as any, new UpgradeLogger());

  // create preview user
  await previewService.create(previewUsers[0], new UpgradeLogger());
  await previewService.create(previewUsers[1], new UpgradeLogger());
  await previewService.create(previewUsers[2], new UpgradeLogger());
  await previewService.create(previewUsers[3], new UpgradeLogger());

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

  const experimentName = experimentObject.partitions[0].target;
  const experimentPoint = experimentObject.partitions[0].site;
  const condition = experimentObject.conditions[0].conditionCode;

  // get all experiment condition for user 1
  let experimentConditionAssignments = await getAllExperimentCondition(previewUsers[0].id, new UpgradeLogger());
  expect(experimentConditionAssignments).toHaveLength(0);

  // mark experiment point
  const experimentId = experiments[0].id;
  let markedExperimentPoint = await markExperimentPoint(
    previewUsers[0].id,
    experimentName,
    experimentPoint,
    condition,
    experimentId,
    new UpgradeLogger()
  );
  checkMarkExperimentPointForUser(markedExperimentPoint, previewUsers[0].id, experimentName, experimentPoint);

  // change experiment status to PREVIEW
  await experimentService.updateState(experimentId, EXPERIMENT_STATE.PREVIEW, user, new UpgradeLogger());

  // fetch experiment
  experiments = await experimentService.find(new UpgradeLogger());
  expect(experiments).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        name: experimentObject.name,
        state: EXPERIMENT_STATE.PREVIEW,
        postExperimentRule: experimentObject.postExperimentRule,
        assignmentUnit: experimentObject.assignmentUnit,
        consistencyRule: experimentObject.consistencyRule,
      }),
    ])
  );

  // get all experiment condition for user 2
  experimentConditionAssignments = await getAllExperimentCondition(previewUsers[1].id, new UpgradeLogger());
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName, experimentPoint);

  // mark experiment point for user 2
  markedExperimentPoint = await markExperimentPoint(
    previewUsers[1].id,
    experimentName,
    experimentPoint,
    condition,
    experimentId,
    new UpgradeLogger()
  );
  checkMarkExperimentPointForUser(markedExperimentPoint, previewUsers[1].id, experimentName, experimentPoint);

  // get all experiment condition for user 1
  experimentConditionAssignments = await getAllExperimentCondition(previewUsers[0].id, new UpgradeLogger());
  checkExperimentAssignedIsNull(experimentConditionAssignments, experimentName, experimentPoint);

  // mark experiment p oint for user 1
  markedExperimentPoint = await markExperimentPoint(
    previewUsers[0].id,
    experimentName,
    experimentPoint,
    condition,
    experimentId,
    new UpgradeLogger()
  );
  checkMarkExperimentPointForUser(markedExperimentPoint, previewUsers[0].id, experimentName, experimentPoint);

  // get all experiment condition for user 3
  experimentConditionAssignments = await getAllExperimentCondition(previewUsers[2].id, new UpgradeLogger());
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName, experimentPoint);

  // mark experiment point for user 1
  markedExperimentPoint = await markExperimentPoint(
    previewUsers[2].id,
    experimentName,
    experimentPoint,
    condition,
    experimentId,
    new UpgradeLogger()
  );
  checkMarkExperimentPointForUser(markedExperimentPoint, previewUsers[2].id, experimentName, experimentPoint);

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
  experimentConditionAssignments = await getAllExperimentCondition(previewUsers[1].id, new UpgradeLogger());
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName, experimentPoint);

  // mark experiment point for user 2
  markedExperimentPoint = await markExperimentPoint(
    previewUsers[1].id,
    experimentName,
    experimentPoint,
    condition,
    experimentId,
    new UpgradeLogger()
  );
  checkMarkExperimentPointForUser(markedExperimentPoint, previewUsers[1].id, experimentName, experimentPoint);

  // get all experiment condition for user 1
  experimentConditionAssignments = await getAllExperimentCondition(previewUsers[0].id, new UpgradeLogger());
  checkExperimentAssignedIsNull(experimentConditionAssignments, experimentName, experimentPoint);

  // mark experiment point for user 1
  markedExperimentPoint = await markExperimentPoint(
    previewUsers[0].id,
    experimentName,
    experimentPoint,
    condition,
    experimentId,
    new UpgradeLogger()
  );
  checkMarkExperimentPointForUser(markedExperimentPoint, previewUsers[0].id, experimentName, experimentPoint);

  // get all experiment condition for user 3
  experimentConditionAssignments = await getAllExperimentCondition(previewUsers[2].id, new UpgradeLogger());
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName, experimentPoint);

  // mark experiment point for user 1
  markedExperimentPoint = await markExperimentPoint(
    previewUsers[2].id,
    experimentName,
    experimentPoint,
    condition,
    experimentId,
    new UpgradeLogger()
  );
  checkMarkExperimentPointForUser(markedExperimentPoint, previewUsers[2].id, experimentName, experimentPoint);
}
