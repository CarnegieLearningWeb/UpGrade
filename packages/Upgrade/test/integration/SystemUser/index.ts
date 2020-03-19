import { UserService } from '../../../src/api/services/UserService';
import Container from 'typedi';
import { systemUserDoc } from '../../../src/init/seed/systemUser';

export const SystemUserCreated = async () => {
  const experimentService = Container.get<UserService>(UserService);
  const users = await experimentService.findAll();

  expect(users).toEqual(expect.arrayContaining([expect.objectContaining(systemUserDoc)]));
};
