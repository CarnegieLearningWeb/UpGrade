import { User } from '../../api/models/User';
import Container from 'typedi';
import { UserService } from '../../api/services/UserService';

export const systemUserDoc = {
  id: 'systemUser',
  email: 'system@gmail.com',
  firstName: 'System',
  lastName: '',
  imageUrl: 'https://cdn1.iconfinder.com/data/icons/business-set-18/32/2.business-icons-final-19-512.png',
};

export function CreateSystemUser(): Promise<User> {
  const userService: UserService = Container.get(UserService);
  return userService.create(systemUserDoc as any);
}
