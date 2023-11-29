import { selectAll } from './users.reducer';
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { UserState, State } from './users.model';

export const selectUsersState = createFeatureSelector<UserState>('users');

export const selectAllUsers = createSelector(selectUsersState, selectAll);

export const selectIsUsersLoading = createSelector(selectUsersState, (state) => state.isUsersLoading);

export const selectSkipUsers = createSelector(selectUsersState, (state) => state.skipUsers);

export const selectTotalUsers = createSelector(selectUsersState, (state) => state.totalUsers);

export const selectSearchKey = createSelector(selectUsersState, (state) => state.searchKey);

export const selectSearchString = createSelector(selectUsersState, (state) => state.searchString);

export const selectSortKey = createSelector(selectUsersState, (state) => state.sortKey);

export const selectSortAs = createSelector(selectUsersState, (state) => state.sortAs);
