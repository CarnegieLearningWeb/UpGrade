import { EntityState } from '@ngrx/entity';
import { AppState } from '../../core.state';
import { UserRole } from 'upgrade_types';

export { UserRole };

export interface UpdateUser {
  email: string;
  role: UserRole;
}

export interface User {
  createdAt: string;
  updatedAt: string;
  versionNumber: string;
  firstName: string;
  lastName: string;
  imageUrl: string;
  email: string;
  token?: string;
  role: UserRole;
}

export interface UserState extends EntityState<User> {
  isUsersLoading: boolean;
}

export interface State extends AppState {
  users: UserState;
}
