import { Container } from 'typedi';
import { individualAssignmentExperiment } from '../mockData/experiment';
import { ExperimentService } from '../../../src/api/services/ExperimentService';
import { EXPERIMENT_STATE } from 'upgrade_types';
import { getAllExperimentCondition, markExperimentPoint } from '../utils';
import { UserService } from '../../../src/api/services/UserService';
import { systemUser } from '../mockData/user/index';
import { previewUsers } from '../mockData/previewUsers/index';
import { PreviewUserService } from '../../../src/api/services/PreviewUserService';
import { checkExperimentAssignedIsNotDefault, checkMarkExperimentPointForUser } from '../utils/index';
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
  let markedExperimentPoint = await markExperimentPoint(
    previewUsers[0].id,
    experimentName,
    experimentPoint,
    condition,
    new UpgradeLogger()
  );
  checkMarkExperimentPointForUser(markedExperimentPoint, previewUsers[0].id, experimentName, experimentPoint);

  // change experiment status to PREVIEW
  const experimentId = experiments[0].id;
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

  // get preview user
  let previewUser1 = await previewService.findOne(previewUsers[0].id, new UpgradeLogger());
  let previewUser2 = await previewService.findOne(previewUsers[1].id, new UpgradeLogger());
  expect((previewUser1.assignments && previewUser1.assignments.length) || 0).toEqual(0);

  const assignedConditionUser1 = experiments[0].conditions[0];

  // add forced assignment for preview user 1
  await previewService.upsertExperimentConditionAssignment(
    {
      ...previewUser1,
      assignments: [
        {
          experiment: { id: experimentId },
          experimentCondition: { id: assignedConditionUser1.id },
        },
      ],
    } as any,
    new UpgradeLogger()
  );

  previewUser1 = await previewService.findOne(previewUsers[0].id, new UpgradeLogger());
  expect((previewUser1.assignments && previewUser1.assignments.length) || 0).toEqual(1);

  // get all experiment condition for user 2
  experimentConditionAssignments = await getAllExperimentCondition(previewUsers[1].id, new UpgradeLogger());
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName, experimentPoint);

  // mark experiment point for user 2
  markedExperimentPoint = await markExperimentPoint(
    previewUsers[1].id,
    experimentName,
    experimentPoint,
    condition,
    new UpgradeLogger()
  );
  checkMarkExperimentPointForUser(markedExperimentPoint, previewUsers[1].id, experimentName, experimentPoint);

  // get all experiment condition for user 1
  experimentConditionAssignments = await getAllExperimentCondition(previewUsers[0].id, new UpgradeLogger());
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName, experimentPoint);

  // mark experiment point for user 1
  markedExperimentPoint = await markExperimentPoint(
    previewUsers[0].id,
    experimentName,
    experimentPoint,
    condition,
    new UpgradeLogger()
  );
  checkMarkExperimentPointForUser(markedExperimentPoint, previewUsers[0].id, experimentName, experimentPoint);

  // check assignment is the one assigned
  expect(experimentConditionAssignments[0].assignedCondition[0].conditionCode).toEqual(
    assignedConditionUser1.conditionCode
  );

  const assignedConditionUser2 = experiments[0].conditions[1];

  // add forced assignment for preview user 1
  await previewService.upsertExperimentConditionAssignment(
    {
      ...previewUser2,
      assignments: [
        {
          experiment: { id: experimentId },
          experimentCondition: { id: assignedConditionUser2.id },
        },
      ],
    } as any,
    new UpgradeLogger()
  );

  previewUser2 = await previewService.findOne(previewUsers[1].id, new UpgradeLogger());
  expect((previewUser2.assignments && previewUser2.assignments.length) || 0).toEqual(1);

  // get all experiment condition for user 3
  experimentConditionAssignments = await getAllExperimentCondition(previewUsers[2].id, new UpgradeLogger());
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName, experimentPoint);

  // mark experiment point for user 1
  markedExperimentPoint = await markExperimentPoint(
    previewUsers[2].id,
    experimentName,
    experimentPoint,
    condition,
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
    new UpgradeLogger()
  );
  checkMarkExperimentPointForUser(markedExperimentPoint, previewUsers[1].id, experimentName, experimentPoint);

  // add forced assignment for preview user 1
  await previewService.upsertExperimentConditionAssignment(
    {
      ...previewUser1,
      assignments: [],
    } as any,
    new UpgradeLogger()
  );

  // check assignment is the one assigned
  expect(experimentConditionAssignments[0].assignedCondition[0].conditionCode).toEqual(
    assignedConditionUser2.conditionCode
  );

  previewUser1 = await previewService.findOne(previewUsers[0].id, new UpgradeLogger());
  expect((previewUser1.assignments && previewUser1.assignments.length) || 0).toEqual(0);

  // get all experiment condition for user 1
  experimentConditionAssignments = await getAllExperimentCondition(previewUsers[0].id, new UpgradeLogger());
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName, experimentPoint);

  // mark experiment point for user 1
  markedExperimentPoint = await markExperimentPoint(
    previewUsers[0].id,
    experimentName,
    experimentPoint,
    condition,
    new UpgradeLogger()
  );
  checkMarkExperimentPointForUser(markedExperimentPoint, previewUsers[0].id, experimentName, experimentPoint);

  // check assignment is the one assigned
  expect(experimentConditionAssignments[0].assignedCondition[0].conditionCode).toEqual(
    assignedConditionUser1.conditionCode
  );

  // get all experiment condition for user 3
  experimentConditionAssignments = await getAllExperimentCondition(previewUsers[2].id, new UpgradeLogger());
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName, experimentPoint);

  // mark experiment point for user 1
  markedExperimentPoint = await markExperimentPoint(
    previewUsers[2].id,
    experimentName,
    experimentPoint,
    condition,
    new UpgradeLogger()
  );
  checkMarkExperimentPointForUser(markedExperimentPoint, previewUsers[2].id, experimentName, experimentPoint);
}
