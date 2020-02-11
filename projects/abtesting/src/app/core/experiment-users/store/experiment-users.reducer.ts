import { EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { ExperimentUsersState, ExcludeEntity } from './experiment-users.model';
import { createReducer, Action, on } from '@ngrx/store';
import * as experimentUsersActions from './experiment-users.actions';

export const adapter: EntityAdapter<any> = createEntityAdapter<ExcludeEntity>({
  selectId: entity => entity.userId ? ('user' + entity.userId) : (entity.type + entity.groupId)
});

export const {
  selectIds,
  selectEntities,
  selectAll,
  selectTotal
} = adapter.getSelectors();

export const initialState: ExperimentUsersState = adapter.getInitialState({
  isLoading: false
});

const reducer = createReducer(
  initialState,
  on(
    experimentUsersActions.actionFetchExcludedUsers,
    experimentUsersActions.actionFetchExcludedGroups,
    experimentUsersActions.actionExcludeUser,
    experimentUsersActions.actionExcludeGroup,
    (state) => ({ ...state, isLoading: true })
  ),
  on(
    experimentUsersActions.actionFetchExcludedUsersSuccess,
    experimentUsersActions.actionFetchExcludedGroupsSuccess,
    (state, { data }) => {
      return adapter.upsertMany(data, { ...state, isLoading: false })
    }
  ),
  on(
    experimentUsersActions.actionExcludeUserSuccess,
    experimentUsersActions.actionExcludeGroupSuccess,
    (state, { data }) => {
      return adapter.upsertOne(data, { ...state, isLoading: false })
    }
  ),
  on(
    experimentUsersActions.actionFetchExcludedUsersFailure,
    experimentUsersActions.actionFetchExcludedGroupsFailure,
    experimentUsersActions.actionExcludedUserFailure,
    experimentUsersActions.actionExcludedGroupFailure,
    (state) => ({ ...state, isLoading: false })
  ),
);

export function experimentUsersReducer(
  state: ExperimentUsersState | undefined,
  action: Action
) {
  return reducer(state, action);
}
