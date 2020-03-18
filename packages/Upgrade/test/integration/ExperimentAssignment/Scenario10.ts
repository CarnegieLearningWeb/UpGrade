import { Container } from 'typedi';
import { groupAssignmentWithExperimentConsistencyExperimentSwitchAfterAssignment } from '../mockData/experiment';
import { ExperimentService } from '../../../src/api/services/ExperimentService';
import { EXPERIMENT_STATE } from 'ees_types';
import { Logger as WinstonLogger } from '../../../src/lib/logger';
import { getAllExperimentCondition, markExperimentPoint } from '../utils';
import { UserService } from '../../../src/api/services/UserService';
import { systemUser } from '../mockData/user/index';
import { ExperimentUserService } from '../../../src/api/services/ExperimentUserService';
import { experimentUsers } from '../mockData/experimentUsers/index';
import {
  checkMarkExperimentPointForUser,
  checkExperimentAssignedIsNotDefault,
  checkExperimentAssignedIsDefault,
} from '../utils/index';

export default async function testCase(): Promise<void> {
  const logger = new WinstonLogger(__filename);
  const experimentService = Container.get<ExperimentService>(ExperimentService);
  const experimentUserService = Container.get<ExperimentUserService>(ExperimentUserService);
  const userService = Container.get<UserService>(UserService);

  // creating new user
  const user = await userService.create(systemUser as any);

  // experiment object
  const experimentObject = groupAssignmentWithExperimentConsistencyExperimentSwitchAfterAssignment;

  const experimentName = experimentObject.partitions[0].name;
  const experimentPoint = experimentObject.partitions[0].point;

  // ===================     set user groups for user 1
  await experimentUserService.updateGroupMembership(experimentUsers[0].id, {
    teacher: ['1'],
    class: ['1'],
  });
  await experimentUserService.updateWorkingGroup(experimentUsers[0].id, {
    teacher: '1',
    class: '1',
  });
  let experimentUser = await experimentUserService.find();
  let objectToCheck = {
    ...experimentUsers[0],
    group: {
      teacher: ['1'],
      class: ['1'],
    },
    workingGroup: {
      teacher: '1',
      class: '1',
    },
  };
  delete objectToCheck.versionNumber;
  delete objectToCheck.createdAt;
  delete objectToCheck.updatedAt;

  expect(experimentUser).toEqual(expect.arrayContaining([expect.objectContaining(objectToCheck)]));

  // ===================     set user groups for user 2
  await experimentUserService.updateGroupMembership(experimentUsers[1].id, {
    teacher: ['2'],
    class: ['2'],
  });
  await experimentUserService.updateWorkingGroup(experimentUsers[1].id, {
    teacher: '2',
    class: '2',
  });
  experimentUser = await experimentUserService.find();
  objectToCheck = {
    ...experimentUsers[1],
    group: {
      teacher: ['2'],
      class: ['2'],
    },
    workingGroup: {
      teacher: '2',
      class: '2',
    },
  };
  delete objectToCheck.versionNumber;
  delete objectToCheck.createdAt;
  delete objectToCheck.updatedAt;

  expect(experimentUser).toEqual(expect.arrayContaining([expect.objectContaining(objectToCheck)]));

  // ===================     set user groups for user 3
  await experimentUserService.updateGroupMembership(experimentUsers[2].id, {
    teacher: ['2'],
    class: ['2'],
  });
  await experimentUserService.updateWorkingGroup(experimentUsers[2].id, {
    teacher: '2',
    class: '2',
  });
  experimentUser = await experimentUserService.find();
  objectToCheck = {
    ...experimentUsers[2],
    group: {
      teacher: ['2'],
      class: ['2'],
    },
    workingGroup: {
      teacher: '2',
      class: '2',
    },
  };
  delete objectToCheck.versionNumber;
  delete objectToCheck.createdAt;
  delete objectToCheck.updatedAt;

  expect(experimentUser).toEqual(expect.arrayContaining([expect.objectContaining(objectToCheck)]));

  // ===================     set user groups for user 4
  await experimentUserService.updateGroupMembership(experimentUsers[3].id, {
    teacher: ['1'],
    class: ['1'],
  });
  await experimentUserService.updateWorkingGroup(experimentUsers[3].id, {
    teacher: '1',
    class: '1',
  });
  experimentUser = await experimentUserService.find();
  objectToCheck = {
    ...experimentUsers[3],
    group: {
      teacher: ['1'],
      class: ['1'],
    },
    workingGroup: {
      teacher: '1',
      class: '1',
    },
  };
  delete objectToCheck.versionNumber;
  delete objectToCheck.createdAt;
  delete objectToCheck.updatedAt;

  expect(experimentUser).toEqual(expect.arrayContaining([expect.objectContaining(objectToCheck)]));

  // ===============  create experiment
  await experimentService.create(experimentObject as any, user);
  let experiments = await experimentService.find();
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

  // get all experiment condition for user 1
  let experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[0].id);
  expect(experimentConditionAssignments).toHaveLength(0);

  let markedExperimentPoint = await markExperimentPoint(experimentUsers[0].id, experimentName, experimentPoint);
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[0].id, experimentName, experimentPoint);

  // change experiment status to Enrolling
  const experimentId = experiments[0].id;
  await experimentService.updateState(experimentId, EXPERIMENT_STATE.ENROLLING, user);

  // fetch experiment
  experiments = await experimentService.find();
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

  // get all experiment condition for user 1
  const experimentConditionAssignmentsForUser1Old = await getAllExperimentCondition(experimentUsers[0].id);
  checkExperimentAssignedIsNotDefault(experimentConditionAssignmentsForUser1Old, experimentName, experimentPoint);

  markedExperimentPoint = await markExperimentPoint(experimentUsers[0].id, experimentName, experimentPoint);
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[0].id, experimentName, experimentPoint);

  // get all experiment condition for user 2
  const experimentConditionAssignmentForUser2 = await getAllExperimentCondition(experimentUsers[1].id);
  checkExperimentAssignedIsNotDefault(experimentConditionAssignmentForUser2, experimentName, experimentPoint);

  markedExperimentPoint = await markExperimentPoint(experimentUsers[1].id, experimentName, experimentPoint);
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[1].id, experimentName, experimentPoint);

  // update groupMembership for user1
  await experimentUserService.updateGroupMembership(experimentUsers[0].id, {
    teacher: ['2'],
    class: ['2'],
  });

  // updating working group for user1
  await experimentUserService.updateWorkingGroup(experimentUsers[0].id, {
    teacher: '2',
    class: '2',
  });
  const experimentUser1 = await experimentUserService.find();
  const experimentObjectToCheck = {
    ...experimentUsers[0],
    group: {
      teacher: ['2'],
      class: ['2'],
    },
    workingGroup: {
      teacher: '2',
      class: '2',
    },
  };
  delete experimentObjectToCheck.versionNumber;
  delete experimentObjectToCheck.createdAt;
  delete experimentObjectToCheck.updatedAt;

  expect(experimentUser1).toEqual(expect.arrayContaining([expect.objectContaining(experimentObjectToCheck)]));

  // get all experiment condition for user1
  const experimentConditionAssignmentForUser1 = await getAllExperimentCondition(experimentUsers[0].id);
  checkExperimentAssignedIsNotDefault(experimentConditionAssignmentForUser1, experimentName, experimentPoint);

  experimentConditionAssignmentForUser2.map(experimentCondition => {
    expect(experimentConditionAssignmentForUser1).toEqual(
      expect.arrayContaining([expect.objectContaining(experimentCondition)])
    );
  });

  markedExperimentPoint = await markExperimentPoint(experimentUsers[0].id, experimentName, experimentPoint);
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[0].id, experimentName, experimentPoint);

  // get all experiment condition for user 3
  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[2].id);
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName, experimentPoint);

  experimentConditionAssignments.map(experimentCondition => {
    expect(experimentConditionAssignmentForUser2).toEqual(
      expect.arrayContaining([expect.objectContaining(experimentCondition)])
    );
  });

  // mark experiment point for user 3
  markedExperimentPoint = await markExperimentPoint(experimentUsers[2].id, experimentName, experimentPoint);
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[2].id, experimentName, experimentPoint);

  // change experiment status to complete
  await experimentService.updateState(experimentId, EXPERIMENT_STATE.ENROLLMENT_COMPLETE, user);

  // fetch experiment
  experiments = await experimentService.find();
  expect(experiments).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        name: experimentObject.name,
        state: EXPERIMENT_STATE.ENROLLMENT_COMPLETE,
        postExperimentRule: experimentObject.postExperimentRule,
        assignmentUnit: experimentObject.assignmentUnit,
        consistencyRule: experimentObject.consistencyRule,
      }),
    ])
  );

  // get all experiment condition for user 1
  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[0].id);
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName, experimentPoint);

  experimentConditionAssignmentForUser2.map(experimentCondition => {
    expect(experimentConditionAssignments).toEqual(
      expect.arrayContaining([expect.objectContaining(experimentCondition)])
    );
  });

  // mark experiment point for user 1
  markedExperimentPoint = await markExperimentPoint(experimentUsers[0].id, experimentName, experimentPoint);
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[0].id, experimentName, experimentPoint);

  // get all experiment condition for user 2
  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[1].id);
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName, experimentPoint);

  experimentConditionAssignmentForUser2.map(experimentCondition => {
    expect(experimentConditionAssignments).toEqual(
      expect.arrayContaining([expect.objectContaining(experimentCondition)])
    );
  });

  // mark experiment point for user 2
  markedExperimentPoint = await markExperimentPoint(experimentUsers[1].id, experimentName, experimentPoint);
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[1].id, experimentName, experimentPoint);

  // get all experiment condition for user 3
  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[2].id);
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName, experimentPoint);

  experimentConditionAssignmentForUser2.map(experimentCondition => {
    expect(experimentConditionAssignments).toEqual(
      expect.arrayContaining([expect.objectContaining(experimentCondition)])
    );
  });

  // mark experiment point for user 3
  markedExperimentPoint = await markExperimentPoint(experimentUsers[2].id, experimentName, experimentPoint);
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[2].id, experimentName, experimentPoint);

  // get all experiment condition for user 4
  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[3].id);
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName, experimentPoint);

  experimentConditionAssignmentsForUser1Old.map(experimentCondition => {
    expect(experimentConditionAssignments).toEqual(
      expect.arrayContaining([expect.objectContaining(experimentCondition)])
    );
  });

  // mark experiment point for user 4
  markedExperimentPoint = await markExperimentPoint(experimentUsers[3].id, experimentName, experimentPoint);
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[3].id, experimentName, experimentPoint);
}
