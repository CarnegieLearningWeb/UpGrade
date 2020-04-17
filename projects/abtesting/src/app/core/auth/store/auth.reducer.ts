import { AuthState } from './auth.models';
import { createReducer, on, Action } from '@ngrx/store';
import * as authActions from './auth.actions';

export const initialState: AuthState = {
  isLoggedIn: false,
  isAuthenticating: false,
  user: null
};

const reducer = createReducer(
  initialState,
  on(
    authActions.actionLoginStart,
    (state => ({ ...state, isAuthenticating: true }))
  ),
  on(
    authActions.actionLoginSuccess,
    (state => ({ ...state, isAuthenticating: false, isLoggedIn: true }))
  ),
  on(
    authActions.actionLoginFailure,
    (state => ({ ...state, isAuthenticating: false }))
  ),
  on(
    authActions.actionSetIsLoggedIn,
    (state, { isLoggedIn }) => {
      return { ...state, isLoggedIn }
    }
  ),
  on(
    authActions.actionSetIsAuthenticating,
    (state, { isAuthenticating }) => {
      return { ...state, isAuthenticating }
    }
  ),
  on(
    authActions.actionSetUserInfoSuccess,
    (state, { user }) => ({ ...state, user })
  ),
  on(
    authActions.actionLogoutSuccess,
    (state => ({ ...state, user: null, isLoggedIn: false }))
  ),
  on(
    authActions.actionSetRedirectUrl,
    ((state, { redirectUrl }) => ({ ...state, redirectUrl }))
  )
);

export function authReducer(
  state: AuthState | undefined,
  action: Action
): AuthState {
  return reducer(state, action);
}
