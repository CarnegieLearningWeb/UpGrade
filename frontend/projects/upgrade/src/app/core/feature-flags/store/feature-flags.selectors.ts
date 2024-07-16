import { createSelector, createFeatureSelector } from '@ngrx/store';
import {
  EmptyPrivateSegment,
  FLAG_SEARCH_KEY,
  FeatureFlag,
  FeatureFlagState,
  ParticipantListTableRow,
  PrivateSegment,
} from './feature-flags.model';
import { selectRouterState } from '../../core.state';
import { selectAll } from './feature-flags.reducer';
import { GroupForSegment, IndividualForSegment, Segment } from '../../segments/store/segments.model';
import { FEATURE_FLAG_PARTICIPANT_LIST_KEY } from '../../../../../../../../types/src/Experiment/enums';

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
  ({ state: { params } }, featureFlagState) => featureFlagState.entities[params.flagId]
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

export const selectIsLoadingFeatureFlagExport = createSelector(
  selectFeatureFlagsState,
  (state) => state.isLoadingFeatureFlagExport
);

export const selectExportFeatureFlagSuccess = createSelector(
  selectFeatureFlagsState,
  (state) => state.exportFeatureFlagSuccess
);

export const selectFeatureFlagInclusions = createSelector(
  selectSelectedFeatureFlag,
  (featureFlag: FeatureFlag): ParticipantListTableRow[] =>
    mapToParticipantTableRowStructure(featureFlag, FEATURE_FLAG_PARTICIPANT_LIST_KEY.INCLUDE)
);

export const selectFeatureFlagExclusions = createSelector(
  selectSelectedFeatureFlag,
  (featureFlag: FeatureFlag): ParticipantListTableRow[] =>
    mapToParticipantTableRowStructure(featureFlag, FEATURE_FLAG_PARTICIPANT_LIST_KEY.EXCLUDE)
);

// TODO: can we get rid of this ui discovery work and have the backend do it?
function mapToParticipantTableRowStructure(
  featureFlag: FeatureFlag,
  key: FEATURE_FLAG_PARTICIPANT_LIST_KEY.INCLUDE | FEATURE_FLAG_PARTICIPANT_LIST_KEY.EXCLUDE
): ParticipantListTableRow[] {
  const privateSegment: PrivateSegment | EmptyPrivateSegment = featureFlag?.[key];

  if (!privateSegment) return [];

  // make sure this is not an empty private segment
  if ('groupForSegment' in privateSegment.segment) {
    const groups: GroupForSegment[] = privateSegment.segment.groupForSegment || [];
    const subSegments: Segment[] = privateSegment.segment.subSegments || [];
    const individuals: IndividualForSegment[] = privateSegment.segment.individualForSegment || [];

    const groupsRow = groups.map(mapGroupToRow);
    const subSegmentsRow = subSegments.map(mapSubSegmentToRow);
    const individualsRow = individuals.map(mapIndividualToRow);

    const allSegments: ParticipantListTableRow[] = [...groupsRow, ...subSegmentsRow, ...individualsRow];

    return allSegments;
  }

  return [];
}

function mapGroupToRow(group: GroupForSegment): ParticipantListTableRow {
  return {
    name: group.groupId,
    type: group.type + ' (group)',
    values: '?',
    status: '?',
  };
}

function mapSubSegmentToRow(subSegment: Segment): ParticipantListTableRow {
  return {
    name: subSegment.id,
    type: 'Segment',
    values: '?',
    status: '?',
  };
}

function mapIndividualToRow(individual: IndividualForSegment): ParticipantListTableRow {
  return {
    name: individual.userId,
    type: 'Individual',
    values: '?',
    status: '?',
  };
}
