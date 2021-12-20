import { Container } from 'typedi';
import { individualAssignmentExperimentConsistencyRuleExperiemnt } from '../mockData/experiment';
import { ExperimentService } from '../../../src/api/services/ExperimentService';
import { EXPERIMENT_STATE } from 'upgrade_types';
import { Logger as WinstonLogger } from '../../../src/lib/logger';
import { getAllExperimentCondition, markExperimentPoint } from '../utils';
import { checkExperimentAssignedIsNotDefault, checkMarkExperimentPointForUser } from '../utils/index';
import { UserService } from '../../../src/api/services/UserService';
import { systemUser } from '../mockData/user/index';
import { PreviewUserService } from '../../../src/api/services/PreviewUserService';
import { previewUsers } from '../mockData/previewUsers/index';
import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';

export default async function testCase(): Promise<void> {
  const logger = new WinstonLogger(__filename);
  const experimentService = Container.get<ExperimentService>(ExperimentService);
  const userService = Container.get<UserService>(UserService);
  const previewService = Container.get<PreviewUserService>(PreviewUserService);

  // creating new user
  const user = await userService.upsertUser(systemUser as any);

  // create preview user
  await previewService.create(previewUsers[0]);
  await previewService.create(previewUsers[1]);
  await previewService.create(previewUsers[2]);

  // experiment object
  const experimentObject = individualAssignmentExperimentConsistencyRuleExperiemnt;

  const experimentName = experimentObject.partitions[0].expId;
  const experimentPoint = experimentObject.partitions[0].expPoint;
  const condition = experimentObject.conditions[0].conditionCode;

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

  // get all experiment condition for user 1
  let experimentConditionAssignments = await getAllExperimentCondition(previewUsers[0].id, new UpgradeLogger());
  expect(experimentConditionAssignments).toHaveLength(0);

  // mark experiment point
  let markedExperimentPoint = await markExperimentPoint(previewUsers[0].id, experimentName, experimentPoint, condition, new UpgradeLogger());
  checkMarkExperimentPointForUser(markedExperimentPoint, previewUsers[0].id, experimentName, experimentPoint);

  // change experiment status to Preview
  const experimentId = experiments[0].id;
  await experimentService.updateState(experimentId, EXPERIMENT_STATE.PREVIEW, user);

  // fetch experiment
  experiments = await experimentService.find();
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
  markedExperimentPoint = await markExperimentPoint(previewUsers[1].id, experimentName, experimentPoint, condition, new UpgradeLogger());
  checkMarkExperimentPointForUser(markedExperimentPoint, previewUsers[1].id, experimentName, experimentPoint);

  // get all experiment condition for user 1
  experimentConditionAssignments = await getAllExperimentCondition(previewUsers[0].id, new UpgradeLogger());
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName, experimentPoint);

  // mark experiment point for user 1
  markedExperimentPoint = await markExperimentPoint(previewUsers[0].id, experimentName, experimentPoint, condition, new UpgradeLogger());
  checkMarkExperimentPointForUser(markedExperimentPoint, previewUsers[0].id, experimentName, experimentPoint);

  // get all experiment condition for user 3
  experimentConditionAssignments = await getAllExperimentCondition(previewUsers[2].id, new UpgradeLogger());
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName, experimentPoint);

  // mark experiment point for user 1
  markedExperimentPoint = await markExperimentPoint(previewUsers[2].id, experimentName, experimentPoint, condition, new UpgradeLogger());
  checkMarkExperimentPointForUser(markedExperimentPoint, previewUsers[2].id, experimentName, experimentPoint);

  // change experiment status to complete
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

  // get all experiment condition for user 2
  experimentConditionAssignments = await getAllExperimentCondition(previewUsers[1].id, new UpgradeLogger());
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName, experimentPoint);

  // mark experiment point for user 2
  markedExperimentPoint = await markExperimentPoint(previewUsers[1].id, experimentName, experimentPoint, condition, new UpgradeLogger());
  checkMarkExperimentPointForUser(markedExperimentPoint, previewUsers[1].id, experimentName, experimentPoint);

  // get all experiment condition for user 1
  experimentConditionAssignments = await getAllExperimentCondition(previewUsers[0].id, new UpgradeLogger());
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName, experimentPoint);

  // mark experiment point for user 1
  markedExperimentPoint = await markExperimentPoint(previewUsers[0].id, experimentName, experimentPoint, condition, new UpgradeLogger());
  checkMarkExperimentPointForUser(markedExperimentPoint, previewUsers[0].id, experimentName, experimentPoint);

  // get all experiment condition for user 3
  experimentConditionAssignments = await getAllExperimentCondition(previewUsers[2].id, new UpgradeLogger());
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName, experimentPoint);

  // mark experiment point for user 1
  markedExperimentPoint = await markExperimentPoint(previewUsers[2].id, experimentName, experimentPoint, condition, new UpgradeLogger());
  checkMarkExperimentPointForUser(markedExperimentPoint, previewUsers[2].id, experimentName, experimentPoint);
}