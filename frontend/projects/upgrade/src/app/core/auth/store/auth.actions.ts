import { Action, createAction, props } from '@ngrx/store';
import { User } from '../../users/store/users.model';

export const actionLoginStart = createAction('[Auth] Login Start');

export const actionLoginSuccess = createAction('[Auth] Login Success');

export const actionLoginFailure = createAction('[Auth] Login Failure');

export const actionSetIsLoggedIn = createAction('[Auth] Set IsLoggedIn', props<{ isLoggedIn: boolean }>());

export const actionSetIsAuthenticating = createAction(
  '[Auth] Set isAuthenticating',
  props<{ isAuthenticating: boolean }>()
);

export const actionSetUserInfo = createAction('[Auth] Set User Information', props<{ user: any }>());

export const actionSetUserInfoSuccess = createAction('[Auth] Set User Information Success', props<{ user: User }>());

export const actionSetUserInfoFailed = createAction('[Auth] Set User Info Failed');

export const actionLogoutStart = createAction('[Auth] Logout Start');

export const actionLogoutSuccess = createAction('[Auth] Logout Success');

export const actionSetRedirectUrl = createAction('[Auth] Set Redirect Url', props<{ redirectUrl: string }>());

export const actionSetUserInfoWithEmail = createAction(
  '[Auth] Set User Info Via Email',
  props<{ user: User; actions: Action[] }>()
);

export const actionSetGoogleCredential = createAction(
  '[Auth] Set Google Credential',
  props<{ googleCredential: string }>()
);
