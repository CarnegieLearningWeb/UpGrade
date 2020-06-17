import { Container } from 'typedi';
import { ExperimentService } from '../../../src/api/services/ExperimentService';
import { UserService } from '../../../src/api/services/UserService';
import { Logger as WinstonLogger } from '../../../src/lib/logger';
import { systemUser } from '../mockData/user/index';
import { getAllExperimentCondition, markExperimentPoint } from '../utils';
import { experimentUsers } from '../mockData/experimentUsers/index';
import { AnalyticsService } from '../../../src/api/services/AnalyticsService';
import { individualExperimentStats } from '../mockData/experiment/index';
import {
  checkMarkExperimentPointForUser,
  checkExperimentAssignedIsNotDefault,
  checkExperimentAssignedIsDefault,
} from '../utils/index';
import { EXPERIMENT_STATE } from 'upgrade_types';
import { PreviewUserService } from '../../../src/api/services/PreviewUserService';
import { previewUsers } from '../mockData/previewUsers/index';

export default async function testCase(): Promise<void> {
  // const logger = new WinstonLogger(__filename);
  const experimentService = Container.get<ExperimentService>(ExperimentService);
  const analyticsService = Container.get<AnalyticsService>(AnalyticsService);
  const previewService = Container.get<PreviewUserService>(PreviewUserService);
  const userService = Container.get<UserService>(UserService);

  // creating preview user
  const previewUser = await previewService.create(previewUsers[0]);

  // creating new user
  const user = await userService.create(systemUser as any);
  // experiment object
  const experimentObject = individualExperimentStats;

  // create experiment
  await experimentService.create(experimentObject as any, user);
  const experiments = await experimentService.find();
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

  const experimentName1 = experimentObject.partitions[0].expId;
  const experimentPoint1 = experimentObject.partitions[0].expPoint;

  const experimentName2 = experimentObject.partitions[1].expId;
  const experimentPoint2 = experimentObject.partitions[1].expPoint;

  // get all experiment condition for user 1
  let experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[0].id);
  expect(experimentConditionAssignments).toHaveLength(0);

  // mark experiment point
  let markedExperimentPoint = await markExperimentPoint(experimentUsers[0].id, experimentName1, experimentPoint1);
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[0].id, experimentName1, experimentPoint1);

  // user 1 logs in experiment
  // get all experiment condition for user 1
  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[0].id);
  expect(experimentConditionAssignments).toHaveLength(0);

  // mark experiment point
  markedExperimentPoint = await markExperimentPoint(experimentUsers[0].id, experimentName1, experimentPoint1);
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[0].id, experimentName1, experimentPoint1);

  let stats = await analyticsService.getEnrollments([experimentId]);
  expect(stats).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        user: 0,
        group: 0,
        experimentId,
      }),
    ])
  );

  // change experiment state to enrolling
  await experimentService.updateState(experimentId, EXPERIMENT_STATE.ENROLLING, user);

  // user 2 logs in experiment
  // get all experiment condition for user 2
  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[1].id);
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName1, experimentPoint1);
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName2, experimentPoint2);

  stats = await analyticsService.getEnrollments([experimentId]);
  expect(stats).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        user: 0,
        group: 0,
        experimentId,
      }),
    ])
  );

  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[0].id);
  checkExperimentAssignedIsDefault(experimentConditionAssignments, experimentName1, experimentPoint1);
  // mark experiment point
  markedExperimentPoint = await markExperimentPoint(experimentUsers[0].id, experimentName1, experimentPoint1);
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[0].id, experimentName1, experimentPoint1);

  stats = await analyticsService.getEnrollments([experimentId]);
  expect(stats).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        user: 0,
        group: 0,
        experimentId,
      }),
    ])
  );

  // mark experiment point
  markedExperimentPoint = await markExperimentPoint(experimentUsers[1].id, experimentName1, experimentPoint1);
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[1].id, experimentName1, experimentPoint1);

  stats = await analyticsService.getEnrollments([experimentId]);
  expect(stats.length).toEqual(1);
  expect(stats).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        user: 1,
        group: 0,
        experimentId,
      }),
    ])
  );

  // when preview user is assigned an experiment condition
  experimentConditionAssignments = await getAllExperimentCondition(previewUser.id);
  expect(experimentConditionAssignments).toHaveLength(experimentObject.partitions.length);

  markedExperimentPoint = await markExperimentPoint(previewUser.id, experimentName2, experimentPoint2);
  checkMarkExperimentPointForUser(markedExperimentPoint, previewUser.id, experimentName2, experimentPoint2);

  // number of users should not increase
  stats = await analyticsService.getEnrollments([experimentId]);
  expect(stats.length).toEqual(1);
  expect(stats).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        user: 1,
        group: 0,
        experimentId,
      }),
    ])
  );

  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[2].id);
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName1, experimentPoint1);
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName2, experimentPoint2);

  // mark experiment point
  markedExperimentPoint = await markExperimentPoint(experimentUsers[2].id, experimentName2, experimentPoint2);
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[2].id, experimentName2, experimentPoint2);

  stats = await analyticsService.getEnrollments([experimentId]);
  expect(stats).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        user: 2,
        group: 0,
        experimentId,
      }),
    ])
  );
}
