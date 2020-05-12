import { createReducer, Action, on } from '@ngrx/store';
import { createEntityAdapter, EntityAdapter } from '@ngrx/entity';
import { FeatureFlagState, FeatureFlag } from './feature-flags.model';
import * as FeatureFlagsActions from './feature-flags.actions';

export const adapter: EntityAdapter<FeatureFlag> = createEntityAdapter<
  FeatureFlag
>();

export const {
  selectIds,
  selectEntities,
  selectAll,
  selectTotal
} = adapter.getSelectors();

export const initialState: FeatureFlagState = adapter.getInitialState({
  isLoadingFeatureFlags: false,
});

const reducer = createReducer(
  initialState,
  on(
    FeatureFlagsActions.actionFetchAllFeatureFlags,
    FeatureFlagsActions.actionUpdateFlagStatus,
    FeatureFlagsActions.actionUpsertFeatureFlag,
    (state) => ({ ...state, isLoadingFeatureFlags: true })
  ),
  on(
    FeatureFlagsActions.actionFetchAllFeatureFlagsSuccess,
    (state, { flags }) => {
      return adapter.upsertMany(flags, { ...state, isLoadingFeatureFlags: false });
    }
  ),
  on(
    FeatureFlagsActions.actionFetchAllFeatureFlagsFailure,
    FeatureFlagsActions.actionUpdateFlagStatusFailure,
    FeatureFlagsActions.actionUpsertFeatureFlagFailure,
    (state) => ({ ...state, isLoadingFeatureFlags: false })
  ),
  on(
    FeatureFlagsActions.actionUpsertFeatureFlagSuccess,
    (state, { flag }) => {
      return adapter.upsertOne(flag, { ...state, isLoadingFeatureFlags: false });
    }
  ),
  on(
    FeatureFlagsActions.actionUpdateFlagStatusSuccess,
    (state, { flag }) => {
      return adapter.updateOne({ id: flag.id, changes: flag }, { ...state, isLoadingFeatureFlags: false });
    }
  ),
  on(
    FeatureFlagsActions.actionDeleteFeatureFlagSuccess,
    (state, { flag }) => {
      return adapter.removeOne(flag.id, state);
    }
  )
);

export function featureFlagsReducer(
  state: FeatureFlagState | undefined,
  action: Action
) {
  return reducer(state, action);
}
