import { Container } from 'typedi';
// import { Logger as WinstonLogger } from '../../../../src/lib/logger';
import { ExperimentService } from '../../../src/api/services/ExperimentService';
import { groupExperimentStats } from '../mockData/experiment/index';
import { AnalyticsService } from '../../../src/api/services/AnalyticsService';
import { getAllExperimentCondition, markExperimentPoint } from '../utils';
import {
  checkMarkExperimentPointForUser,
  checkExperimentAssignedIsNotDefault,
  checkExperimentAssignedIsNull,
} from '../utils/index';
import { EXPERIMENT_STATE } from 'upgrade_types';
import { UserService } from '../../../src/api/services/UserService';
import { systemUser } from '../mockData/user/index';
import { experimentUsers } from '../mockData/experimentUsers/index';
import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';

export default async function testCase(): Promise<void> {
  // const logger = new WinstonLogger(__filename);
  const experimentService = Container.get<ExperimentService>(ExperimentService);
  const analyticsService = Container.get<AnalyticsService>(AnalyticsService);
  const userService = Container.get<UserService>(UserService);

  // creating new user
  const user = await userService.upsertUser(systemUser as any, new UpgradeLogger());
  // experiment object
  const experimentObject = groupExperimentStats;

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

  // mark experiment point for exp1
  let markedExperimentPoint = await markExperimentPoint(
    experimentUsers[0].id,
    experimentName1,
    experimentPoint1,
    condition1,
    new UpgradeLogger()
  );
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
  await experimentService.updateState(experimentId, EXPERIMENT_STATE.ENROLLING, user, new UpgradeLogger());

  checkData = await analyticsService.getDetailEnrollment(experimentId);
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

  // user 2 logs in experiment
  // get all experiment condition for user 2
  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[1].id, new UpgradeLogger());
  checkExperimentAssignedIsNull(experimentConditionAssignments, experimentName1, experimentPoint1);
  checkExperimentAssignedIsNull(experimentConditionAssignments, experimentName2, experimentPoint2);

  // mark experiment point for exp2
  markedExperimentPoint = await markExperimentPoint(
    experimentUsers[1].id,
    experimentName2,
    experimentPoint2,
    condition2,
    new UpgradeLogger()
  );
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[1].id, experimentName2, experimentPoint2);
  // for exp1
  checkData = await analyticsService.getDetailEnrollment(experimentId);
  expect(checkData).toEqual(
    expect.objectContaining({
      users: 1,
      groups: 1,
      usersExcluded: 0,
      groupsExcluded: 0,
    })
  );

  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[2].id, new UpgradeLogger());
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName1, experimentPoint1);
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName2, experimentPoint2);

  // user 3: mark experiment point for exp1
  markedExperimentPoint = await markExperimentPoint(
    experimentUsers[2].id,
    experimentName1,
    experimentPoint1,
    condition1,
    new UpgradeLogger()
  );
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[2].id, experimentName1, experimentPoint1);
  // for exp1
  checkData = await analyticsService.getDetailEnrollment(experimentId);
  expect(checkData).toEqual(
    expect.objectContaining({
      users: 2,
      groups: 2,
      usersExcluded: 0,
      groupsExcluded: 0,
    })
  );

  // change experiment state to enrolling
  await experimentService.updateState(experimentId, EXPERIMENT_STATE.ENROLLMENT_COMPLETE, user, new UpgradeLogger());

  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[3].id, new UpgradeLogger());
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName1, experimentPoint1);
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName2, experimentPoint2);

  // user 4: mark experiment point for exp1
  markedExperimentPoint = await markExperimentPoint(
    experimentUsers[3].id,
    experimentName1,
    experimentPoint1,
    condition1,
    new UpgradeLogger()
  );
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[3].id, experimentName1, experimentPoint1);
  // for exp1
  checkData = await analyticsService.getDetailEnrollment(experimentId);
  expect(checkData).toEqual(
    expect.objectContaining({
      users: 2,
      groups: 2,
      usersExcluded: 0,
      groupsExcluded: 0,
    })
  );
}
