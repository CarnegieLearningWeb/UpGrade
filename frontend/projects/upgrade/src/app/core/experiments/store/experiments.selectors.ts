import { createSelector, createFeatureSelector } from '@ngrx/store';
import { selectAll } from './experiments.reducer';
import {
  EXPERIMENT_SEARCH_KEY,
  ExperimentState,
  Experiment,
  ExperimentVM,
  StartExperimentValidation,
  EXPERIMENT_STATE,
  ExperimentActionButton,
  EXPERIMENT_ACTION_BUTTON_TYPE,
  EXPERIMENT_OVERVIEW_LABELS,
  CurrentPosteriorsTableRow,
} from './experiments.model';
import { selectRouterState } from '../../core.state';
import { ParticipantListTableRow } from '../../feature-flags/store/feature-flags.model';
import {
  ASSIGNMENT_UNIT,
  ASSIGNMENT_ALGORITHM,
  ASSIGNMENT_ALGORITHM_DISPLAY_MAP,
  CONDITION_ORDER_DISPLAY_MAP,
  CONSISTENCY_RULE_DISPLAY_MAP,
  ASSIGNMENT_UNIT_DISPLAY_MAP,
} from 'upgrade_types';
import { determineWeightingMethod, isWeightSumValid } from '../condition-helper.service';
import { formatTSConfigurablePolicyParamDetails } from '../mooclet-helper.service';
import { KeyValueFormat } from '../../../shared-standalone-component-lib/components/common-section-card-overview-details/common-section-card-overview-details.component';

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
  (routerState, experimentState): ExperimentVM | undefined => {
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

      const weightingMethod = determineWeightingMethod(experiment.conditions || []);

      return { ...experiment, stat, weightingMethod };
    }
    return undefined;
  }
);

export const selectConditionWeightsValid = createSelector(selectSelectedExperiment, (experiment): boolean => {
  return isWeightSumValid(experiment?.conditions || []);
});

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

