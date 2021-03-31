import { UserState, User, USER_SEARCH_SORT_KEY } from './users.model';
import { EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { createReducer, Action, on } from '@ngrx/store';
import * as UsersActions from './users.actions';

export const adapter: EntityAdapter<User> = createEntityAdapter<User>({
  selectId: entity => entity.email
});

export const { selectIds, selectEntities, selectAll, selectTotal } = adapter.getSelectors();

export const initialState: UserState = adapter.getInitialState({
  isUsersLoading: false,
  skipUsers: 0,
  totalUsers: null,
  searchKey: USER_SEARCH_SORT_KEY.ALL,
  searchString: null,
  sortKey: null,
  sortAs: null
});

const reducer = createReducer(
  initialState,
  on(
    UsersActions.actionUpdateUserRole,
    UsersActions.actionCreateNewUser,
    state => ({
    ...state,
    isUsersLoading: true
  })),
  on(
    UsersActions.actionFetchUsersSuccess,
    (state, { users, totalUsers }) => {
    const newState = {
      ...state,
      totalUsers,
      skipUsers: state.skipUsers + users.length
    };
    return adapter.upsertMany(users, { ...newState, isUsersLoading: false });
  }),
  on(
    UsersActions.actionFetchUsersFailure,
    UsersActions.actionUpdateUserRoleFailure,
    UsersActions.actionCreateNewUserFailure,
    state => ({ ...state, isUsersLoading: false })
  ),
  on(
    UsersActions.actionUpdateUserRoleSuccess,
    (state, { user }) => {
    return adapter.updateOne({ id: user.email, changes: { ...user } }, { ...state, isUsersLoading: false });
  }),
  on(
    UsersActions.actionCreateNewUserSuccess,
    (state, { user }) => {
    return adapter.addOne(user, { ...state, isUsersLoading: false });
  }),
  on(
    UsersActions.actionSetSkipUsers,
    (state, { skipUsers }) => ({ ...state, skipUsers })
  ),
  on(
    UsersActions.actionSetIsUserLoading,
    (state, { isUsersLoading }) => ({ ...state, isUsersLoading })
  ),
  on(
    UsersActions.actionSetSearchKey,
    (state, { searchKey }) => ({ ...state, searchKey })
  ),
  on(
    UsersActions.actionSetSearchString,
    (state, { searchString }) => ({ ...state, searchString })
  ),
  on(
    UsersActions.actionSetSortKey,
    (state, { sortKey }) => ({ ...state, sortKey })
  ),
  on(
    UsersActions.actionSetSortingType,
    (state, { sortingType }) => ({ ...state, sortAs: sortingType })
  ),
);

export function UsersReducer(state: UserState | undefined, action: Action) {
  return reducer(state, action);
}
