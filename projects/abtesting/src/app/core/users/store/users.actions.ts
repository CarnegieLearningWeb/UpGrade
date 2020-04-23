import { createAction, props } from '@ngrx/store';
import { UpdateUser, User } from './users.model';

export const actionFetchUsers = createAction('[Users] Fetch Users');

export const actionFetchUsersSuccess = createAction('[Users] Fetch Users Success', props<{ users: User[] }>());

export const actionFetchUsersFailure = createAction('[Users] Fetch Users Failure');

export const actionUpdateUserRole = createAction('[Users] Update User Role', props<{ userRoleData: UpdateUser }>());

export const actionUpdateUserRoleSuccess = createAction('[Users] Update User Role Success', props<{ user: User }>());

export const actionUpdateUserRoleFailure = createAction('[Users] Update User Role Failure');

export const actionCreateNewUser = createAction('[Users] Create New User', props<{ user: UpdateUser }>());

export const actionCreateNewUserSuccess = createAction('[Users] Create New User Success', props<{ user: User }>());

export const actionCreateNewUserFailure = createAction('[Users] Create New User Failure');
