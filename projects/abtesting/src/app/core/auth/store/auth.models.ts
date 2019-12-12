import { AppState } from '../../core.module';

export interface AuthState {
  isAuthenticated: boolean;
}

export interface State extends AppState {
  auth: AuthState;
}
