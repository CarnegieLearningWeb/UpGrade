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
  let date = new Date();
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

  date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate());
  let newDate = new Date(date).toISOString();

  date.setDate(date.getDate() - 1);
  let newDate1 = new Date(date).toISOString();

  date.setDate(date.getDate() - 1);
  let newDate2 = new Date(date).toISOString();

  date.setDate(date.getDate() - 1);
  let newDate3 = new Date(date).toISOString();

  date.setDate(date.getDate() - 1);
  let newDate4 = new Date(date).toISOString();

  date.setDate(date.getDate() - 1);
  let newDate5 = new Date(date).toISOString();

  date.setDate(date.getDate() - 1);
  let newDate6 = new Date(date).toISOString();

  // check stats
  let checkData = await analyticsService.getEnrolmentStatsByDate(experimentId, DATE_RANGE.LAST_SEVEN_DAYS);

  expect(checkData).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        date: newDate,
        stats: expect.objectContaining({
          id: experimentId,
          users: 1,
          groups: 0,
          usersExcluded: 1,
          groupsExcluded: 0,
        }),
      }),
      expect.objectContaining({
        date: newDate1,
        stats: expect.objectContaining({
          id: experimentId,
          users: 0,
          groups: 0,
          usersExcluded: 1,
          groupsExcluded: 0,
        }),
      }),
      expect.objectContaining({
        date: newDate2,
        stats: expect.objectContaining({
          id: experimentId,
          users: 0,
          groups: 0,
          usersExcluded: 1,
          groupsExcluded: 0,
        }),
      }),
      expect.objectContaining({
        date: newDate3,
        stats: expect.objectContaining({
          id: experimentId,
          users: 0,
          groups: 0,
          usersExcluded: 1,
          groupsExcluded: 0,
        }),
      }),
      expect.objectContaining({
        date: newDate4,
        stats: expect.objectContaining({
          id: experimentId,
          users: 0,
          groups: 0,
          usersExcluded: 1,
          groupsExcluded: 0,
        }),
      }),
      expect.objectContaining({
        date: newDate5,
        stats: expect.objectContaining({
          id: experimentId,
          users: 0,
          groups: 0,
          usersExcluded: 1,
          groupsExcluded: 0,
        }),
      }),
      expect.objectContaining({
        date: newDate6,
        stats: expect.objectContaining({
          id: experimentId,
          users: 0,
          groups: 0,
          usersExcluded: 1,
          groupsExcluded: 0,
        }),
      }),
    ])
  );
  expect(checkData.length).toEqual(7);

  checkData = await analyticsService.getEnrolmentStatsByDate(experimentId, DATE_RANGE.LAST_THREE_MONTHS);
  expect(checkData.length).toEqual(3);

  date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(1);
  date.setMonth(date.getMonth());
  newDate = new Date(date).toISOString();

  date.setMonth(date.getMonth() - 1);
  newDate1 = new Date(date).toISOString();

  date.setMonth(date.getMonth() - 1);
  newDate2 = new Date(date).toISOString();

  expect(checkData).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        date: newDate,
        stats: expect.objectContaining({
          id: experimentId,
          users: 1,
          groups: 0,
          usersExcluded: 1,
          groupsExcluded: 0,
        }),
      }),
      expect.objectContaining({
        date: newDate1,
        stats: expect.objectContaining({
          id: experimentId,
          users: 0,
          groups: 0,
          usersExcluded: 1,
          groupsExcluded: 0,
        }),
      }),
      expect.objectContaining({
        date: newDate2,
        stats: expect.objectContaining({
          id: experimentId,
          users: 0,
          groups: 0,
          usersExcluded: 1,
          groupsExcluded: 0,
        }),
      }),
    ])
  );

  checkData = await analyticsService.getEnrolmentStatsByDate(experimentId, DATE_RANGE.LAST_SIX_MONTHS);
  expect(checkData.length).toEqual(6);

  date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(1);
  date.setMonth(date.getMonth());
  newDate = new Date(date).toISOString();

  date.setMonth(date.getMonth() - 1);
  newDate1 = new Date(date).toISOString();

  date.setMonth(date.getMonth() - 1);
  newDate2 = new Date(date).toISOString();

  date.setMonth(date.getMonth() - 1);
  newDate3 = new Date(date).toISOString();

  date.setMonth(date.getMonth() - 1);
  newDate4 = new Date(date).toISOString();

  date.setMonth(date.getMonth() - 1);
  newDate5 = new Date(date).toISOString();

  expect(checkData).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        date: newDate,
        stats: expect.objectContaining({
          id: experimentId,
          users: 1,
          groups: 0,
          usersExcluded: 1,
          groupsExcluded: 0,
        }),
      }),
      expect.objectContaining({
        date: newDate1,
        stats: expect.objectContaining({
          id: experimentId,
          users: 0,
          groups: 0,
          usersExcluded: 1,
          groupsExcluded: 0,
        }),
      }),
      expect.objectContaining({
        date: newDate2,
        stats: expect.objectContaining({
          id: experimentId,
          users: 0,
          groups: 0,
          usersExcluded: 1,
          groupsExcluded: 0,
        }),
      }),
      expect.objectContaining({
        date: newDate3,
        stats: expect.objectContaining({
          id: experimentId,
          users: 0,
          groups: 0,
          usersExcluded: 1,
          groupsExcluded: 0,
        }),
      }),
      expect.objectContaining({
        date: newDate5,
        stats: expect.objectContaining({
          id: experimentId,
          users: 0,
          groups: 0,
          usersExcluded: 1,
          groupsExcluded: 0,
        }),
      }),
      expect.objectContaining({
        date: newDate5,
        stats: expect.objectContaining({
          id: experimentId,
          users: 0,
          groups: 0,
          usersExcluded: 1,
          groupsExcluded: 0,
        }),
      }),
    ])
  );

  checkData = await analyticsService.getEnrolmentStatsByDate(experimentId, DATE_RANGE.LAST_TWELVE_MONTHS);
  expect(checkData.length).toEqual(12);

  date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(1);
  date.setMonth(date.getMonth());
  newDate = new Date(date).toISOString();

  date.setMonth(date.getMonth() - 1);
  newDate1 = new Date(date).toISOString();

  date.setMonth(date.getMonth() - 1);
  newDate2 = new Date(date).toISOString();

  date.setMonth(date.getMonth() - 1);
  newDate3 = new Date(date).toISOString();

  date.setMonth(date.getMonth() - 1);
  newDate4 = new Date(date).toISOString();

  date.setMonth(date.getMonth() - 1);
  newDate5 = new Date(date).toISOString();

  date.setMonth(date.getMonth() - 1);
  newDate6 = new Date(date).toISOString();

  date.setMonth(date.getMonth() - 1);
  const newDate7 = new Date(date).toISOString();

  date.setMonth(date.getMonth() - 1);
  const newDate8 = new Date(date).toISOString();

  date.setMonth(date.getMonth() - 1);
  const newDate9 = new Date(date).toISOString();

  date.setMonth(date.getMonth() - 1);
  const newDate10 = new Date(date).toISOString();
  date.setMonth(date.getMonth() - 1);
  const newDate11 = new Date(date).toISOString();

  expect(checkData).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        date: newDate,
        stats: expect.objectContaining({
          id: experimentId,
          users: 1,
          groups: 0,
          usersExcluded: 1,
          groupsExcluded: 0,
        }),
      }),
      expect.objectContaining({
        date: newDate1,
        stats: expect.objectContaining({
          id: experimentId,
          users: 0,
          groups: 0,
          usersExcluded: 1,
          groupsExcluded: 0,
        }),
      }),
      expect.objectContaining({
        date: newDate2,
        stats: expect.objectContaining({
          id: experimentId,
          users: 0,
          groups: 0,
          usersExcluded: 1,
          groupsExcluded: 0,
        }),
      }),
      expect.objectContaining({
        date: newDate3,
        stats: expect.objectContaining({
          id: experimentId,
          users: 0,
          groups: 0,
          usersExcluded: 1,
          groupsExcluded: 0,
        }),
      }),
      expect.objectContaining({
        date: newDate4,
        stats: expect.objectContaining({
          id: experimentId,
          users: 0,
          groups: 0,
          usersExcluded: 1,
          groupsExcluded: 0,
        }),
      }),
      expect.objectContaining({
        date: newDate5,
        stats: expect.objectContaining({
          id: experimentId,
          users: 0,
          groups: 0,
          usersExcluded: 1,
          groupsExcluded: 0,
        }),
      }),
      expect.objectContaining({
        date: newDate6,
        stats: expect.objectContaining({
          id: experimentId,
          users: 0,
          groups: 0,
          usersExcluded: 1,
          groupsExcluded: 0,
        }),
      }),
      expect.objectContaining({
        date: newDate7,
        stats: expect.objectContaining({
          id: experimentId,
          users: 0,
          groups: 0,
          usersExcluded: 1,
          groupsExcluded: 0,
        }),
      }),
      expect.objectContaining({
        date: newDate8,
        stats: expect.objectContaining({
          id: experimentId,
          users: 0,
          groups: 0,
          usersExcluded: 1,
          groupsExcluded: 0,
        }),
      }),
      expect.objectContaining({
        date: newDate9,
        stats: expect.objectContaining({
          id: experimentId,
          users: 0,
          groups: 0,
          usersExcluded: 1,
          groupsExcluded: 0,
        }),
      }),
      expect.objectContaining({
        date: newDate10,
        stats: expect.objectContaining({
          id: experimentId,
          users: 0,
          groups: 0,
          usersExcluded: 1,
          groupsExcluded: 0,
        }),
      }),
      expect.objectContaining({
        date: newDate11,
        stats: expect.objectContaining({
          id: experimentId,
          users: 0,
          groups: 0,
          usersExcluded: 1,
          groupsExcluded: 0,
        }),
      }),
    ])
  );
}
