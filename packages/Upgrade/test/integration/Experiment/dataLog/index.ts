import CreateLogTestCase from './CreateLog';
import Container from 'typedi';
import { ExperimentUserService } from '../../../../src/api/services/ExperimentUserService';
import { experimentUsers } from '../../mockData/experimentUsers/index';

const initialChecks = async () => {
  const userService = Container.get<ExperimentUserService>(ExperimentUserService);

  // create users over here
  await userService.create(experimentUsers as any);

  // get all user here
  const userList = await userService.find();
  expect(userList.length).toBe(experimentUsers.length);
  experimentUsers.map((user) => {
    expect(userList).toContainEqual(user);
  });
};

export const CreateLog = async () => {
  await initialChecks();
  await CreateLogTestCase();
};
