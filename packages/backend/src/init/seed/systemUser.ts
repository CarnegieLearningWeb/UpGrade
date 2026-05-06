import { User } from '../../api/models/User';
import Container from 'typedi';
import { UserService } from '../../api/services/UserService';
import { env } from '../../env';
import { UpgradeLogger } from '../../lib/logger/UpgradeLogger';
import { SYSTEM_USER_EMAIL, DEV_USER_EMAIL, UserRole } from 'upgrade_types';

export const systemUserDoc = {
  email: SYSTEM_USER_EMAIL,
  firstName: 'System',
  lastName: 'User',
  role: UserRole.ADMIN,
  imageUrl: 'https://cdn1.iconfinder.com/data/icons/business-set-18/32/2.business-icons-final-19-512.png',
};

export const devUserDoc = {
  email: DEV_USER_EMAIL,
  firstName: 'Dev',
  lastName: 'User',
  role: UserRole.ADMIN,
  imageUrl: 'https://cdn1.iconfinder.com/data/icons/business-set-18/32/2.business-icons-final-19-512.png',
};

export async function CreateSystemUsers(): Promise<User> {
  const userService: UserService = Container.get(UserService);

  // Create default admin user in system
  if (env.initialization.adminUsers && env.initialization.adminUsers.length) {
    for (const adminUser of env.initialization.adminUsers) {
      await userService.upsertAdminUser(adminUser as any, new UpgradeLogger());
    }
  }
  // Create a dev user for testing purposes if GOOGLE_AUTH_TOKEN_REQUIRED is false
  if (!env.google.authTokenRequired) {
    await userService.upsertAdminUser(devUserDoc as any, new UpgradeLogger());
  }

  return userService.upsertAdminUser(systemUserDoc as any, new UpgradeLogger());
}
