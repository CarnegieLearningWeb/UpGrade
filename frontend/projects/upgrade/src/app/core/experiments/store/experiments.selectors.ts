import { createSelector, createFeatureSelector } from '@ngrx/store';
import { selectAll } from './experiments.reducer';
import { EXPERIMENT_SEARCH_KEY, ExperimentState, Experiment } from './experiments.model';
import { selectRouterState } from '../../core.state';
import { ParticipantListTableRow } from '../../feature-flags/store/feature-flags.model';
import {
  ASSIGNMENT_UNIT,
  ASSIGNMENT_ALGORITHM_DISPLAY_MAP,
  CONDITION_ORDER_DISPLAY_MAP,
  CONSISTENCY_RULE_DISPLAY_MAP,
  ASSIGNMENT_UNIT_DISPLAY_MAP,
} from 'upgrade_types';

export const selectExperimentState = createFeatureSelector<ExperimentState>('experiments');

export const selectAllExperimentFromState = createSelector(selectExperimentState, selectAll);

export const selectAllExperiment = createSelector(
  selectExperimentState,
  selectAllExperimentFromState,
  (experimentState, allExperiments) =>
    allExperiments.map((experiment) => ({ ...experiment, stat: experimentState.stats[experiment.id] }))
);

export const selectIsLoadingExperiment = createSelector(selectExperimentState, (state) => state.isLoadingExperiment);

export const selectIsLoadingExperimentDetailStats = createSelector(
  selectExperimentState,
  (state) => state.isLoadingExperimentDetailStats
);

export const selectSelectedExperiment = createSelector(
  selectRouterState,
  selectExperimentState,
  (routerState, experimentState) => {
    // be very defensive here to make sure routerState is correct
    const experimentId = routerState?.state?.params?.experimentId;
    if (experimentId && experimentState?.entities) {
      const experiment = experimentState.entities[experimentId];

      // Return undefined if experiment doesn't exist yet
      if (!experiment) {
        return undefined;
      }

      // Merge with stats if available
      const stat = experimentState.stats?.[experimentId] || null;
      return { ...experiment, stat };
    }
    return undefined;
  }
);

export const selectExperimentById = createSelector(
  selectExperimentState,
  (state, { experimentId }) => state.entities[experimentId]
);

export const selectExperimentStats = createSelector(selectExperimentState, (state) => state.stats);

export const selectAllDecisionPoints = createSelector(selectExperimentState, (state) => state.allDecisionPoints);

export const selectSkipExperiment = createSelector(selectExperimentState, (state) => state.skipExperiment);

export const selectTotalExperiment = createSelector(selectExperimentState, (state) => state.totalExperiments);

export const selectSearchKey = createSelector(selectExperimentState, (state) => state.searchKey);

export const selectSearchString = createSelector(selectExperimentState, (state) => state.searchString);

export const selectSearchExperimentParams = createSelector(
  selectSearchKey,
  selectSearchString,
  (searchKey, searchString) => {
    if (!!searchKey && (!!searchString || searchString === '')) {
      return { searchKey: searchKey === EXPERIMENT_SEARCH_KEY.STATUS ? 'state' : searchKey, searchString };
    }
    return null;
  }
);

export const selectRootTableState = createSelector(
  selectAllExperiment,
  selectSearchExperimentParams,
  (tableData, searchParams) => ({
    tableData,
    searchParams,
    allSearchableProperties: Object.values(EXPERIMENT_SEARCH_KEY).map((key) =>
      key === EXPERIMENT_SEARCH_KEY.STATUS ? 'state' : key
    ),
  })
);

export const selectSortKey = createSelector(selectExperimentState, (state) => state.sortKey);

export const selectSortAs = createSelector(selectExperimentState, (state) => state.sortAs);

export const selectAllExperimentNames = createSelector(selectExperimentState, (state) => state.allExperimentNames);

export const selectIsGraphLoading = createSelector(selectExperimentState, (state) => state.isGraphInfoLoading);

export const selectExperimentGraphRange = createSelector(selectExperimentState, (state) => state.graphRange);

export const selectExperimentsExportLoading = createSelector(
  selectExperimentState,
  (state) => state.isLoadingExperimentExport
);

