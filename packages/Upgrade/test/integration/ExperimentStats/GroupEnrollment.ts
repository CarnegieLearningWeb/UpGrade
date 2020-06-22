import { Container } from 'typedi';
// import { Logger as WinstonLogger } from '../../../../src/lib/logger';
import { ExperimentService } from '../../../src/api/services/ExperimentService';
import { groupExperimentStats } from '../mockData/experiment/index';
import { AnalyticsService } from '../../../src/api/services/AnalyticsService';
import { getAllExperimentCondition, markExperimentPoint } from '../utils';
import {
  checkMarkExperimentPointForUser,
  checkExperimentAssignedIsNotDefault,
  checkExperimentAssignedIsDefault,
} from '../utils/index';
import { EXPERIMENT_STATE } from 'upgrade_types';
import { UserService } from '../../../src/api/services/UserService';
import { systemUser } from '../mockData/user/index';
import { experimentUsers } from '../mockData/experimentUsers/index';

export default async function testCase(): Promise<void> {
  // const logger = new WinstonLogger(__filename);
  const experimentService = Container.get<ExperimentService>(ExperimentService);
  const analyticsService = Container.get<AnalyticsService>(AnalyticsService);
  const userService = Container.get<UserService>(UserService);

  // creating new user
  const user = await userService.create(systemUser as any);
  // experiment object
  const experimentObject = groupExperimentStats;

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

  // check stats
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

  // change experiment state to enrolling
  await experimentService.updateState(experimentId, EXPERIMENT_STATE.ENROLLING, user);

  // user 2 logs in experiment
  // get all experiment condition for user 2
  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[1].id);
  checkExperimentAssignedIsDefault(experimentConditionAssignments, experimentName1, experimentPoint1);
  checkExperimentAssignedIsDefault(experimentConditionAssignments, experimentName2, experimentPoint2);

  // mark experiment point
  markedExperimentPoint = await markExperimentPoint(experimentUsers[1].id, experimentName1, experimentPoint1);
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[1].id, experimentName1, experimentPoint1);

  // check stats
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

  // user 3 logs in experiment
  // get all experiment condition for user 3
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
        users: 1,
        groups: 1,
        id: experimentId,
      }),
    ])
  );

  // user 3 logs in experiment
  // get all experiment condition for user 3
  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[3].id);
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName1, experimentPoint1);
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName2, experimentPoint2);

  // mark experiment point
  markedExperimentPoint = await markExperimentPoint(experimentUsers[3].id, experimentName1, experimentPoint1);
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[3].id, experimentName1, experimentPoint1);

  stats = await analyticsService.getEnrollments([experimentId]);
  expect(stats).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        users: 2,
        groups: 1,
        id: experimentId,
      }),
    ])
  );

  // change experiment state to enrolling
  await experimentService.updateState(experimentId, EXPERIMENT_STATE.ENROLLMENT_COMPLETE, user);
}
