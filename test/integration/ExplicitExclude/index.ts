import IndExclude from './IndividualExclude';
import GrpExclude from './GroupExclude';
import { Container } from 'typedi';
import { ExperimentUserService } from '../../../src/api/services/ExperimentUserService';
import { CheckService } from '../../../src/api/services/CheckService';
import { multipleUsers } from '../mockData/users/index';

const initialCheck = async () => {
  const userService = Container.get<ExperimentUserService>(ExperimentUserService);
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

export const IndividualExclude = async () => {
  await initialCheck();
  await IndExclude();
};

export const GroupExclude = async () => {
  await initialCheck();
  await GrpExclude();
};