export const selectExperimentGraphInfo = createSelector(
  selectExperimentState,
  selectExperimentGraphRange,
  (state, range) => {
    if (state.graphInfo && range) {
      return state.graphInfo[range];
    }
    return null;
  }
);

export const selectExperimentStatById = createSelector(
  selectExperimentState,
  (state, { experimentId }) => state.stats[experimentId]
);

export const selectContextMetaData = createSelector(selectExperimentState, (state) => state.contextMetaData);

export const selectCurrentContextMetaData = createSelector(
  selectExperimentState,
  (state) => state.currentUserSelectedContext
);

export const selectIsLoadingContextMetaData = createSelector(
  selectExperimentState,
  (state) => state.isLoadingContextMetaData
);

export const selectCurrentContextMetaDataConditions = createSelector(
  selectExperimentState,
  (state) => state.currentUserSelectedContext?.CONDITIONS || []
);

export const selectGroupAssignmentStatus = createSelector(selectExperimentState, (state, { experimentId }) => {
  if (state.entities[experimentId]) {
    return state.entities[experimentId].groupSatisfied;
  }
  return null;
});

export const selectExperimentQueries = createSelector(selectExperimentState, (state, { experimentId }) => {
  if (state.entities[experimentId]) {
    return state.entities[experimentId].queries;
  }
  return null;
});

export const selectIsLoadingExperimentDelete = createSelector(
  selectExperimentState,
  (state) => state.isLoadingExperimentDelete
);

export const selectExperimentOverviewDetails = createSelector(selectSelectedExperiment, (experiment) => {
  // Format Unit of Assignment based on the assignment unit type
  const formatUnitOfAssignment = (): string => {
    const baseUnit = ASSIGNMENT_UNIT_DISPLAY_MAP[experiment?.assignmentUnit];

    if (experiment?.assignmentUnit === ASSIGNMENT_UNIT.GROUP) {
      return `${baseUnit} (${experiment.group})`;
    }
    if (experiment?.assignmentUnit === ASSIGNMENT_UNIT.WITHIN_SUBJECTS) {
      return `${baseUnit} (${CONDITION_ORDER_DISPLAY_MAP[experiment.conditionOrder]})`;
    }
    return baseUnit;
  };

  return {
    ['Description']: experiment?.description,
    ['App Context']: experiment?.context?.[0],
    ['Experiment Type']: experiment?.type,
    ['Unit Of Assignment']: formatUnitOfAssignment(),
    ['Consistency Rule']: CONSISTENCY_RULE_DISPLAY_MAP[experiment?.consistencyRule] || experiment?.consistencyRule,
    ['Assignment Algorithm']:
      ASSIGNMENT_ALGORITHM_DISPLAY_MAP[experiment?.assignmentAlgorithm] || experiment?.assignmentAlgorithm,
    ['Tags']: experiment?.tags,
  };
});

export const selectIsPollingExperimentDetailStats = createSelector(
  selectExperimentState,
  (state) => state.isPollingExperimentDetailStats
);

export const selectExperimentInclusions = createSelector(
  selectSelectedExperiment,
  (experiment: Experiment): ParticipantListTableRow[] => {
    if (!experiment?.experimentSegmentInclusion?.length) {
      return [];
    }
    return experiment.experimentSegmentInclusion
      .filter((inclusion) => inclusion.segment)
      .sort((a, b) => new Date(a.segment.createdAt).getTime() - new Date(b.segment.createdAt).getTime())
      .map((inclusion) => ({
        segment: inclusion.segment,
        listType: inclusion.segment.listType,
      }));
  }
);

export const selectExperimentInclusionsLength = createSelector(
  selectExperimentInclusions,
  (inclusions) => inclusions.length
);

export const selectExperimentExclusions = createSelector(
  selectSelectedExperiment,
  (experiment: Experiment): ParticipantListTableRow[] => {
    if (!experiment?.experimentSegmentExclusion?.length) {
      return [];
    }
    return experiment.experimentSegmentExclusion
      .filter((exclusion) => exclusion.segment)
      .sort((a, b) => new Date(a.segment.createdAt).getTime() - new Date(b.segment.createdAt).getTime())
      .map((exclusion) => ({
        segment: exclusion.segment,
        listType: exclusion.segment.listType,
      }));
  }
);

export const selectExperimentExclusionsLength = createSelector(
  selectExperimentExclusions,
  (exclusions) => exclusions.length
);
