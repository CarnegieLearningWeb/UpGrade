import { createAction, props } from '@ngrx/store';
import { PreviewUsers, PreviewUserAssignCondition } from './preview-users.model';

export const actionFetchPreviewUsers = createAction(
  '[Preview Users] Fetch Preview Users',
  props<{ fromStarting?: boolean }>()
);

export const actionFetchPreviewUsersSuccess = createAction(
  '[Preview Users] Fetch Preview Users Success',
  props<{ data: PreviewUsers[]; totalPreviewUsers: number }>()
);

export const actionFetchPreviewUsersFailure = createAction('[Preview Users] Fetch Preview Users Failure');

export const actionAddPreviewUser = createAction('[Preview Users] Add Preview User', props<{ id: string }>());

export const actionAddPreviewUserSuccess = createAction(
  '[Preview Users] Add Preview User Success',
  props<{ data: PreviewUsers }>()
);

export const actionAddPreviewUserFailure = createAction('[Preview Users] Add Preview User Failure');

export const actionDeletePreviewUser = createAction('[Preview Users] Delete Preview User', props<{ id: string }>());

export const actionDeletePreviewUserSuccess = createAction(
  '[Preview Users] Delete Preview User Success',
  props<{ data: PreviewUsers }>()
);

export const actionDeletePreviewUserFailure = createAction('[Preview Users] Delete Preview User Failure');

export const actionAssignConditionToPreviewUser = createAction(
  '[Preview User] Assign Condition To Preview User',
  props<{ data: PreviewUserAssignCondition }>()
);

export const actionAssignConditionToPreviewUserSuccess = createAction(
  '[Preview User] Assign Condition To Preview User Success',
  props<{ previewUser: any }>()
);

export const actionAssignConditionToPreviewUserFailure = createAction(
  '[Preview User] Assign Condition To Preview User Failure'
);

export const actionSetIsPreviewUsersLoading = createAction(
  '[Preview User] Set Is Preview Users Loading',
  props<{ isPreviewUsersLoading: boolean }>()
);

export const actionSetSkipPreviewUsers = createAction(
  '[Preview User] Set Skip Preview Users',
  props<{ skipPreviewUsers: number }>()
);
