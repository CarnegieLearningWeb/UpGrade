import { createSelector, createFeatureSelector } from '@ngrx/store';
import { State, AuthState } from './auth.models';

export const selectAuthState = createFeatureSelector<AuthState>('auth');

export const selectAuth = createSelector(selectAuthState, (state: AuthState) => state);

export const selectIsLoggedIn = createSelector(selectAuthState, (state: AuthState) => state.isLoggedIn);

export const selectIsAuthenticating = createSelector(selectAuthState, (state: AuthState) => state.isAuthenticating);

export const selectCurrentUser = createSelector(selectAuthState, (state: AuthState) => state.user);

export const selectRedirectUrl = createSelector(selectAuthState, (state: AuthState) =>
  state.redirectUrl ? state.redirectUrl : null
);

export const selectGoogleCredential = createSelector(selectAuthState, (state: AuthState) => state.googleCredential);
