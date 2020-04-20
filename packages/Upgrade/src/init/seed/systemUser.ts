import { User } from '../../api/models/User';
import Container from 'typedi';
import { UserService } from '../../api/services/UserService';
import { UserRole } from 'ees_types';
import * as config from '../../config.json';

export const systemUserDoc = {
  email: 'system@gmail.com',
  firstName: 'System',
  lastName: '',
  role: UserRole.READER,
  imageUrl: 'https://cdn1.iconfinder.com/data/icons/business-set-18/32/2.business-icons-final-19-512.png',
};

export function CreateSystemUser(): Promise<User> {
  const userService: UserService = Container.get(UserService);

  // Create default admin user in system
  if (config && config.adminUsers && config.adminUsers.length) {
    config.adminUsers.forEach(async (adminUser) => {
      await userService.create(adminUser as any);
    });
  }
  return userService.create(systemUserDoc as any);
}
