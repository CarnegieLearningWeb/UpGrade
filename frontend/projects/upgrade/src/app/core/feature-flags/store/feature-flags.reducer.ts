import { createReducer, Action, on } from '@ngrx/store';
import { createEntityAdapter, EntityAdapter } from '@ngrx/entity';
import { FeatureFlagState, FeatureFlag, FLAG_SEARCH_KEY } from './feature-flags.model';
import * as FeatureFlagsActions from './feature-flags.actions';

export const adapter: EntityAdapter<FeatureFlag> = createEntityAdapter<FeatureFlag>();

export const { selectIds, selectEntities, selectAll, selectTotal } = adapter.getSelectors();

export const initialState: FeatureFlagState = adapter.getInitialState({
  isLoadingAddFeatureFlag: false,
  isLoadingFeatureFlags: false,
  isLoadingUpdateFeatureFlagStatus: false,
  isLoadingFeatureFlagDetail: false,
  isLoadingFeatureFlagDelete: false,
  isLoadingSelectedFeatureFlag: false,
  hasInitialFeatureFlagsDataLoaded: false,
  activeDetailsTabIndex: 0,
  skipFlags: 0,
  totalFlags: null,
  searchKey: FLAG_SEARCH_KEY.ALL,
  searchValue: null,
  sortKey: null,
  sortAs: null,
});

const reducer = createReducer(
  initialState,
  on(FeatureFlagsActions.actionFetchFeatureFlags, (state) => ({
    ...state,
    isLoadingFeatureFlags: true,
  })),
  on(FeatureFlagsActions.actionFetchFeatureFlagsSuccess, (state, { flags, totalFlags }) => {
    const newState: FeatureFlagState = {
      ...state,
      totalFlags,
      skipFlags: state.skipFlags + flags.length,
    };
    return adapter.upsertMany(flags, {
      ...newState,
      isLoadingFeatureFlags: false,
      hasInitialFeatureFlagsDataLoaded: true,
    });
  }),
  on(FeatureFlagsActions.actionFetchFeatureFlagsFailure, (state) => ({ ...state, isLoadingFeatureFlags: false })),
  on(FeatureFlagsActions.actionFetchFeatureFlagByIdSuccess, (state, { flag }) => {
    return adapter.upsertOne(flag, {
      ...state,
      isLoadingFeatureFlags: false,
    });
  }),
  on(FeatureFlagsActions.actionFetchFeatureFlagByIdFailure, (state) => ({ ...state, isLoadingFeatureFlags: false })),
  on(FeatureFlagsActions.actionSetIsLoadingFeatureFlags, (state, { isLoadingFeatureFlags }) => ({
    ...state,
    isLoadingFeatureFlags,
  })),
  on(FeatureFlagsActions.actionAddFeatureFlag, (state) => ({ ...state, isLoadingAddFeatureFlag: true })),
  on(FeatureFlagsActions.actionAddFeatureFlagSuccess, (state, { response }) => {
    return adapter.addOne(response, {
      ...state,
      isLoadingAddFeatureFlag: false,
    });
  }),
  on(FeatureFlagsActions.actionDeleteFeatureFlag, (state) => ({ ...state, isLoadingFeatureFlagDelete: true })),
  on(FeatureFlagsActions.actionDeleteFeatureFlagSuccess, (state, { flag }) => {
    return adapter.removeOne(flag.id, {
      ...state,
      isLoadingFeatureFlagDelete: false,
    });
  }),
  on(FeatureFlagsActions.actionDeleteFeatureFlagFailure, (state) => ({
    ...state,
    isLoadingFeatureFlagDelete: false,
  })),
  on(FeatureFlagsActions.actionAddFeatureFlagFailure, (state) => ({ ...state, isLoadingAddFeatureFlag: false })),
  on(FeatureFlagsActions.actionSetSkipFlags, (state, { skipFlags }) => ({ ...state, skipFlags })),
  on(FeatureFlagsActions.actionSetSearchKey, (state, { searchKey }) => ({ ...state, searchKey })),
  on(FeatureFlagsActions.actionSetSearchString, (state, { searchString }) => ({ ...state, searchValue: searchString })),
  on(FeatureFlagsActions.actionSetSortKey, (state, { sortKey }) => ({ ...state, sortKey })),
  on(FeatureFlagsActions.actionSetSortingType, (state, { sortingType }) => ({ ...state, sortAs: sortingType })),
  on(FeatureFlagsActions.actionSetActiveDetailsTabIndex, (state, { activeDetailsTabIndex }) => ({
    ...state,
    activeDetailsTabIndex,
  })),
  on(FeatureFlagsActions.actionUpdateFeatureFlagStatus, (state) => ({
    ...state,
    isLoadingUpdateFeatureFlagStatus: true,
  })),
  on(FeatureFlagsActions.actionUpdateFeatureFlagStatusSuccess, (state, { response }) => {
    const flag = response;
    return adapter.updateOne(
      { id: flag?.id, changes: { status: flag?.status } },
      { ...state, isLoadingUpdateFeatureFlagStatus: false }
    );
  }),
  on(FeatureFlagsActions.actionUpdateFeatureFlagStatusFailure, (state) => ({
    ...state,
    isLoadingUpdateFeatureFlagStatus: true,
  })),
  on(FeatureFlagsActions.actionFetchFeatureFlagById, (state) => ({
    ...state,
    isLoadingFeatureFlags: true,
  }))
);

export function featureFlagsReducer(state: FeatureFlagState | undefined, action: Action) {
  return reducer(state, action);
}
