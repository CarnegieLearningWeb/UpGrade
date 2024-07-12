import { Container } from 'typedi';
import { ExperimentUserService } from '../../../src/api/services/ExperimentUserService';
import { CheckService } from '../../../src/api/services/CheckService';
import TestCase1 from './NoExperimentUserOnAssignment';
import TestCase2 from './WorkingGroupChangeTest1';
import TestCase3 from './WorkingGroupChangeTest2';
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
