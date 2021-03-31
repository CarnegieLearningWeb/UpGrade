import { AppState } from '../../core.module';
import { User } from '../../users/store/users.model';

interface CRUD {
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
}

export interface UserPermission {
  experiments: CRUD;
  users: CRUD;
  logs: CRUD;
  manageRoles: CRUD,
  featureFlags: CRUD,
  metrics: CRUD,
}

export interface AuthState {
  isLoggedIn: boolean;
  isAuthenticating: boolean;
  redirectUrl?: string;
  user: User
}

export interface State extends AppState {
  auth: AuthState;
}
