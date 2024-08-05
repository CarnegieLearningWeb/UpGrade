import { createSelector, createFeatureSelector } from '@ngrx/store';
import { FLAG_SEARCH_KEY, FeatureFlag, FeatureFlagState, ParticipantListTableRow } from './feature-flags.model';
import { selectRouterState } from '../../core.state';
import { selectAll } from './feature-flags.reducer';
import { selectContextMetaData } from '../../experiments/store/experiments.selectors';

export const selectFeatureFlagsState = createFeatureSelector<FeatureFlagState>('featureFlags');

export const selectAllFeatureFlags = createSelector(selectFeatureFlagsState, selectAll);

export const selectAllFeatureFlagsSortedByDate = createSelector(selectAllFeatureFlags, (featureFlags) => {
  if (!featureFlags) {
    return [];
  }
  return featureFlags.sort((a, b) => {
    const d1 = new Date(a.createdAt);
    const d2 = new Date(b.createdAt);
    return d1 < d2 ? 1 : d1 > d2 ? -1 : 0;
  });
});

export const selectAppContexts = createSelector(selectContextMetaData, (contextMetaData) =>
  Object.keys(contextMetaData?.contextMetadata ?? [])
);

export const selectHasInitialFeatureFlagsDataLoaded = createSelector(
  selectFeatureFlagsState,
  (state) => state.hasInitialFeatureFlagsDataLoaded
);

export const selectIsLoadingFeatureFlags = createSelector(
  selectFeatureFlagsState,
  (state) => state.isLoadingFeatureFlags
);

export const selectIsInitialFeatureFlagsLoading = createSelector(
  selectIsLoadingFeatureFlags,
  selectAllFeatureFlagsSortedByDate,
  (isLoading, featureFlags) => !isLoading || !!featureFlags.length
);

export const selectIsLoadingUpsertFeatureFlag = createSelector(
  selectFeatureFlagsState,
  (state) => state.isLoadingUpsertFeatureFlag
);

export const selectSelectedFeatureFlag = createSelector(
  selectRouterState,
  selectFeatureFlagsState,
  (routerState, featureFlagState) => {
    // be very defensive here to make sure routerState is correct
    const flagId = routerState?.state?.params?.flagId;
    if (flagId) {
      return featureFlagState.entities[flagId];
    }
    return undefined;
  }
);

export const selectFeatureFlagOverviewDetails = createSelector(selectSelectedFeatureFlag, (featureFlag) => ({
  ['Key']: featureFlag?.key,
  ['Description']: featureFlag?.description,
  ['App Context']: featureFlag?.context[0],
  ['Tags']: featureFlag?.tags,
}));

export const selectSkipFlags = createSelector(selectFeatureFlagsState, (state) => state.skipFlags);

export const selectTotalFlags = createSelector(selectFeatureFlagsState, (state) => state.totalFlags);

export const selectIsAllFlagsFetched = createSelector(
  selectSkipFlags,
  selectTotalFlags,
  (skipFlags, totalFlags) => skipFlags === totalFlags
);

export const selectSearchKey = createSelector(selectFeatureFlagsState, (state) => state.searchKey);

export const selectSearchString = createSelector(selectFeatureFlagsState, (state) => state.searchValue);

export const selectSearchFeatureFlagParams = createSelector(
  selectSearchKey,
  selectSearchString,
  (searchKey, searchString) => {
    if (!!searchKey && (!!searchString || searchString === '')) {
      return { searchKey, searchString };
    }
    return null;
  }
);

export const selectRootTableState = createSelector(
  selectAllFeatureFlags,
  selectSearchFeatureFlagParams,
  (tableData, searchParams) => ({
    tableData,
    searchParams,
    allSearchableProperties: Object.values(FLAG_SEARCH_KEY),
  })
);

export const selectSortKey = createSelector(selectFeatureFlagsState, (state) => state.sortKey);

export const selectSortAs = createSelector(selectFeatureFlagsState, (state) => state.sortAs);

export const selectActiveDetailsTabIndex = createSelector(
  selectFeatureFlagsState,
  (state) => state.activeDetailsTabIndex
);

export const selectFeatureFlagsListLength = createSelector(
  selectAllFeatureFlags,
  (featureFlags) => featureFlags.length
);

export const selectIsLoadingImportFeatureFlag = createSelector(
  selectFeatureFlagsState,
  (state) => state.isLoadingImportFeatureFlag
);

export const selectIsLoadingUpdateFeatureFlagStatus = createSelector(
  selectFeatureFlagsState,
  (state) => state.isLoadingUpdateFeatureFlagStatus
);

export const selectIsLoadingSelectedFeatureFlag = createSelector(
  selectFeatureFlagsState,
  (state) => state.isLoadingSelectedFeatureFlag
);

export const selectIsLoadingFeatureFlagDelete = createSelector(
  selectFeatureFlagsState,
  (state) => state.isLoadingFeatureFlagDelete
);

export const selectFeatureFlagInclusions = createSelector(
  selectSelectedFeatureFlag,
  (featureFlag: FeatureFlag): ParticipantListTableRow[] => {
    if (!featureFlag || !featureFlag.featureFlagSegmentInclusion) {
      return [];
    }
    return [...featureFlag.featureFlagSegmentInclusion]
      .sort((a, b) => new Date(a.segment.createdAt).getTime() - new Date(b.segment.createdAt).getTime())
      .map((inclusion) => {
        return {
          segment: inclusion.segment,
          listType: inclusion.listType,
          enabled: inclusion.enabled,
        };
      });
  }
);

export const selectFeatureFlagExclusions = createSelector(
  selectSelectedFeatureFlag,
  (featureFlag: FeatureFlag): ParticipantListTableRow[] => []
);
