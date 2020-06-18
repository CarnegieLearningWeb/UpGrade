import { Container } from 'typedi';
// import { Logger as WinstonLogger } from '../../../../src/lib/logger';
import { ExperimentService } from '../../../src/api/services/ExperimentService';
import { individualExperimentStats } from '../mockData/experiment/index';
import { AnalyticsService } from '../../../src/api/services/AnalyticsService';
import { getAllExperimentCondition, markExperimentPoint } from '../utils';
import { checkMarkExperimentPointForUser, checkExperimentAssignedIsNotDefault } from '../utils/index';
import { EXPERIMENT_STATE, DATE_RANGE } from 'upgrade_types';
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

  // change experiment state to scheduled
  const date = new Date();
  await experimentService.updateState(experimentId, EXPERIMENT_STATE.SCHEDULED, user, date);

  // user 1 logs in experiment
  // get all experiment condition for user 1
  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[0].id);
  expect(experimentConditionAssignments).toHaveLength(0);

  // mark experiment point
  markedExperimentPoint = await markExperimentPoint(experimentUsers[0].id, experimentName1, experimentPoint1);
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[0].id, experimentName1, experimentPoint1);

  // change experiment state to enrolling
  await experimentService.updateState(experimentId, EXPERIMENT_STATE.ENROLLING, user);

  // user 2 logs in experiment
  // get all experiment condition for user 2
  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[1].id);
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName1, experimentPoint1);
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName2, experimentPoint2);

  // mark experiment point
  markedExperimentPoint = await markExperimentPoint(experimentUsers[1].id, experimentName1, experimentPoint1);
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[1].id, experimentName1, experimentPoint1);

  // const fromDate = new Date().toISOString();
  // var d1 = new Date();

  // check stats
  let checkData = await analyticsService.getEnrolmentStatsByDate(experimentId, DATE_RANGE.LAST_SEVEN_DAYS);
  console.log('checkData', JSON.stringify(checkData, null, 2));
  // expect(checkData.length).toEqual(0);

  // await new Promise((r) => setTimeout(r, 100));
  // toDate = new Date();

  // checkData = await analyticsService.getEnrolmentStatsByDate(experimentId, fromDate, toDate);
  // expect(checkData.length).toEqual(0);

  // await new Promise((r) => setTimeout(r, 100));
  // fromDate = new Date();
  // toDate = new Date();
  // checkData = await analyticsService.getEnrolmentStatsByDate(experimentId, fromDate, toDate);
  // expect(checkData.length).toEqual(0);

  // // check state

  // fromDate = new Date();
  // await new Promise((r) => setTimeout(r, 100));
  // // user 3 logs in experiment
  // // get all experiment condition for user 3
  // experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[2].id);
  // checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName1, experimentPoint1);
  // checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName2, experimentPoint2);

  // // mark experiment point
  // markedExperimentPoint = await markExperimentPoint(experimentUsers[2].id, experimentName2, experimentPoint2);
  // checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[2].id, experimentName2, experimentPoint2);

  // await new Promise((r) => setTimeout(r, 100));
  // toDate = new Date();

  // checkData = await analyticsService.getEnrolmentStatsByDate(experimentId, fromDate, toDate);
  // expect(checkData.length).toEqual(1);

  // // change experiment state to enrolling
  // await experimentService.updateState(experimentId, EXPERIMENT_STATE.ENROLLMENT_COMPLETE, user);

  // fromDate = new Date();
  // await new Promise((r) => setTimeout(r, 100));

  // // mark experiment point
  // markedExperimentPoint = await markExperimentPoint(experimentUsers[3].id, experimentName1, experimentPoint1);
  // checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[3].id, experimentName1, experimentPoint1);

  // await new Promise((r) => setTimeout(r, 100));
  // toDate = new Date();

  // checkData = await analyticsService.getEnrolmentStatsByDate(experimentId, fromDate, toDate);
  // expect(checkData.length).toEqual(1);
}
