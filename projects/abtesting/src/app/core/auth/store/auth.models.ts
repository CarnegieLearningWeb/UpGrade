import { AppState } from '../../core.module';

export interface User {
  name: string;
  imageUrl: string;
  email: string
}

export interface AuthState {
  isLoggedIn: boolean;
  isAuthenticating: boolean;
  user: User
}

export interface State extends AppState {
  auth: AuthState;
}
