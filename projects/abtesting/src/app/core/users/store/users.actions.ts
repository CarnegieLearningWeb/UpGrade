import { createAction, props } from '@ngrx/store';
import { UpdateUserRole, User } from './users.model';

export const actionFetchUsers = createAction(
  '[Users] Fetch Users'
);

export const actionFetchUsersSuccess = createAction(
  '[Users] Fetch Users Success',
  props<{ users: User[] }>()
);

export const actionFetchUsersFailure = createAction(
  '[Users] Fetch Users Failure'
);

export const actionUpdateUserRole = createAction(
  '[Users] Update User Role',
  props<{ userRoleData: UpdateUserRole }>()
);

export const actionUpdateUserRoleSuccess = createAction(
  '[Users] Update User Role Success',
  props<{ user: User }>()
);

export const actionUpdateUserRoleFailure = createAction(
  '[Users] Update User Role Failure'
);
