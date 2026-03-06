import { Container } from 'typedi';
import { ExperimentUserService } from '../../../src/api/services/ExperimentUserService';
import TestCase1 from './Scenario1';
import TestCase2 from './Scenario2';
import TestCase3 from './Scenario3';
import TestCase4 from './Scenario4';
import TestCase5 from './Scenario5';
import TestCase6 from './Scenario6';
import TestCase13 from './Scenario8';
import TestCase14 from './Scenario9';
import TestCase15 from './Scenario10';
import TestCase7 from './PreviewScenario1';
import TestCase8 from './PreviewScenario2';
import TestCase9 from './PreviewScenario3';
import TestCase10 from './PreviewScenario4';
import TestCase11 from './PreviewScenario5';
import TestCase16 from './PreviewForcedAssigned';
import RevertToDefaultTestCase from './RevertToDefault';
import RevertToConditionTestCase from './RevertToCondition';
import { CheckService } from '../../../src/api/services/CheckService';
import { experimentUsers } from '../mockData/experimentUsers/index';
import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';

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

export const Scenario1 = async () => {
  await initialChecks();
  await TestCase1();
};

export const PreviewScenario1 = async () => {
  await initialChecks();
  await TestCase7();
};

export const Scenario2 = async () => {
  await initialChecks();
  await TestCase2();
};

export const PreviewScenario2 = async () => {
  await initialChecks();
  await TestCase8();
};

export const Scenario3 = async () => {
  await initialChecks();
  await TestCase3();
};

export const PreviewScenario3 = async () => {
  await initialChecks();
  await TestCase9();
};

export const Scenario4 = async () => {
  await initialChecks();
  await TestCase4();
};

export const PreviewScenario4 = async () => {
  await initialChecks();
  await TestCase10();
};

export const Scenario5 = async () => {
  await initialChecks();
  await TestCase5();
};

export const PreviewScenario5 = async () => {
  await initialChecks();
  await TestCase11();
};

export const Scenario6 = async () => {
  await initialChecks();
  await TestCase6();
};

export const Scenario8 = async () => {
  await initialChecks();
  await TestCase13();
};

export const Scenario9 = async () => {
  await initialChecks();
  await TestCase14();
};

export const Scenario10 = async () => {
  await initialChecks();
  await TestCase15();
};

export const RevertToDefault = async () => {
  await initialChecks();
  await RevertToDefaultTestCase();
};

export const RevertToCondition = async () => {
  await initialChecks();
  await RevertToConditionTestCase();
};

export const PreviewForcedAssigned = async () => {
  await initialChecks();
  await TestCase16();
};
