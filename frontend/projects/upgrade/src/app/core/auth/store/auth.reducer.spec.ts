import { Action } from '@ngrx/store';
import { authReducer, initialState } from './auth.reducer';
import * as AuthActions from './auth.actions';
import { UserRole } from '../../users/store/users.model';

describe('AuthReducer', () => {
  it('should not affect state if no action is recognized', () => {
    const previousState = { ...initialState };
    const testAction: Action = {
      type: 'test',
    };

    const newState = authReducer(previousState, testAction);

    expect(newState).toBe(previousState);
    expect(newState).toEqual(previousState);
  });

  it('should handle actionLoginStart by setting isAuthenticating to true', () => {
    const previousState = { ...initialState };
    previousState.isAuthenticating = false;
    const testAction = AuthActions.actionLoginStart();

    const newState = authReducer(previousState, testAction);

    expect(newState.isAuthenticating).toEqual(true);
  });

  it('should handle actionLoginSuccess by setting isAuthenticating to true', () => {
    const previousState = { ...initialState };
    previousState.isAuthenticating = true;
    previousState.isLoggedIn = false;
    const testAction = AuthActions.actionLoginSuccess();

    const newState = authReducer(previousState, testAction);

    expect(newState.isAuthenticating).toEqual(false);
    expect(newState.isLoggedIn).toEqual(true);
  });

  it('should handle actionLoginFailure by setting isAuthenticating to false', () => {
    const previousState = { ...initialState };
    previousState.isAuthenticating = true;
    const testAction = AuthActions.actionLoginFailure();

    const newState = authReducer(previousState, testAction);

    expect(newState.isAuthenticating).toEqual(false);
  });

  it('should handle actionSetIsLoggedIn by setting isLoggedIn', () => {
    const previousState = { ...initialState };
    previousState.isLoggedIn = true;
    const testAction = AuthActions.actionSetIsLoggedIn({ isLoggedIn: false });

    const newState = authReducer(previousState, testAction);

    expect(newState.isLoggedIn).toEqual(false);
  });

  it('should handle actionSetIsAuthenticating by setting isLoggedIn', () => {
    const previousState = { ...initialState };
    previousState.isAuthenticating = true;
    const testAction = AuthActions.actionSetIsAuthenticating({ isAuthenticating: false });

    const newState = authReducer(previousState, testAction);

    expect(newState.isAuthenticating).toEqual(false);
  });

  it('should handle actionSetUserInfo by setting user', () => {
    const previousState = { ...initialState };
    previousState.user = null;
    const user = {
      createdAt: '1234',
      updatedAt: '1234',
      versionNumber: '2',
      firstName: 'Johnny',
      lastName: 'Quest',
      imageUrl: 'www.jq.edu.gov.biz',
      email: 'email@test.com',
      role: UserRole.ADMIN,
    };
    const testAction = AuthActions.actionSetUserInfo({ user });

    const newState = authReducer(previousState, testAction);

    expect(newState.isAuthenticating).toEqual(false);
  });

  it('should handle actionSetUserInfoSuccess by setting user', () => {
    const previousState = { ...initialState };
    previousState.user = null;
    const user = {
      createdAt: '1234',
      updatedAt: '1234',
      versionNumber: '2',
      firstName: 'Johnny',
      lastName: 'Quest',
      imageUrl: 'www.jq.edu.gov.biz',
      email: 'email@test.com',
      role: UserRole.ADMIN,
    };
    const testAction = AuthActions.actionSetUserInfoSuccess({ user });

    const newState = authReducer(previousState, testAction);

    expect(newState.isAuthenticating).toEqual(false);
  });

  it('should handle actionSetIsAuthenticating by setting isLoggedIn', () => {
    const previousState = { ...initialState };
    const user = {
      createdAt: '1234',
      updatedAt: '1234',
      versionNumber: '2',
      firstName: 'Johnny',
      lastName: 'Quest',
      imageUrl: 'www.jq.edu.gov.biz',
      email: 'email@test.com',
      role: UserRole.ADMIN,
    };
    previousState.user = user;
    previousState.isLoggedIn = true;
    const testAction = AuthActions.actionLogoutSuccess();

    const newState = authReducer(previousState, testAction);

    expect(newState.user).toEqual(null);
    expect(newState.isLoggedIn).toEqual(false);
  });

  it('should handle actionSetIactionSetRedirectUrlsLoggedIn by setting isLoggedIn', () => {
    const previousState = { ...initialState };
    previousState.redirectUrl = '';
    const redirectUrl = 'test.net';
    const testAction = AuthActions.actionSetRedirectUrl({ redirectUrl });

    const newState = authReducer(previousState, testAction);

    expect(newState.redirectUrl).toEqual(redirectUrl);
  });
});
