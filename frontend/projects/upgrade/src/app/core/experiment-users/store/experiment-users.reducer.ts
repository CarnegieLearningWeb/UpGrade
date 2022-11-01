import { EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { ExperimentUsersState, ExcludeEntity } from './experiment-users.model';
import { createReducer, Action, on } from '@ngrx/store';
import * as experimentUsersActions from './experiment-users.actions';

export const adapter: EntityAdapter<any> = createEntityAdapter<ExcludeEntity>({
  selectId: (entity) => (entity.userId ? 'user' + entity.userId : entity.type + entity.groupId),
});

export const { selectIds, selectEntities, selectAll, selectTotal } = adapter.getSelectors();

export const initialState: ExperimentUsersState = adapter.getInitialState({
  isLoading: false,
});

const reducer = createReducer(
  initialState,
  on(
    experimentUsersActions.actionFetchExcludedUsers,
    experimentUsersActions.actionFetchExcludedGroups,
    experimentUsersActions.actionExcludeUser,
    experimentUsersActions.actionExcludeGroup,
    experimentUsersActions.actionDeleteExcludedUser,
    experimentUsersActions.actionDeleteExcludedGroup,
    (state) => ({ ...state, isLoading: true })
  ),
  on(
    experimentUsersActions.actionFetchExcludedUsersSuccess,
    experimentUsersActions.actionFetchExcludedGroupsSuccess,
    (state, { data }) => adapter.upsertMany(data, { ...state, isLoading: false })
  ),
  on(
    experimentUsersActions.actionExcludeUserSuccess,
    experimentUsersActions.actionExcludeGroupSuccess,
    (state, { data }) => {
      if (data.length) {
        return adapter.upsertOne(data[0], { ...state, isLoading: false });
      } else {
        return { ...state, isLoading: false };
      }
    }
  ),
  on(
    experimentUsersActions.actionFetchExcludedUsersFailure,
    experimentUsersActions.actionFetchExcludedGroupsFailure,
    experimentUsersActions.actionExcludedUserFailure,
    experimentUsersActions.actionExcludedGroupFailure,
    experimentUsersActions.actionDeleteExcludedUserFailure,
    experimentUsersActions.actionDeleteExcludedGroupFailure,
    (state) => ({ ...state, isLoading: false })
  ),
  on(
    experimentUsersActions.actionDeleteExcludedUserSuccess,
    experimentUsersActions.actionDeleteExcludedGroupSuccess,
    (state, { data }) => {
      if (data.length) {
        const [deletedEntity] = data;
        const id = deletedEntity.type ? deletedEntity.type + deletedEntity.groupId : 'user' + deletedEntity.userId;
        return adapter.removeOne(id, { ...state, isLoading: false });
      }
    }
  )
);

export function experimentUsersReducer(state: ExperimentUsersState | undefined, action: Action) {
  return reducer(state, action);
}
