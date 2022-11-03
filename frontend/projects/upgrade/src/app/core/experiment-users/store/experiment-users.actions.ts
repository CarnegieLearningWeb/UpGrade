import { createAction, props } from '@ngrx/store';
import { ExcludeEntity } from './experiment-users.model';

export const actionFetchExcludedUsers = createAction('[Experiment Users] Fetch Excluded Users');

export const actionFetchExcludedUsersSuccess = createAction(
  '[Experiment Users] Fetch Excluded Users Success',
  props<{ data: ExcludeEntity[] }>()
);

export const actionFetchExcludedUsersFailure = createAction('[Experiment Users] Fetch Excluded Users Failure');

export const actionFetchExcludedGroups = createAction('[Experiment Users] Fetch Excluded Groups');

export const actionFetchExcludedGroupsSuccess = createAction(
  '[Experiment Users] Fetch Excluded Groups Success',
  props<{ data: ExcludeEntity[] }>()
);

export const actionFetchExcludedGroupsFailure = createAction('[Experiment Users] Fetch Excluded Groups Failure');

export const actionExcludeUser = createAction('[Experiment Users] Exclude User', props<{ id: string }>());

export const actionExcludeUserSuccess = createAction(
  '[Experiment Users] Exclude User Success',
  props<{ data: ExcludeEntity[] }>()
);

export const actionExcludedUserFailure = createAction('[Experiment Users] Exclude User Failure');

export const actionExcludeGroup = createAction(
  '[Experiment Users] Exclude Group',
  props<{ id: string; groupType: string }>()
);

export const actionExcludeGroupSuccess = createAction(
  '[Experiment Users] Exclude Group Success',
  props<{ data: ExcludeEntity[] }>()
);

export const actionExcludedGroupFailure = createAction('[Experiment Users] Exclude Group Failure');

export const actionDeleteExcludedUser = createAction('[Experiment User] Delete Excluded User', props<{ id: string }>());

export const actionDeleteExcludedUserSuccess = createAction(
  '[Experiment Users] Delete Excluded User Success',
  props<{ data: ExcludeEntity[] }>()
);

export const actionDeleteExcludedUserFailure = createAction('[Experiment Users] Delete Excluded User Failure');

export const actionDeleteExcludedGroup = createAction(
  '[Experiment User] Delete Excluded Group',
  props<{ id: string; groupType: string }>()
);

export const actionDeleteExcludedGroupSuccess = createAction(
  '[Experiment Users] Delete Excluded Group Success',
  props<{ data: ExcludeEntity[] }>()
);

export const actionDeleteExcludedGroupFailure = createAction('[Experiment Users] Delete Excluded Group Failure');
