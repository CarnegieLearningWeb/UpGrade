import { Container } from 'typedi';
import { multipleUsers } from '../mockData/users';
import { UserService } from '../../../src/api/services/UserService';
import TestCase1 from './Scenario1';
import TestCase2 from './Scenario2';
import TestCase3 from './Scenario3';
import TestCase4 from './Scenario4';
import TestCase5 from './Scenario5';
import TestCase6 from './Scenario6';
import RevertToDefaultTestCase from './RevertToDefault';
import RevertToConditionTestCase from './RevertToCondition';
import { CheckService } from '../../../src/api/services/CheckService';

const initialChecks = async () => {
  const userService = Container.get<UserService>(UserService);
  const checkService = Container.get<CheckService>(CheckService);

  // check all the tables are empty
  const users = await userService.find();
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
  await userService.create(multipleUsers as any);

  // get all user here
  const userList = await userService.find();
  expect(userList.length).toBe(multipleUsers.length);
  multipleUsers.map(user => {
    expect(userList).toContainEqual(user);
  });
};

export const Scenario1 = async () => {
  await initialChecks();
  await TestCase1();
};

export const Scenario2 = async () => {
  await initialChecks();
  await TestCase2();
};

export const Scenario3 = async () => {
  await initialChecks();
  await TestCase3();
};

export const Scenario4 = async () => {
  await initialChecks();
  await TestCase4();
};

export const Scenario5 = async () => {
  await initialChecks();
  await TestCase5();
};

export const Scenario6 = async () => {
  await initialChecks();
  await TestCase6();
};

export const RevertToDefault = async () => {
  await initialChecks();
  await RevertToDefaultTestCase();
};

export const RevertToCondition = async () => {
  await initialChecks();
  await RevertToConditionTestCase();
};
