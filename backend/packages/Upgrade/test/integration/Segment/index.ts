import TestCase1 from './SegmentCreate';
import TestCase2 from './SegmentDelete';
import TestCase3 from './SegmentUpdate';
import TestCase4 from './SegmentMemberUserEnrollment';
import TestCase5 from './SegmentMemberGroupEnrollment';
import TestCase6 from './SubSegmentEnrollment';
import { ExperimentUserService } from '../../../src/api/services/ExperimentUserService';
import { CheckService } from '../../../src/api/services/CheckService';
import { experimentUsers } from '../mockData/experimentUsers/index';
import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';
import { Container } from 'typedi';

const initialChecks = async () => {
  const userService = Container.get<ExperimentUserService>(ExperimentUserService);
  const checkService = Container.get<CheckService>(CheckService);

  // check all the tables are empty
  const users = await userService.find(new UpgradeLogger());
  expect(users.length).toEqual(0);

  const monitoredPoints = await checkService.getAllMarkedExperimentPoints();
  expect(monitoredPoints.length).toEqual(0);

  const groupAssignments = await checkService.getAllGroupAssignments();
  expect(groupAssignments.length).toEqual(0);

  const groupExclusions = await checkService.getAllGroupExclusions();
  expect(groupExclusions.length).toEqual(0);

  const individualAssignments = await checkService.getAllIndividualAssignment();
  expect(individualAssignments.length).toEqual(0);

  const individualExclusions = await checkService.getAllIndividualExclusion();
  expect(individualExclusions.length).toEqual(0);

  // create users over here
  await userService.create(experimentUsers as any, new UpgradeLogger());

  // get all user here
  const userList = await userService.find(new UpgradeLogger());
  expect(userList.length).toBe(experimentUsers.length);
  experimentUsers.map((user) => {
    expect(userList).toContainEqual(user);
  });
};

export const SegmentCreate = async () => {
  await initialChecks();
  await TestCase1();
};

export const SegmentDelete = async () => {
  await initialChecks();
  await TestCase2();
};

export const SegmentUpdate = async () => {
  await initialChecks();
  await TestCase3();
};

export const SegmentMemberUserEnrollment = async () => {
  await initialChecks();
  await TestCase4();
};

export const SegmentMemberGroupEnrollment = async () => {
  await initialChecks();
  await TestCase5();
};

export const SubSegmentEnrollment = async () => {
  await initialChecks();
  await TestCase6();
};
