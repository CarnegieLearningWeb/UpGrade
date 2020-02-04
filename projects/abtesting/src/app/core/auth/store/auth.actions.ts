import { createAction, props } from '@ngrx/store';
import { User } from './auth.models';

export const actionInitializeGapi = createAction('[Auth] Initialize Gapi');

export const actionBindAttachHandlerWithButton = createAction(
  '[Auth] Bind Google Sign In Attach Handler with Button',
  props<{ element: any }>()
);

export const actionLoginStart = createAction('[Auth] Login Start');

export const actionLoginSuccess = createAction('[Auth] Login Success');

export const actionLoginFailure = createAction('[Auth] Login Failure');

export const actionSetIsLoggedIn = createAction(
  '[Auth] Set IsLoggedIn',
  props<{ isLoggedIn: boolean }>()
);

export const actionSetIsAuthenticating = createAction(
  '[Auth] Set isAuthenticating',
  props<{ isAuthenticating: boolean }>()
);

export const actionSetUserInfo = createAction(
  '[Auth] Set User Information',
  props<{ user: User }>()
);

export const actionLogoutStart = createAction('[Auth] Logout Start');

export const actionLogoutSuccess = createAction('[Auth] Logout Success');

export const actionLogoutFailure = createAction('[Auth] Logout Failure');

export const actionSetRedirectUrl = createAction(
  '[Auth] Set Redirect Url',
  props<{ redirectUrl: string }>()
);
