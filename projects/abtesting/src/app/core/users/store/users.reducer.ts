import { UserState, User } from './users.model';
import { EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { createReducer, Action, on } from '@ngrx/store';
import * as UsersActions from './users.actions';

export const adapter: EntityAdapter<User> = createEntityAdapter<User>({
  selectId: entity => entity.email
});

export const {
  selectIds,
  selectEntities,
  selectAll,
  selectTotal
} = adapter.getSelectors();

export const initialState: UserState = adapter.getInitialState({
  isUsersLoading: false
});

const reducer = createReducer(
  initialState,
  on(
    UsersActions.actionFetchUsers,
    UsersActions.actionUpdateUserRole,
    (state) => ({ ...state, isUsersLoading: true })
  ),
  on(
    UsersActions.actionFetchUsersSuccess,
    (state, { users }) => {
    return adapter.addMany(users, { ...state, isUsersLoading: false  });
  }),
  on(
    UsersActions.actionFetchUsersFailure,
    UsersActions.actionUpdateUserRoleFailure,
    (state) => ({ ...state, isUsersLoading: false })
  ),
  on(
    UsersActions.actionUpdateUserRoleSuccess,
    (state, { user }) => {
      return adapter.updateOne({ id: user.email, changes: { ...user }}, { ...state, isUsersLoading: false });
    }
  )
);

export function UsersReducer(
  state: UserState | undefined,
  action: Action
) {
  return reducer(state, action);
}
