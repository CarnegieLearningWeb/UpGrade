import { RolePermissions } from 'upgrade_types';
import { AppState } from '../../core.module';
import { User } from '../../users/store/users.model';

export type UserPermission = RolePermissions;

export interface AuthState {
  isLoggedIn: boolean;
  isAuthenticating: boolean;
  redirectUrl: string;
  user: User;
  googleCredential: string;
}

export interface State extends AppState {
  auth: AuthState;
}
