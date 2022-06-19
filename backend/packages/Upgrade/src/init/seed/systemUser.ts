import { User } from '../../api/models/User';
import Container from 'typedi';
import { UserService } from '../../api/services/UserService';
import { env } from '../../env';
import { UpgradeLogger } from '../../lib/logger/UpgradeLogger';

export const systemUserDoc = {
  email: 'system@gmail.com',
  firstName: 'System',
  lastName: '',
  role: 'admin',
  imageUrl: 'https://cdn1.iconfinder.com/data/icons/business-set-18/32/2.business-icons-final-19-512.png',
};

export function CreateSystemUser(): Promise<User> {
  const userService: UserService = Container.get(UserService);

  // Create default admin user in system
  if (env.initialization.adminUsers && env.initialization.adminUsers.length) {
    env.initialization.adminUsers.forEach(async (adminUser) => {
      await userService.upsertAdminUser(adminUser as any, new UpgradeLogger());
    });
  }
  return userService.upsertAdminUser(systemUserDoc as any, new UpgradeLogger());
}