export const selectIsLoadingImportExperiment = createSelector(
  selectExperimentState,
  (state) => state.isLoadingImportExperiment
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

  const details: KeyValueFormat = {
    [EXPERIMENT_OVERVIEW_LABELS.DESCRIPTION]: experiment?.description,
    [EXPERIMENT_OVERVIEW_LABELS.APP_CONTEXT]: experiment?.context?.[0],
    [EXPERIMENT_OVERVIEW_LABELS.EXPERIMENT_TYPE]: experiment?.type,
    [EXPERIMENT_OVERVIEW_LABELS.UNIT_OF_ASSIGNMENT]: formatUnitOfAssignment(),
    [EXPERIMENT_OVERVIEW_LABELS.CONSISTENCY_RULE]:
      CONSISTENCY_RULE_DISPLAY_MAP[experiment?.consistencyRule] || experiment?.consistencyRule,
    [EXPERIMENT_OVERVIEW_LABELS.ASSIGNMENT_ALGORITHM]:
      ASSIGNMENT_ALGORITHM_DISPLAY_MAP[experiment?.assignmentAlgorithm] || experiment?.assignmentAlgorithm,
  };

  // Add policy parameters if they exist
  if (experiment?.assignmentAlgorithm === ASSIGNMENT_ALGORITHM.MOOCLET_TS_CONFIGURABLE) {
    details[EXPERIMENT_OVERVIEW_LABELS.ADAPTIVE_ALGORITHM_PARAMETERS] =
      formatTSConfigurablePolicyParamDetails(experiment);
  }

  // Always add tags at the end
  details[EXPERIMENT_OVERVIEW_LABELS.TAGS] = experiment?.tags;

  return details;
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

export const selectExperimentStartValidation = createSelector(
  selectSelectedExperiment,
  (experiment): StartExperimentValidation => {
    if (!experiment) {
      return { isValid: false, reasons: [] };
    }

    const reasons: string[] = [];

    // Check for at least 1 decision point
    if (!experiment.partitions || experiment.partitions.length < 1) {
      reasons.push('decision-points-required');
    }

    // Check for at least 1 condition
    if (!experiment.conditions || experiment.conditions.length < 1) {
      reasons.push('conditions-required');
    }

    // Check if condition weights sum to 100% (using established validation logic)
    if (!isWeightSumValid(experiment.conditions)) {
      reasons.push('weights-must-total-100');
    }

    return {
      isValid: reasons.length === 0,
      reasons,
    };
  }
);

export const selectExperimentActionButtons = createSelector(
  selectSelectedExperiment,
  selectExperimentStartValidation,
  (experiment, validation): ExperimentActionButton[] => {
    if (!experiment) {
      return [];
    }

    const buttons: ExperimentActionButton[] = [];

    switch (experiment.state) {
      case EXPERIMENT_STATE.INACTIVE:
        buttons.push({
          action: EXPERIMENT_ACTION_BUTTON_TYPE.START,
          icon: 'play_arrow',
          disabled: !validation.isValid,
          disabledReasons: validation.isValid ? undefined : validation.reasons,
          translationKey: 'experiments.details.start-experiment.button.text',
        });
        break;

      case EXPERIMENT_STATE.ENROLLING:
        buttons.push(
          {
            action: EXPERIMENT_ACTION_BUTTON_TYPE.PAUSE,
            icon: 'pause',
            disabled: false,
            translationKey: 'experiments.details.pause-experiment.button.text',
          },
          {
            action: EXPERIMENT_ACTION_BUTTON_TYPE.STOP,
            icon: 'stop',
            disabled: false,
            translationKey: 'experiments.details.stop-experiment.button.text',
          }
        );
        break;

      case EXPERIMENT_STATE.ENROLLMENT_COMPLETE:
        buttons.push(
          {
            action: EXPERIMENT_ACTION_BUTTON_TYPE.RESUME,
            icon: 'play_arrow',
            disabled: false,
            translationKey: 'experiments.details.resume-experiment.button.text',
          },
          {
            action: EXPERIMENT_ACTION_BUTTON_TYPE.STOP,
            icon: 'stop',
            disabled: false,
            translationKey: 'experiments.details.stop-experiment.button.text',
          }
        );
        break;

      default:
        break;
    }

    return buttons;
  }
);

export const selectCurrentPosteriorsTableData = createSelector(
  selectSelectedExperiment,
  (experiment: ExperimentVM): CurrentPosteriorsTableRow[] => {
    if (!experiment?.moocletPolicyParameters?.current_posteriors) {
      return [];
    }

    const posteriors = experiment.moocletPolicyParameters.current_posteriors;
    const rows: CurrentPosteriorsTableRow[] = [];

    // Calculate grand total for percentage calculation
    let grandTotalSuccesses = 0;
    let grandTotalFailures = 0;

    Object.values(posteriors).forEach((posterior) => {
      grandTotalSuccesses += posterior.successes;
      grandTotalFailures += posterior.failures;
    });

    const grandTotal = grandTotalSuccesses + grandTotalFailures;

    // Create table rows
    Object.entries(posteriors).forEach(([conditionCode, posterior]) => {
      const total = posterior.successes + posterior.failures;
      const successRate = total > 0 ? (posterior.successes / total) * 100 : 0;
      const percentage = grandTotal > 0 ? (total / grandTotal) * 100 : 0;

      rows.push({
        conditionCode,
        successes: posterior.successes,
        failures: posterior.failures,
        successRate,
        total,
        percentage,
      });
    });

    return rows;
  }
);

export const selectHasExperimentStarted = createSelector(
  selectSelectedExperiment,
  (experiment: ExperimentVM | undefined): boolean => {
    if (!experiment?.stateTimeLogs?.length) {
      return false;
    }

    return experiment.stateTimeLogs.some((log) => log.toState === EXPERIMENT_STATE.ENROLLING);
  }
);
