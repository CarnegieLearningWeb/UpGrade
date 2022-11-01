import { createAction, props } from '@ngrx/store';
import { UpdateUser, User, USER_SEARCH_SORT_KEY, SORT_AS } from './users.model';

export const actionFetchUsers = createAction('[Users] Fetch Users', props<{ fromStarting?: boolean }>());

export const actionFetchUsersSuccess = createAction(
  '[Users] Fetch Users Success',
  props<{ users: User[]; totalUsers: number }>()
);

export const actionFetchUsersFailure = createAction('[Users] Fetch Users Failure');

export const actionUpdateUserDetails = createAction(
  '[Users] Update User Details',
  props<{ userDetailsData: UpdateUser }>()
);

export const actionUpdateUserDetailsSuccess = createAction(
  '[Users] Update User Details Success',
  props<{ user: User }>()
);

export const actionUpdateUserDetailsFailure = createAction('[Users] Update User Details Failure');

export const actionCreateNewUser = createAction('[Users] Create New User', props<{ user: UpdateUser }>());

export const actionCreateNewUserSuccess = createAction('[Users] Create New User Success', props<{ user: User }>());

export const actionCreateNewUserFailure = createAction('[Users] Create New User Failure');

export const actionSetIsUserLoading = createAction('[User] Set Is Users Loading', props<{ isUsersLoading: boolean }>());

export const actionSetSkipUsers = createAction('[User] Set Skip Users', props<{ skipUsers: number }>());

export const actionSetSearchKey = createAction(
  '[User] Set Search key value',
  props<{ searchKey: USER_SEARCH_SORT_KEY }>()
);

export const actionSetSearchString = createAction('[User] Set Search String', props<{ searchString: string }>());

export const actionSetSortKey = createAction('[User] Set Sort key value', props<{ sortKey: USER_SEARCH_SORT_KEY }>());

export const actionSetSortingType = createAction('[User] Set Sorting type', props<{ sortingType: SORT_AS }>());

export const actionDeleteUser = createAction('[User] Delete user by email', props<{ email: string }>());

export const actionDeleteUserSuccess = createAction('[User] Delete user by email Success', props<{ user: User }>());

export const actionDeleteUserFailure = createAction('[User] Delete user by email Failure');
