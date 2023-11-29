import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ExperimentDesignStepperState, State } from './experiment-design-stepper.model';

// Generic Selectors:
export const selectExperimentDesignStepperState =
  createFeatureSelector<ExperimentDesignStepperState>('experimentDesignStepper');

export const selecthasExperimentStepperDataChanged = createSelector(
  selectExperimentDesignStepperState,
  (state) => state.hasExperimentStepperDataChanged
);

export const selectIsFormLockedForEdit = createSelector(selectExperimentDesignStepperState, (state) => {
  const lockSources = [
    // Common for Simple and Factorial Experiment:
    state.isDecisionPointsTableEditMode,
    // Simple Experiment:
    state.isSimpleExperimentPayloadTableEditMode,
    state.isConditionsTableEditMode,
    // Factorial Experiment:
    state.isFactorialConditionsTableEditMode,
    state.isFactorialFactorsTableEditMode,
    state.isFactorialLevelsTableEditMode,
  ];
  return lockSources.some((lockSource) => !!lockSource);
});

// Data Selectors:
export const selectSimpleExperimentDesignData = createSelector(
  selectExperimentDesignStepperState,
  (state) => state.simpleExperimentDesignData
);

export const selectFactorialDesignData = createSelector(
  selectExperimentDesignStepperState,
  (state) => state.factorialExperimentDesignData
);

export const selectFactorialFactorDesignData = createSelector(
  selectExperimentDesignStepperState,
  (state) => state.factorialFactorsTableData
);

export const selectFactorialLevelDesignData = createSelector(
  selectExperimentDesignStepperState,
  (state) => state.factorialLevelsTableData
);

export const selectSimpleExperimentPayloadTableData = createSelector(
  selectExperimentDesignStepperState,
  (state) => state.simpleExperimentPayloadTableData
);

export const selectFactorialConditionTableData = createSelector(
  selectExperimentDesignStepperState,
  (state) => state.factorialConditionsTableData
);

// Common Selectors for Simple and Factorial:
// Decision Point Table Selectors:
export const selectIsDecisionPointsTableEditMode = createSelector(
  selectExperimentDesignStepperState,
  (state) => state.isDecisionPointsTableEditMode
);

export const selectDecisionPointsTableEditIndex = createSelector(
  selectExperimentDesignStepperState,
  (state) => state.decisionPointsTableEditIndex
);

export const selectDecisionPointsEditModePreviousRowData = createSelector(
  selectExperimentDesignStepperState,
  (state) => state.decisionPointsEditModePreviousRowData
);

// Simple Experiment Selectors:
// Condition Table Selectors:
export const selectIsConditionsTableEditMode = createSelector(
  selectExperimentDesignStepperState,
  (state) => state.isConditionsTableEditMode
);

export const selectConditionsTableEditIndex = createSelector(
  selectExperimentDesignStepperState,
  (state) => state.conditionsTableEditIndex
);

export const selectConditionsEditModePreviousRowData = createSelector(
  selectExperimentDesignStepperState,
  (state) => state.conditionsEditModePreviousRowData
);

// Payload Table Selectors:
export const selectIsSimpleExperimentPayloadTableEditMode = createSelector(
  selectExperimentDesignStepperState,
  (state) => state.isSimpleExperimentPayloadTableEditMode
);

export const selectSimpleExperimentPayloadTableEditIndex = createSelector(
  selectExperimentDesignStepperState,
  (state) => state.simpleExperimentPayloadTableEditIndex
);

// Factorial Experiment Selectors:
// Condition Table Selectors:
export const selectIsFactorialConditionsTableEditMode = createSelector(
  selectExperimentDesignStepperState,
  (state) => state.isFactorialConditionsTableEditMode
);

export const selectFactorialConditionsTableEditIndex = createSelector(
  selectExperimentDesignStepperState,
  (state) => state.factorialConditionsTableEditIndex
);

export const selectFactorialConditionsEditModePreviousRowData = createSelector(
  selectExperimentDesignStepperState,
  (state) => state.factorialConditionsEditModePreviousRowData
);

// Level Table Selectors:
export const selectIsFactorialLevelsTableEditMode = createSelector(
  selectExperimentDesignStepperState,
  (state) => state.isFactorialLevelsTableEditMode
);

export const selectFactorialLevelsTableEditIndex = createSelector(
  selectExperimentDesignStepperState,
  (state) => state.factorialLevelsTableEditIndex
);

export const selectFactorialLevelsEditModePreviousRowData = createSelector(
  selectExperimentDesignStepperState,
  (state) => state.factorialLevelsEditModePreviousRowData
);

// Factor Table Selectors:
export const selectIsFactorialFactorsTableEditMode = createSelector(
  selectExperimentDesignStepperState,
  (state) => state.isFactorialFactorsTableEditMode
);

export const selectFactorialFactorsTableEditIndex = createSelector(
  selectExperimentDesignStepperState,
  (state) => state.factorialFactorsTableEditIndex
);

export const selectFactorialFactorsTableIndex = createSelector(
  selectExperimentDesignStepperState,
  (state) => state.factorialFactorsTableIndex
);

export const selectFactorialFactorsEditModePreviousRowData = createSelector(
  selectExperimentDesignStepperState,
  (state) => state.factorialFactorsEditModePreviousRowData
);
