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
  EXPERIMENT_SECTION_CARD_TYPE,
  EXPERIMENT_DETAILS_PAGE_ACTIONS,
  SectionCardRestriction,
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
  FILTER_MODE,
} from 'upgrade_types';
import { determineWeightingMethod, isWeightSumValid } from '../condition-helper.service';
import { formatTSConfigurablePolicyParamDetails } from '../mooclet-helper.service';
import { KeyValueFormat } from '../../../shared-standalone-component-lib/components/common-section-card-overview-details/common-section-card-overview-details.component';
import { ExperimentRewardsSummary } from '../../../../../../../../types/src/Mooclet';

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

      case EXPERIMENT_STATE.RUNNING:
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

      case EXPERIMENT_STATE.PAUSED:
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

export const selectRewardsDataForSelectedExperiment = createSelector(
  selectSelectedExperiment,
  selectExperimentState,
  (experiment: ExperimentVM, state: ExperimentState): ExperimentRewardsSummary => {
    return state.rewardsSummaries[experiment.id] || [];
  }
);

export const selectIsLoadingRewardsSummary = createSelector(
  selectExperimentState,
  (state: ExperimentState): boolean => {
    return state.isLoadingRewardsSummary;
  }
);

// Warning logic for experiments
const hasNoInclusionsWarning = (experiment: Experiment): boolean => {
  return (
    experiment?.state === EXPERIMENT_STATE.RUNNING &&
    experiment?.filterMode !== FILTER_MODE.INCLUDE_ALL &&
    (!experiment?.experimentSegmentInclusion || experiment.experimentSegmentInclusion.length === 0)
  );
};

const getWarningKeysForExperiment = (experiment: Experiment): string[] => {
  const warnings: string[] = [];

  // Check each warning type (in future more types can be added here)
  if (hasNoInclusionsWarning(experiment)) {
    warnings.push('global.no-participants-included-warning.text');
  }

  return warnings;
};

export const selectWarningKeysForSelectedExperiment = createSelector(
  selectSelectedExperiment,
  (experiment): string[] => {
    if (!experiment) {
      return [];
    }
    return getWarningKeysForExperiment(experiment);
  }
);

export const selectWarningKeysForAllExperiments = createSelector(
  selectAllExperiment,
  (experiments): Record<string, string[]> => {
    const warningMap: Record<string, string[]> = {};
    experiments.forEach((experiment) => {
      warningMap[experiment.id] = getWarningKeysForExperiment(experiment);
    });
    return warningMap;
  }
);

export const selectHasExperimentStarted = createSelector(
  selectSelectedExperiment,
  (experiment: ExperimentVM | undefined): boolean => {
    if (!experiment?.stateTimeLogs?.length) {
      return false;
    }

    return experiment.stateTimeLogs.some((log) => log.toState === EXPERIMENT_STATE.RUNNING);
  }
);

// Get list of fields to disable in edit modal based on experiment state
export const selectDisabledExperimentFields = createSelector(selectSelectedExperiment, (experiment): string[] => {
  const state = experiment?.state;

  if (!state || state === EXPERIMENT_STATE.INACTIVE) {
    return [];
  }

  const baseRestrictedFields = [
    'appContext',
    'experimentType',
    'unitOfAssignment',
    'consistencyRule',
    'conditionOrder',
    'assignmentAlgorithm',
    'groupType',
  ];

  if ([EXPERIMENT_STATE.RUNNING, EXPERIMENT_STATE.PAUSED].includes(state)) {
    return baseRestrictedFields;
  }

  if ([EXPERIMENT_STATE.COMPLETED, EXPERIMENT_STATE.ARCHIVED].includes(state)) {
    return [...baseRestrictedFields, 'moocletPolicyParameters'];
  }

  return baseRestrictedFields;
});

