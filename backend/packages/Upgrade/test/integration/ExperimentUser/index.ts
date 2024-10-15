import { Container } from 'typedi';
import { ExperimentUserService } from '../../../src/api/services/ExperimentUserService';
import { CheckService } from '../../../src/api/services/CheckService';
import TestCase1 from './NoExperimentUserOnAssignment';
import TestCase2 from './WorkingGroupChangeTest1';
import TestCase3 from './WorkingGroupChangeTest2';
import TestCase4 from './Scenario1A';
import TestCase5 from './Scenario1B';
import TestCase6 from './Scenario1C';
import TestCase7 from './Scenario2A';
import TestCase8 from './Scenario2B';
import TestCase9 from './Scenario2C';
import TestCase10 from './Scenario3A';
import TestCase11 from './Scenario3B';
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
};

export const NoExperimentUserOnAssignment = async () => {
  await initialChecks();
  await TestCase1();
};

export const IndividualConsistency = async () => {
  await initialChecks();
  await TestCase2();
};

export const GroupConsistency = async () => {
  await initialChecks();
  await TestCase3();
};

export const Scenario1A = async () => {
  await initialChecks();
  await TestCase4();
};

export const Scenario1B = async () => {
  await initialChecks();
  await TestCase5();
};

export const Scenario1C = async () => {
  await initialChecks();
  await TestCase6();
};

export const Scenario2A = async () => {
  await initialChecks();
  await TestCase7();
};

export const Scenario2B = async () => {
  await initialChecks();
  await TestCase8();
};

export const Scenario2C = async () => {
  await initialChecks();
  await TestCase9();
};

export const Scenario3A = async () => {
  await initialChecks();
  await TestCase10();
};

export const Scenario3B = async () => {
  await initialChecks();
  await TestCase11();
};
