import { Container } from 'typedi';
import { ExperimentService } from '../../../src/api/services/ExperimentService';
import { UserService } from '../../../src/api/services/UserService';
import { systemUser } from '../mockData/user/index';
import { getAllExperimentCondition, markExperimentPoint } from '../utils';
import { experimentUsers } from '../mockData/experimentUsers/index';
import { AnalyticsService } from '../../../src/api/services/AnalyticsService';
import { withinSubjectExperiment } from '../mockData/experiment/index';
import {
  checkMarkExperimentPointForUser,
  checkExperimentAssignedIsNotDefault,
  checkExperimentAssignedIsNull,
} from '../utils/index';
import { EXPERIMENT_STATE } from 'upgrade_types';
import { PreviewUserService } from '../../../src/api/services/PreviewUserService';
import { previewUsers } from '../mockData/previewUsers/index';
import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';

export default async function testCase(): Promise<void> {
  const experimentService = Container.get<ExperimentService>(ExperimentService);
  const analyticsService = Container.get<AnalyticsService>(AnalyticsService);
  const previewService = Container.get<PreviewUserService>(PreviewUserService);
  const userService = Container.get<UserService>(UserService);

  // creating preview user
  const previewUser = await previewService.create(previewUsers[3], new UpgradeLogger());

  // creating new user
  const user = await userService.upsertUser(systemUser as any, new UpgradeLogger());
  // experiment object
  const experimentObject = withinSubjectExperiment;

  // create experiment
  await experimentService.create(experimentObject as any, user, new UpgradeLogger());
  const experiments = await experimentService.find(new UpgradeLogger());
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

  const experimentId = experiments[0].id;

  const experimentName1 = experimentObject.partitions[0].target;
  const experimentPoint1 = experimentObject.partitions[0].site;
  const condition1 = experimentObject.conditions[0].conditionCode;

  const experimentName2 = experimentObject.partitions[1].target;
  const experimentPoint2 = experimentObject.partitions[1].site;
  const condition2 = experimentObject.conditions[1].conditionCode;

  // get all experiment condition for user 1
  let experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[0].id, new UpgradeLogger());
  expect(experimentConditionAssignments).toHaveLength(0);

  // mark experiment point
  let markedExperimentPoint = await markExperimentPoint(
    experimentUsers[0].id,
    experimentName1,
    experimentPoint1,
    condition1,
    new UpgradeLogger()
  );
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[0].id, experimentName1, experimentPoint1);

  // user 1 logs in experiment
  // get all experiment condition for user 1
  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[0].id, new UpgradeLogger());
  expect(experimentConditionAssignments).toHaveLength(0);

  // mark experiment point
  markedExperimentPoint = await markExperimentPoint(
    experimentUsers[0].id,
    experimentName1,
    experimentPoint1,
    condition1,
    new UpgradeLogger()
  );
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[0].id, experimentName1, experimentPoint1);

  let stats = await analyticsService.getEnrollments([experimentId]);
  expect(stats).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        users: 0,
        groups: 0,
        id: experimentId,
      }),
    ])
  );

  // change experiment state to enrolling
  await experimentService.updateState(experimentId, EXPERIMENT_STATE.ENROLLING, user, new UpgradeLogger());

  // user 2 logs in experiment
  // get all experiment condition for user 2
  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[1].id, new UpgradeLogger());
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName1, experimentPoint1);
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName2, experimentPoint2);

  stats = await analyticsService.getEnrollments([experimentId]);
  expect(stats).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        users: 0,
        groups: 0,
        id: experimentId,
      }),
    ])
  );

  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[0].id, new UpgradeLogger());
  checkExperimentAssignedIsNull(experimentConditionAssignments, experimentName1, experimentPoint1);
  // mark experiment point
  markedExperimentPoint = await markExperimentPoint(
    experimentUsers[0].id,
    experimentName1,
    experimentPoint1,
    condition1,
    new UpgradeLogger()
  );
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[0].id, experimentName1, experimentPoint1);

  stats = await analyticsService.getEnrollments([experimentId]);
  expect(stats).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        users: 1,
        groups: 0,
        id: experimentId,
      }),
    ])
  );

  // mark experiment point
  markedExperimentPoint = await markExperimentPoint(
    experimentUsers[1].id,
    experimentName1,
    experimentPoint1,
    condition1,
    new UpgradeLogger()
  );
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[1].id, experimentName1, experimentPoint1);

  stats = await analyticsService.getEnrollments([experimentId]);
  expect(stats.length).toEqual(1);
  expect(stats).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        users: 2,
        groups: 0,
        id: experimentId,
      }),
    ])
  );

  // when preview user is assigned an experiment condition
  experimentConditionAssignments = await getAllExperimentCondition(previewUser.id, new UpgradeLogger());
  expect(experimentConditionAssignments).toHaveLength(experimentObject.partitions.length);

  markedExperimentPoint = await markExperimentPoint(
    previewUser.id,
    experimentName2,
    experimentPoint2,
    condition2,
    new UpgradeLogger()
  );
  checkMarkExperimentPointForUser(markedExperimentPoint, previewUser.id, experimentName2, experimentPoint2);

  // number of users should not increase
  stats = await analyticsService.getEnrollments([experimentId]);
  expect(stats.length).toEqual(1);
  expect(stats).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        users: 2,
        groups: 0,
        id: experimentId,
      }),
    ])
  );

  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[2].id, new UpgradeLogger());
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName1, experimentPoint1);
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName2, experimentPoint2);

  // mark experiment point
  markedExperimentPoint = await markExperimentPoint(
    experimentUsers[2].id,
    experimentName2,
    experimentPoint2,
    condition2,
    new UpgradeLogger()
  );
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[2].id, experimentName2, experimentPoint2);

  stats = await analyticsService.getEnrollments([experimentId]);
  expect(stats).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        users: 3,
        groups: 0,
        id: experimentId,
      }),
    ])
  );
}
