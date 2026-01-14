/**
 * Pure helper functions for determining UI restrictions based on experiment status.
 */

import {
  EXPERIMENT_STATE,
  EXPERIMENT_SECTION_CARD_TYPE,
  EXPERIMENT_DETAILS_PAGE_ACTIONS,
} from './store/experiments.model';

export interface SectionCardRestriction {
  isDisabled: boolean;
  tooltipKey?: string;
  shouldHideActions?: boolean;
}

// Check if menu item should be disabled based on experiment state
export function isMenuItemDisabled(action: EXPERIMENT_DETAILS_PAGE_ACTIONS, state?: EXPERIMENT_STATE): boolean {
  if (!state) {
    return true; // No state = disabled
  }

  // Archive only enabled when CANCELLED
  if (action === EXPERIMENT_DETAILS_PAGE_ACTIONS.ARCHIVE) {
    return state !== EXPERIMENT_STATE.CANCELLED;
  }

  // All other menu items enabled in these states
  const enabledStates = [
    EXPERIMENT_STATE.INACTIVE,
    EXPERIMENT_STATE.ENROLLING,
    EXPERIMENT_STATE.ENROLLMENT_COMPLETE,
    EXPERIMENT_STATE.CANCELLED,
    EXPERIMENT_STATE.ARCHIVED,
  ];

  return !enabledStates.includes(state);
}

// Get list of fields to disable in edit modal based on experiment state
export function getDisabledFields(state?: EXPERIMENT_STATE): string[] {
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

  if ([EXPERIMENT_STATE.ENROLLING, EXPERIMENT_STATE.ENROLLMENT_COMPLETE].includes(state)) {
    return baseRestrictedFields;
  }

  if ([EXPERIMENT_STATE.CANCELLED, EXPERIMENT_STATE.ARCHIVED].includes(state)) {
    return [...baseRestrictedFields, 'moocletPolicyParameters'];
  }

  return baseRestrictedFields;
}

// Get section card restriction based on experiment state
export function getSectionCardRestriction(
  cardType: EXPERIMENT_SECTION_CARD_TYPE,
  state?: EXPERIMENT_STATE
): SectionCardRestriction {
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
  if (state === EXPERIMENT_STATE.CANCELLED) {
    return {
      isDisabled: true,
      tooltipKey: 'experiments.details.restrictions.experiment-completed.text',
    };
  }

  // Running/Paused: Only Decision Points & Conditions disabled
  if ([EXPERIMENT_STATE.ENROLLING, EXPERIMENT_STATE.ENROLLMENT_COMPLETE].includes(state)) {
    const isRestrictedCard = [
      EXPERIMENT_SECTION_CARD_TYPE.DECISION_POINTS,
      EXPERIMENT_SECTION_CARD_TYPE.CONDITIONS,
    ].includes(cardType);

    if (isRestrictedCard) {
      const statusSuffix = state === EXPERIMENT_STATE.ENROLLING ? 'running' : 'paused';
      return {
        isDisabled: true,
        tooltipKey: `experiments.details.restrictions.${cardType}-${statusSuffix}.text`,
      };
    }
  }

  return { isDisabled: false };
}
