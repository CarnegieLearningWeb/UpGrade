import { createAction, props } from '@ngrx/store';
import { PreviewUsers } from './preview-users.model';

export const actionFetchPreviewUsers = createAction(
  '[Preview Users] Fetch Preview Users'
);

export const actionFetchPreviewUsersSuccess = createAction(
  '[Preview Users] Fetch Preview Users Success',
  props<{ data: PreviewUsers[] }>()
);

export const actionFetchPreviewUsersFailure = createAction(
  '[Preview Users] Fetch Preview Users Failure'
);

export const actionAddPreviewUser = createAction(
  '[Preview Users] Add Preview User',
  props<{ id: string }>()
);

export const actionAddPreviewUserSuccess = createAction(
  '[Preview Users] Add Preview User Success',
  props<{ data: PreviewUsers }>()
);

export const actionAddPreviewUserFailure = createAction(
  '[Preview Users] Add Preview User Failure',
);

export const actionDeletePreviewUser = createAction(
  '[Preview Users] Delete Preview User',
  props<{ id: string }>()
);

export const actionDeletePreviewUserSuccess = createAction(
  '[Preview Users] Delete Preview User Success',
  props<{ data: PreviewUsers }>()
);

export const actionDeletePreviewUserFailure = createAction(
  '[Preview Users] Delete Preview User Failure',
);
