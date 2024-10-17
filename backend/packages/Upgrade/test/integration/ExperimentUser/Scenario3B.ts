import { Container } from 'typedi';
import { groupAssignmentWithIndividualConsistencyExperiment } from '../mockData/experiment';
import { ExperimentService } from '../../../src/api/services/ExperimentService';
import { UserService } from '../../../src/api/services/UserService';
import { AnalyticsService } from '../../../src/api/services/AnalyticsService';
import { systemUser } from '../mockData/user/index';
import {
  checkMarkExperimentPointForUser,
  getAllExperimentCondition,
  markExperimentPoint,
  updateExcludeIfReachedFlag,
} from '../utils';
import { experimentUsers } from '../mockData/experimentUsers/index';
import { ExperimentUserService } from '../../../src/api/services/ExperimentUserService';
import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';
import { EXPERIMENT_STATE } from 'upgrade_types';

/* Explanation:
A user1 in mark in an experiment with Group Assignment and Individual Consistency
Then we exclude a group from the experiment which user belongs
As the experiment was Individual Consistency, the user will not get excluded as already marked
As the experiment was Group Assignment, the group will be excluded

A new user from same group as user1 is created
On assign the user will not be assigned to the experiment as the group is excluded
*/
export default async function ExcludeGroupsB(): Promise<void> {
  const experimentService = Container.get<ExperimentService>(ExperimentService);
  const userService = Container.get<UserService>(UserService);
  const experimentUserService = Container.get<ExperimentUserService>(ExperimentUserService);
  const analyticsService = Container.get<AnalyticsService>(AnalyticsService);

  // creating new user
  const user = await userService.upsertUser(systemUser as any, new UpgradeLogger());

  // experiment object
  let experimentObject = groupAssignmentWithIndividualConsistencyExperiment;
  const experimentName = experimentObject.partitions[0].target;
  const experimentPoint = experimentObject.partitions[0].site;
  const condition = experimentObject.conditions[0].conditionCode;
  const experimentId = experimentObject.id;

  experimentObject.partitions = updateExcludeIfReachedFlag(experimentObject.partitions);

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

  // get experimentUser
  let updatedExperimentUser = experimentUsers[0];
  updatedExperimentUser = {
    ...updatedExperimentUser,
    group: {
      ...updatedExperimentUser.group,
      class: ['c1'],
    },
    workingGroup: {
      ...updatedExperimentUser.workingGroup,
      class: 'c1',
    },
  };

  await experimentUserService.create(updatedExperimentUser as any, new UpgradeLogger());

  // check experimentUser details
  const experimentUserDoc = await experimentUserService.getOriginalUserDoc(
    updatedExperimentUser.id,
    new UpgradeLogger()
  );
  const experimentUser = await experimentUserService.findOne(experimentUserDoc.id, new UpgradeLogger());
  const objectToCheck = {
    ...experimentUsers[0],
    group: {
      teacher: ['1'],
      class: ['c1'],
    },
    workingGroup: {
      teacher: '1',
      class: 'c1',
    },
  };
  delete objectToCheck.versionNumber;
  delete objectToCheck.createdAt;
  delete objectToCheck.updatedAt;
  delete experimentUser.versionNumber;
  delete experimentUser.createdAt;
  delete experimentUser.updatedAt;
  expect(experimentUser).toEqual(objectToCheck);

  // change experiment state to enrolling
  await experimentService.updateState(experimentId, EXPERIMENT_STATE.ENROLLING, user, new UpgradeLogger());

  // get all experiment condition for user
  let experimentConditionAssignment = await getAllExperimentCondition(experimentUser.id, new UpgradeLogger());
  expect(experimentConditionAssignment.length).toEqual(3); // 3 partitions

  // mark experiment for user
  const markedExperimentPoint = await markExperimentPoint(
    experimentUser.id,
    experimentName,
    experimentPoint,
    condition,
    new UpgradeLogger()
  );
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[0].id, experimentName, experimentPoint);

  // check stats
  let stats = await analyticsService.getDetailEnrollment(experimentId);
  expect(stats).toEqual(
    expect.objectContaining({
      users: 1,
      groups: 1,
      usersExcluded: 0,
      groupsExcluded: 0,
      id: experimentId,
    })
  );

  // update exclusion list of experiment
  experimentObject = {
    ...experimentObject,
    state: EXPERIMENT_STATE.ENROLLING,
    experimentSegmentExclusion: {
      ...experimentObject.experimentSegmentExclusion,
      segment: {
        ...experimentObject.experimentSegmentExclusion.segment,
        individualForSegment: [{ userId: 'student1' }],
      },
    },
  };
  await experimentService.update(experimentObject as any, user, new UpgradeLogger());

  // check stats
  stats = await analyticsService.getDetailEnrollment(experimentId);
  expect(stats).toEqual(
    expect.objectContaining({
      users: 0,
      groups: 0,
      usersExcluded: 0,
      groupsExcluded: 1,
      id: experimentId,
    })
  );

  const individualStats = await analyticsService.getEnrollments([experimentId]);
  expect(individualStats).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: experimentId,
        users: 0,
        groups: 0,
      }),
    ])
  );

  // get experimentUser2
  let updatedExperimentUser2 = experimentUsers[1];
  updatedExperimentUser2 = {
    ...updatedExperimentUser2,
    group: {
      ...updatedExperimentUser2.group,
      class: ['c2'],
    },
    workingGroup: {
      ...updatedExperimentUser2.workingGroup,
      class: 'c2',
    },
  };

  await experimentUserService.create(updatedExperimentUser2 as any, new UpgradeLogger());

  // get all experiment condition for user2
  experimentConditionAssignment = await getAllExperimentCondition(updatedExperimentUser2.id, new UpgradeLogger());
  expect(experimentConditionAssignment.length).toEqual(0);
}
