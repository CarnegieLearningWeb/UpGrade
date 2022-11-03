import { PreviewUsersState, PreviewUsers } from './preview-users.model';
import { Action, createReducer, on } from '@ngrx/store';
import { EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import * as previewUsersActions from '../store/preview-users.actions';

export const adapter: EntityAdapter<PreviewUsers> = createEntityAdapter<PreviewUsers>();

export const { selectIds, selectEntities, selectAll, selectTotal } = adapter.getSelectors();

export const initialState: PreviewUsersState = adapter.getInitialState({
  isLoading: false,
  skipPreviewUsers: 0,
  totalPreviewUsers: null,
});

const reducer = createReducer(
  initialState,
  on(
    previewUsersActions.actionAddPreviewUser,
    previewUsersActions.actionDeletePreviewUser,
    previewUsersActions.actionAssignConditionToPreviewUser,
    (state) => ({ ...state, isLoading: true })
  ),
  on(previewUsersActions.actionFetchPreviewUsersSuccess, (state, { data, totalPreviewUsers }) => {
    const newState = {
      ...state,
      totalPreviewUsers,
      skipPreviewUsers: state.skipPreviewUsers + data.length,
    };
    return adapter.upsertMany(data, { ...newState, isLoading: false });
  }),
  on(previewUsersActions.actionAddPreviewUserSuccess, (state, { data }) =>
    adapter.addOne(data, { ...state, isLoading: false })
  ),
  on(previewUsersActions.actionDeletePreviewUserSuccess, (state, { data }) =>
    adapter.removeOne(data.id, { ...state, isLoading: false })
  ),
  on(
    previewUsersActions.actionFetchPreviewUsersFailure,
    previewUsersActions.actionAddPreviewUserFailure,
    previewUsersActions.actionDeletePreviewUserFailure,
    (state) => ({ ...state, isLoading: false })
  ),
  on(previewUsersActions.actionAssignConditionToPreviewUserSuccess, (state, { previewUser }) => {
    const assignments = previewUser.assignments ? previewUser.assignments : [];
    return adapter.updateOne(
      { id: previewUser.id, changes: { ...previewUser, assignments } },
      { ...state, isLoading: false }
    );
  }),
  on(previewUsersActions.actionSetIsPreviewUsersLoading, (state, { isPreviewUsersLoading }) => ({
    ...state,
    isLoading: isPreviewUsersLoading,
  })),
  on(previewUsersActions.actionSetSkipPreviewUsers, (state, { skipPreviewUsers }) => ({ ...state, skipPreviewUsers }))
);

export function previewUsersReducer(state: PreviewUsersState | undefined, action: Action) {
  return reducer(state, action);
}
