import { Container } from 'typedi';
// import { Logger as WinstonLogger } from '../../../../src/lib/logger';
import { ExperimentService } from '../../../src/api/services/ExperimentService';
import { individualExperimentStats } from '../mockData/experiment/index';
import { AnalyticsService } from '../../../src/api/services/AnalyticsService';
import { getAllExperimentCondition, markExperimentPoint } from '../utils';
import { checkMarkExperimentPointForUser, checkExperimentAssignedIsNotDefault } from '../utils/index';
import { EXPERIMENT_STATE } from 'upgrade_types';
import { UserService } from '../../../src/api/services/UserService';
import { systemUser } from '../mockData/user/index';
import { experimentUsers } from '../mockData/experimentUsers/index';
import { PreviewUserService } from '../../../src/api/services/PreviewUserService';
import { previewUsers } from '../mockData/previewUsers/index';

export default async function testCase(): Promise<void> {
  // const logger = new WinstonLogger(__filename);
  const experimentService = Container.get<ExperimentService>(ExperimentService);
  const analyticsService = Container.get<AnalyticsService>(AnalyticsService);
  const userService = Container.get<UserService>(UserService);
  const previewService = Container.get<PreviewUserService>(PreviewUserService);

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
  const condition1 = experimentObject.conditions[0].conditionCode;

  const experimentName2 = experimentObject.partitions[1].expId;
  const experimentPoint2 = experimentObject.partitions[1].expPoint;
  const condition2 = experimentObject.conditions[1].conditionCode;


  // get all experiment condition for user 1
  let experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[0].id);
  expect(experimentConditionAssignments).toHaveLength(0);

  // mark experiment point
  let markedExperimentPoint = await markExperimentPoint(experimentUsers[0].id, experimentName1, experimentPoint1, condition1);
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[0].id, experimentName1, experimentPoint1);

  let checkData = await analyticsService.getDetailEnrollment(experimentId);
  expect(checkData).toEqual(
    expect.objectContaining({
      id: experimentId,
      users: 0,
      groups: 0,
      usersExcluded: 0,
      groupsExcluded: 0,
      conditions: expect.arrayContaining([
        expect.objectContaining({
          id: experiments[0].conditions[0].id,
          users: 0,
          groups: 0,
          partitions: expect.arrayContaining([
            expect.objectContaining({
              id: experiments[0].partitions[0].id,
              users: 0,
              groups: 0,
            }),
            expect.objectContaining({
              id: experiments[0].partitions[1].id,
              users: 0,
              groups: 0,
            }),
            expect.objectContaining({
              id: experiments[0].partitions[2].id,
              users: 0,
              groups: 0,
            }),
          ]),
        }),
        expect.objectContaining({
          id: experiments[0].conditions[1].id,
          users: 0,
          groups: 0,
          partitions: expect.arrayContaining([
            expect.objectContaining({
              id: experiments[0].partitions[0].id,
              users: 0,
              groups: 0,
            }),
            expect.objectContaining({
              id: experiments[0].partitions[1].id,
              users: 0,
              groups: 0,
            }),
            expect.objectContaining({
              id: experiments[0].partitions[2].id,
              users: 0,
              groups: 0,
            }),
          ]),
        }),
      ]),
    })
  );

  // change experiment state to enrolling
  await experimentService.updateState(experimentId, EXPERIMENT_STATE.ENROLLING, user);

  checkData = await analyticsService.getDetailEnrollment(experimentId);
  expect(checkData).toEqual(
    expect.objectContaining({
      id: experimentId,
      users: 0,
      groups: 0,
      usersExcluded: 1,
      groupsExcluded: 0,
      conditions: expect.arrayContaining([
        expect.objectContaining({
          id: experiments[0].conditions[0].id,
          users: 0,
          groups: 0,
          partitions: expect.arrayContaining([
            expect.objectContaining({
              id: experiments[0].partitions[0].id,
              users: 0,
              groups: 0,
            }),
            expect.objectContaining({
              id: experiments[0].partitions[1].id,
              users: 0,
              groups: 0,
            }),
            expect.objectContaining({
              id: experiments[0].partitions[2].id,
              users: 0,
              groups: 0,
            }),
          ]),
        }),
        expect.objectContaining({
          id: experiments[0].conditions[1].id,
          users: 0,
          groups: 0,
          partitions: expect.arrayContaining([
            expect.objectContaining({
              id: experiments[0].partitions[0].id,
              users: 0,
              groups: 0,
            }),
            expect.objectContaining({
              id: experiments[0].partitions[1].id,
              users: 0,
              groups: 0,
            }),
            expect.objectContaining({
              id: experiments[0].partitions[2].id,
              users: 0,
              groups: 0,
            }),
          ]),
        }),
      ]),
    })
  );

  // user 3 logs in experiment
  // get all experiment condition for user 3
  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[1].id);
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName1, experimentPoint1);
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName2, experimentPoint2);

  // mark experiment point
  markedExperimentPoint = await markExperimentPoint(experimentUsers[1].id, experimentName2, experimentPoint2, condition2);
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[1].id, experimentName2, experimentPoint2);

  checkData = await analyticsService.getDetailEnrollment(experimentId);
  expect(checkData).toEqual(
    expect.objectContaining({
      users: 1,
      groups: 0,
      usersExcluded: 1,
      groupsExcluded: 0,
    })
  );

  // when preview user is assigned an experiment condition
  experimentConditionAssignments = await getAllExperimentCondition(previewUser.id);
  // because the user was excluded from the experiment
  expect(experimentConditionAssignments).toHaveLength(0);

  checkData = await analyticsService.getDetailEnrollment(experimentId);
  expect(checkData).toEqual(
    expect.objectContaining({
      users: 1,
      groups: 0,
      usersExcluded: 1,
      groupsExcluded: 0,
    })
  );

  markedExperimentPoint = await markExperimentPoint(previewUser.id, experimentName2, experimentPoint2, condition2);
  checkMarkExperimentPointForUser(markedExperimentPoint, previewUser.id, experimentName2, experimentPoint2);

  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[2].id);
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName1, experimentPoint1);
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName2, experimentPoint2);

  // mark experiment point
  markedExperimentPoint = await markExperimentPoint(experimentUsers[2].id, experimentName1, experimentPoint1, condition1);
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[2].id, experimentName1, experimentPoint1);

  checkData = await analyticsService.getDetailEnrollment(experimentId);
  expect(checkData).toEqual(
    expect.objectContaining({
      users: 2,
      groups: 0,
      usersExcluded: 1,
      groupsExcluded: 0,
    })
  );

  // change experiment state to enrolling
  await experimentService.updateState(experimentId, EXPERIMENT_STATE.ENROLLMENT_COMPLETE, user);

  // mark experiment point
  markedExperimentPoint = await markExperimentPoint(experimentUsers[3].id, experimentName1, experimentPoint1, condition1);
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[3].id, experimentName1, experimentPoint1);

  checkData = await analyticsService.getDetailEnrollment(experimentId);
  expect(checkData).toEqual(
    expect.objectContaining({
      users: 2,
      groups: 0,
      usersExcluded: 2,
      groupsExcluded: 0,
    })
  );
}