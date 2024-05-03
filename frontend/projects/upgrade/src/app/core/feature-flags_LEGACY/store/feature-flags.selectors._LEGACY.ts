import { createSelector, createFeatureSelector } from '@ngrx/store';
import { FeatureFlagState_LEGACY } from './feature-flags.model._LEGACY.js';
import { selectAll } from './feature-flags.reducer._LEGACY.js';
import { selectRouterState } from '../../core.state.js';

export const selectFeatureFlagsState_LEGACY = createFeatureSelector<FeatureFlagState_LEGACY>('featureFlags_LEGACY');

export const selectAllFeatureFlags_LEGACY = createSelector(selectFeatureFlagsState_LEGACY, selectAll);

export const selectIsLoadingFeatureFlags_LEGACY = createSelector(
  selectFeatureFlagsState_LEGACY,
  (state) => state.isLoadingFeatureFlags
);

export const selectSelectedFeatureFlag_LEGACY = createSelector(
  selectRouterState,
  selectFeatureFlagsState_LEGACY,
  ({ state: { params } }, featureFlagState) =>
    featureFlagState.entities[params.flagId] ? featureFlagState.entities[params.flagId] : undefined
);

export const selectSkipFlags_LEGACY = createSelector(selectFeatureFlagsState_LEGACY, (state) => state.skipFlags);

export const selectTotalFlags_LEGACY = createSelector(selectFeatureFlagsState_LEGACY, (state) => state.totalFlags);

export const selectSearchKey_LEGACY = createSelector(selectFeatureFlagsState_LEGACY, (state) => state.searchKey);

export const selectSearchString_LEGACY = createSelector(selectFeatureFlagsState_LEGACY, (state) => state.searchString);

export const selectSortKey_LEGACY = createSelector(selectFeatureFlagsState_LEGACY, (state) => state.sortKey);

export const selectSortAs_LEGACY = createSelector(selectFeatureFlagsState_LEGACY, (state) => state.sortAs);