// Get section card restriction based on experiment state (factory selector)
export const selectSectionCardRestriction = (cardType: EXPERIMENT_SECTION_CARD_TYPE) =>
  createSelector(selectSelectedExperiment, (experiment): SectionCardRestriction => {
    const state = experiment?.state;

    if (!state || state === EXPERIMENT_STATE.INACTIVE) {
      return { isDisabled: false };
    }

    // Archived: Hide all actions
    if (state === EXPERIMENT_STATE.ARCHIVED) {
      return {
        isDisabled: true,
        shouldHideActions: true,
        tooltipKey: 'experiments.details.restrictions.experiment-archived.text',
      };
    }

    // Completed: All cards disabled
    if (state === EXPERIMENT_STATE.COMPLETED) {
      return {
        isDisabled: true,
        tooltipKey: 'experiments.details.restrictions.experiment-completed.text',
      };
    }

    // Running/Paused: Only Decision Points & Conditions disabled
    if ([EXPERIMENT_STATE.RUNNING, EXPERIMENT_STATE.PAUSED].includes(state)) {
      const isRestrictedCard = [
        EXPERIMENT_SECTION_CARD_TYPE.DECISION_POINTS,
        EXPERIMENT_SECTION_CARD_TYPE.CONDITIONS,
      ].includes(cardType);

      if (isRestrictedCard) {
        const statusSuffix = state === EXPERIMENT_STATE.RUNNING ? 'running' : 'paused';
        return {
          isDisabled: true,
          tooltipKey: `experiments.details.restrictions.${cardType}-${statusSuffix}.text`,
        };
      }
    }

    return { isDisabled: false };
  });

// Check if menu item should be disabled based on experiment state
const isMenuItemDisabled = (action: EXPERIMENT_DETAILS_PAGE_ACTIONS, state?: EXPERIMENT_STATE): boolean => {
  if (!state) {
    return true; // No state = disabled
  }

  // Archive only enabled when COMPLETED
  if (action === EXPERIMENT_DETAILS_PAGE_ACTIONS.ARCHIVE) {
    return state !== EXPERIMENT_STATE.COMPLETED;
  }

  // All other menu items enabled in these states
  const enabledStates = [
    EXPERIMENT_STATE.INACTIVE,
    EXPERIMENT_STATE.RUNNING,
    EXPERIMENT_STATE.PAUSED,
    EXPERIMENT_STATE.COMPLETED,
    EXPERIMENT_STATE.ARCHIVED,
  ];

  return !enabledStates.includes(state);
};

// Get menu items with disabled state and permissions logic integrated
export const selectExperimentMenuItems = createSelector(
  selectSelectedExperiment,
  (experiment): Array<{ action: EXPERIMENT_DETAILS_PAGE_ACTIONS; disabled: boolean }> => {
    const state = experiment?.state;

    return [
      {
        action: EXPERIMENT_DETAILS_PAGE_ACTIONS.EDIT,
        disabled: isMenuItemDisabled(EXPERIMENT_DETAILS_PAGE_ACTIONS.EDIT, state),
      },
      {
        action: EXPERIMENT_DETAILS_PAGE_ACTIONS.DUPLICATE,
        disabled: isMenuItemDisabled(EXPERIMENT_DETAILS_PAGE_ACTIONS.DUPLICATE, state),
      },
      {
        action: EXPERIMENT_DETAILS_PAGE_ACTIONS.EXPORT_DESIGN,
        disabled: isMenuItemDisabled(EXPERIMENT_DETAILS_PAGE_ACTIONS.EXPORT_DESIGN, state),
      },
      {
        action: EXPERIMENT_DETAILS_PAGE_ACTIONS.EMAIL_DATA,
        disabled: isMenuItemDisabled(EXPERIMENT_DETAILS_PAGE_ACTIONS.EMAIL_DATA, state),
      },
      {
        action: EXPERIMENT_DETAILS_PAGE_ACTIONS.ARCHIVE,
        disabled: isMenuItemDisabled(EXPERIMENT_DETAILS_PAGE_ACTIONS.ARCHIVE, state),
      },
      {
        action: EXPERIMENT_DETAILS_PAGE_ACTIONS.DELETE,
        disabled: isMenuItemDisabled(EXPERIMENT_DETAILS_PAGE_ACTIONS.DELETE, state),
      },
    ];
  }
);
