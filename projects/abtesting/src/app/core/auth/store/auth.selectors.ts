import { createSelector, createFeatureSelector } from '@ngrx/store';
import { State, AuthState } from './auth.models';

export const selectAuthState = createFeatureSelector<
State,
AuthState
>('auth');

export const selectAuth = createSelector(
  selectAuthState,
  (state: AuthState) => state
);

export const selectIsAuthenticated = createSelector(
  selectAuthState,
  (state: AuthState) => state.isAuthenticated
);
