import { createAction, props } from '@ngrx/store';

export const actionFetchExcludedUsers = createAction(
  '[Experiment Users] Fetch Excluded Users'
);

export const actionFetchExcludedUsersSuccess = createAction(
  '[Experiment Users] Fetch Excluded Users Success',
  props<{ data: any }>()
);

export const actionFetchExcludedUsersFailure = createAction(
  '[Experiment Users] Fetch Excluded Users Failure',
);

export const actionFetchExcludedGroups = createAction(
  '[Experiment Users] Fetch Excluded Groups'
);

export const actionFetchExcludedGroupsSuccess = createAction(
  '[Experiment Users] Fetch Excluded Groups Success',
  props<{ data: any }>()
);

export const actionFetchExcludedGroupsFailure = createAction(
  '[Experiment Users] Fetch Excluded Groups Failure',
);

export const actionExcludeUser = createAction(
  '[Experiment Users] Exclude User',
  props<{ id: string }>()
);

export const actionExcludeUserSuccess = createAction(
  '[Experiment Users] Exclude User Success',
  props<{ data: any }>()
);

export const actionExcludedUserFailure = createAction(
  '[Experiment Users] Exclude User Failure',
);

export const actionExcludeGroup = createAction(
  '[Experiment Users] Exclude Group',
  props<{ id: string, groupType: string }>()
);

export const actionExcludeGroupSuccess = createAction(
  '[Experiment Users] Exclude Group Success',
  props<{ data: any }>()
);

export const actionExcludedGroupFailure = createAction(
  '[Experiment Users] Exclude Group Failure',
);

