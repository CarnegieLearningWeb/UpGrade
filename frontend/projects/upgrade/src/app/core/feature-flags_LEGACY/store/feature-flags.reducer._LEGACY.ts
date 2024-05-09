import { createReducer, Action, on } from '@ngrx/store';
import { createEntityAdapter, EntityAdapter } from '@ngrx/entity';
import {
  FeatureFlagState_LEGACY,
  FeatureFlag_LEGACY,
  FLAG_SEARCH_SORT_KEY_LEGACY,
} from './feature-flags.model._LEGACY.js';
import * as FeatureFlagsActions from './feature-flags.actions._LEGACY.js';

export const adapter: EntityAdapter<FeatureFlag_LEGACY> = createEntityAdapter<FeatureFlag_LEGACY>();

export const { selectIds, selectEntities, selectAll, selectTotal } = adapter.getSelectors();

export const initialState: FeatureFlagState_LEGACY = adapter.getInitialState({
  isLoadingFeatureFlags: false,
  skipFlags: 0,
  totalFlags: 0,
  searchKey: FLAG_SEARCH_SORT_KEY_LEGACY.ALL,
  searchString: null,
  sortKey: null,
  sortAs: null,
});

const reducer = createReducer(
  initialState,
  on(
    FeatureFlagsActions.actionUpdateFlagStatus_LEGACY,
    FeatureFlagsActions.actionUpsertFeatureFlag_LEGACY,
    (state) => ({
      ...state,
      isLoadingFeatureFlags: true,
    })
  ),
  on(FeatureFlagsActions.actionFetchFeatureFlagsSuccess_LEGACY, (state, { flags, totalFlags }) => {
    const newState = {
      ...state,
      totalFlags,
      skipFlags: state.skipFlags + flags.length,
    };
    return adapter.upsertMany(flags, { ...newState, isLoadingFeatureFlags: false });
  }),
  on(
    FeatureFlagsActions.actionFetchFeatureFlagsFailure_LEGACY,
    FeatureFlagsActions.actionUpdateFlagStatusFailure_LEGACY,
    FeatureFlagsActions.actionUpsertFeatureFlagFailure_LEGACY,
    (state) => ({ ...state, isLoadingFeatureFlags: false })
  ),
  on(FeatureFlagsActions.actionUpsertFeatureFlagSuccess_LEGACY, (state, { flag }) =>
    adapter.upsertOne(flag, { ...state, isLoadingFeatureFlags: false })
  ),
  on(FeatureFlagsActions.actionUpdateFlagStatusSuccess_LEGACY, (state, { flag }) =>
    adapter.updateOne({ id: flag.id, changes: flag }, { ...state, isLoadingFeatureFlags: false })
  ),
  on(FeatureFlagsActions.actionDeleteFeatureFlagSuccess_LEGACY, (state, { flag }) => adapter.removeOne(flag.id, state)),
  on(FeatureFlagsActions.actionSetIsLoadingFeatureFlags_LEGACY, (state, { isLoadingFeatureFlags }) => ({
    ...state,
    isLoadingFeatureFlags,
  })),
  on(FeatureFlagsActions.actionSetSkipFlags_LEGACY, (state, { skipFlags }) => ({ ...state, skipFlags })),
  on(FeatureFlagsActions.actionSetSearchKey_LEGACY, (state, { searchKey }) => ({ ...state, searchKey })),
  on(FeatureFlagsActions.actionSetSearchString_LEGACY, (state, { searchString }) => ({ ...state, searchString })),
  on(FeatureFlagsActions.actionSetSortKey_LEGACY, (state, { sortKey }) => ({ ...state, sortKey })),
  on(FeatureFlagsActions.actionSetSortingType_LEGACY, (state, { sortingType }) => ({ ...state, sortAs: sortingType }))
);

export function featureFlagsReducer_LEGACY(state: FeatureFlagState_LEGACY | undefined, action: Action) {
  return reducer(state, action);
}
