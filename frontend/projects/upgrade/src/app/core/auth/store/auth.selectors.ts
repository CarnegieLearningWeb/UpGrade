import { createSelector, createFeatureSelector } from '@ngrx/store';
import { AuthState } from './auth.models';
import { User, UserRole } from '../../users/store/users.model';

export const selectAuthState = createFeatureSelector<AuthState>('auth');

export const selectAuth = createSelector(selectAuthState, (state: AuthState) => state);

export const selectIsLoggedIn = createSelector(selectAuthState, (state: AuthState) => state.isLoggedIn);

export const selectIsAuthenticating = createSelector(selectAuthState, (state: AuthState) => state.isAuthenticating);

export const selectCurrentUser = createSelector(selectAuthState, (state: AuthState) => state.user);

export const selectUserIsAdmin = createSelector(selectCurrentUser, (user: User) => user.role === UserRole.ADMIN);

export const selectCurrentUserEmail = createSelector(selectAuthState, (state) => state.user?.email || '');

export const selectRedirectUrl = createSelector(selectAuthState, (state: AuthState) =>
  state.redirectUrl ? state.redirectUrl : null
);

export const selectGoogleCredential = createSelector(selectAuthState, (state: AuthState) => state.googleCredential);
