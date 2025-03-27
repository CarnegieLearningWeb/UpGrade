import { Container } from 'typedi';
import { groupAssignmentWithIndividualConsistencyExperiment } from '../mockData/experiment';
import { ExperimentService } from '../../../src/api/services/ExperimentService';
import { UserService } from '../../../src/api/services/UserService';
import { AnalyticsService } from '../../../src/api/services/AnalyticsService';
import { systemUser } from '../mockData/user/index';
import { checkMarkExperimentPointForUser, getAllExperimentCondition, markExperimentPoint, updateExcludeIfReachedFlag } from '../utils';
import { experimentUsers } from '../mockData/experimentUsers/index';
import { ExperimentUserService } from '../../../src/api/services/ExperimentUserService';
import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';
import { EXPERIMENT_STATE } from 'upgrade_types';

export default async function testCase(): Promise<void> {
  const experimentService = Container.get<ExperimentService>(ExperimentService);
  const userService = Container.get<UserService>(UserService);
  const experimentUserService = Container.get<ExperimentUserService>(ExperimentUserService);
  const analyticsService = Container.get<AnalyticsService>(AnalyticsService);

  // creating new user
  const user = await userService.upsertUser(systemUser as any, new UpgradeLogger());

  // experiment object
  const experimentObject = groupAssignmentWithIndividualConsistencyExperiment;
  const experimentName = experimentObject.partitions[0].target;
  const experimentPoint = experimentObject.partitions[0].site;
  const condition = experimentObject.conditions[0].conditionCode;
  const experimentId = experimentObject.id;

  experimentObject.partitions = updateExcludeIfReachedFlag(experimentObject.partitions);

  // create experiment
  await experimentService.create(experimentObject, user, new UpgradeLogger());
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

  // get experimentUser
  await experimentUserService.create(experimentUsers[0] as any, new UpgradeLogger());
  let experimentUserDoc = await experimentUserService.getOriginalUserDoc(experimentUsers[0].id, new UpgradeLogger());
  await experimentUserService.updateGroupMembership(
    experimentUsers[0].id,
    {
      teacher: ['1', '2'],
    },
    { logger: new UpgradeLogger(), userDoc: experimentUserDoc }
  );

  // check experimentUser details
  experimentUserDoc = await experimentUserService.getOriginalUserDoc(experimentUsers[0].id, new UpgradeLogger());
  const experimentUser = await experimentUserService.findOne(experimentUserDoc.id, new UpgradeLogger());
  const objectToCheck = {
    ...experimentUsers[0],
    group: {
      teacher: ['1', '2'],
    },
    workingGroup: {
      teacher: '1',
    },
  };
  delete objectToCheck.versionNumber;
  delete objectToCheck.createdAt;
  delete objectToCheck.updatedAt;
  delete experimentUser.versionNumber;
  delete experimentUser.createdAt;
  delete experimentUser.updatedAt;
  expect(experimentUser).toEqual(objectToCheck);

  // get all experiment condition for user
  const experimentConditionAssignment = await getAllExperimentCondition(experimentUser.id, new UpgradeLogger());
  expect(experimentConditionAssignment.length).toEqual(0);

  // mark experiment for user
  let markedExperimentPoint = await markExperimentPoint(
    experimentUser.id,
    experimentName,
    experimentPoint,
    condition,
    experimentId,
    new UpgradeLogger(),
  );
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[0].id, experimentName, experimentPoint);

  // change experiment state to enrolling
  await experimentService.updateState(experimentId, EXPERIMENT_STATE.ENROLLING, user, new UpgradeLogger());

  // mark experiment for user
  markedExperimentPoint = await markExperimentPoint(
    experimentUser.id,
    experimentName,
    experimentPoint,
    condition,
    experimentId,
    new UpgradeLogger()
  );
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[0].id, experimentName, experimentPoint);

  // check stats
  let stats = await analyticsService.getDetailEnrollment(experimentId);
  expect(stats).toEqual(
    expect.objectContaining({
      usersExcluded: 1,
      groupsExcluded: 0,
      id: experimentId,
    })
  );

  // update working group of user
  experimentUserDoc = await experimentUserService.getOriginalUserDoc(experimentUsers[0].id, new UpgradeLogger());
  await experimentUserService.updateWorkingGroup(
    experimentUsers[0].id,
    {
      teacher: '2',
    },
    { logger: new UpgradeLogger(), userDoc: experimentUserDoc }
  );

  // check stats
  stats = await analyticsService.getDetailEnrollment(experimentId);
  expect(stats).toEqual(
    expect.objectContaining({
      usersExcluded: 0,
      groupsExcluded: 0,
      id: experimentId,
    })
  );
}
