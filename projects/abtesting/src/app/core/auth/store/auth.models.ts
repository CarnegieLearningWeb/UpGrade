import { AppState } from '../../core.module';

export interface User {
  firstName: string;
  lastName: string;
  imageUrl: string;
  email: string;
  token: string;
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
