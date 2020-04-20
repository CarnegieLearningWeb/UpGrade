import { selectAll } from './users.reducer';
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { UserState, State } from './users.model';

export const selectUsersState = createFeatureSelector<
  State,
  UserState
>('users');

export const selectAllUsers = createSelector(
  selectUsersState,
  selectAll
);

export const selectIsUsersLoading = createSelector(
  selectUsersState,
  (state) => state.isUsersLoading
);
