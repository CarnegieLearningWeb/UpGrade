import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ExperimentDesignStepperState, State } from './experiment-design-stepper.model';

export const selectExperimentDesignStepperState = createFeatureSelector<State, ExperimentDesignStepperState>(
  'experimentDesignStepper'
);

export const selectIsAliasTableEditMode = createSelector(
  selectExperimentDesignStepperState,
  (state) => state.isAliasTableEditMode
);

export const selectAliasTableEditIndex = createSelector(
  selectExperimentDesignStepperState,
  (state) => state.aliasTableEditIndex
);

export const selecthasExperimentStepperDataChanged = createSelector(
  selectExperimentDesignStepperState,
  (state) => state.hasExperimentStepperDataChanged
);

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

export const selectIsConditionsTableEditMode = createSelector(
  selectExperimentDesignStepperState,
  (state) => state.isConditionsTableEditMode
);

export const selectConditionsTableEditIndex = createSelector(
  selectExperimentDesignStepperState,
  (state) => state.conditionsTableEditIndex
);

export const selectIsFormLockedForEdit = createSelector(selectExperimentDesignStepperState, (state) => {
  const lockSources = [
    state.isAliasTableEditMode,
    state.isDecisionPointsTableEditMode,
    state.isConditionsTableEditMode,
    state.isFactorialConditionsTableEditMode,
  ];
  return lockSources.some((lockSource) => !!lockSource);
});

export const selectConditionsEditModePreviousRowData = createSelector(
  selectExperimentDesignStepperState,
  (state) => state.conditionsEditModePreviousRowData
);

export const selectFactorialDesignData = createSelector(
  selectExperimentDesignStepperState,
  (state) => state.factorialDesignData
);

export const selectFactorialConditionTableData = createSelector(
  selectExperimentDesignStepperState,
  (state) => state.factorialConditionsTableData
);

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
