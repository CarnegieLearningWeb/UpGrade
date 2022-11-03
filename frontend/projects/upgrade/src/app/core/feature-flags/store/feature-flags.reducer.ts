import { createReducer, Action, on } from '@ngrx/store';
import { createEntityAdapter, EntityAdapter } from '@ngrx/entity';
import { FeatureFlagState, FeatureFlag, FLAG_SEARCH_SORT_KEY } from './feature-flags.model';
import * as FeatureFlagsActions from './feature-flags.actions';

export const adapter: EntityAdapter<FeatureFlag> = createEntityAdapter<FeatureFlag>();

export const { selectIds, selectEntities, selectAll, selectTotal } = adapter.getSelectors();

export const initialState: FeatureFlagState = adapter.getInitialState({
  isLoadingFeatureFlags: false,
  skipFlags: 0,
  totalFlags: 0,
  searchKey: FLAG_SEARCH_SORT_KEY.ALL,
  searchString: null,
  sortKey: null,
  sortAs: null,
});

const reducer = createReducer(
  initialState,
  on(FeatureFlagsActions.actionUpdateFlagStatus, FeatureFlagsActions.actionUpsertFeatureFlag, (state) => ({
    ...state,
    isLoadingFeatureFlags: true,
  })),
  on(FeatureFlagsActions.actionFetchFeatureFlagsSuccess, (state, { flags, totalFlags }) => {
    const newState = {
      ...state,
      totalFlags,
      skipFlags: state.skipFlags + flags.length,
    };
    return adapter.upsertMany(flags, { ...newState, isLoadingFeatureFlags: false });
  }),
  on(
    FeatureFlagsActions.actionFetchFeatureFlagsFailure,
    FeatureFlagsActions.actionUpdateFlagStatusFailure,
    FeatureFlagsActions.actionUpsertFeatureFlagFailure,
    (state) => ({ ...state, isLoadingFeatureFlags: false })
  ),
  on(FeatureFlagsActions.actionUpsertFeatureFlagSuccess, (state, { flag }) =>
    adapter.upsertOne(flag, { ...state, isLoadingFeatureFlags: false })
  ),
  on(FeatureFlagsActions.actionUpdateFlagStatusSuccess, (state, { flag }) =>
    adapter.updateOne({ id: flag.id, changes: flag }, { ...state, isLoadingFeatureFlags: false })
  ),
  on(FeatureFlagsActions.actionDeleteFeatureFlagSuccess, (state, { flag }) => adapter.removeOne(flag.id, state)),
  on(FeatureFlagsActions.actionSetIsLoadingFeatureFlags, (state, { isLoadingFeatureFlags }) => ({
    ...state,
    isLoadingFeatureFlags,
  })),
  on(FeatureFlagsActions.actionSetSkipFlags, (state, { skipFlags }) => ({ ...state, skipFlags })),
  on(FeatureFlagsActions.actionSetSearchKey, (state, { searchKey }) => ({ ...state, searchKey })),
  on(FeatureFlagsActions.actionSetSearchString, (state, { searchString }) => ({ ...state, searchString })),
  on(FeatureFlagsActions.actionSetSortKey, (state, { sortKey }) => ({ ...state, sortKey })),
  on(FeatureFlagsActions.actionSetSortingType, (state, { sortingType }) => ({ ...state, sortAs: sortingType }))
);

export function featureFlagsReducer(state: FeatureFlagState | undefined, action: Action) {
  return reducer(state, action);
}
