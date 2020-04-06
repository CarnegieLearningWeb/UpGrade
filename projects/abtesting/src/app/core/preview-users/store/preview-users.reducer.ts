import { PreviewUsersState, PreviewUsers } from './preview-users.model';
import { Action, createReducer, on } from '@ngrx/store';
import { EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import * as previewUsersActions from '../store/preview-users.actions';

export const adapter: EntityAdapter<PreviewUsers> = createEntityAdapter<PreviewUsers>();

export const {
  selectIds,
  selectEntities,
  selectAll,
  selectTotal
} = adapter.getSelectors();

export const initialState: PreviewUsersState = adapter.getInitialState({
  isLoading: false
});

const reducer = createReducer(
  initialState,
  on(
    previewUsersActions.actionFetchPreviewUsers,
    previewUsersActions.actionAddPreviewUser,
    previewUsersActions.actionDeletePreviewUser,
    (state) => ({ ...state, isLoading: true })
  ),
  on(
    previewUsersActions.actionFetchPreviewUsersSuccess,
    (state, { data }) => {
      return adapter.addAll(data, { ...state, isLoading: false });
    }
  ),
  on(
    previewUsersActions.actionAddPreviewUserSuccess,
    (state, { data }) => {
      return adapter.addOne(data, { ...state, isLoading: false });
    }
  ),
  on(
    previewUsersActions.actionDeletePreviewUserSuccess,
    (state, { data }) => {
      return adapter.removeOne(data.id, { ...state, isLoading: false });
    }
  ),
  on(
    previewUsersActions.actionFetchPreviewUsersFailure,
    previewUsersActions.actionAddPreviewUserFailure,
    previewUsersActions.actionDeletePreviewUserFailure,
    (state) => ({ ...state, isLoading: false })
  ),
  on(
    previewUsersActions.actionAssignConditionToPreviewUserSuccess,
    (state, { previewUser }) => {
      return adapter.upsertOne(previewUser, { ...state });
    }
  )
)

export function previewUsersReducer(
  state: PreviewUsersState | undefined,
  action: Action
) {
  return reducer(state, action);
}
