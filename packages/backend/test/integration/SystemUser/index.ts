import { UserService } from '../../../src/api/services/UserService';
import Container from 'typedi';
import { systemUserDoc } from '../../../src/init/seed/systemUser';
import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';

export const SystemUserCreated = async () => {
  const userService = Container.get<UserService>(UserService);
  const users = await userService.find(new UpgradeLogger());

  expect(users).toEqual(expect.arrayContaining([expect.objectContaining(systemUserDoc)]));
};
