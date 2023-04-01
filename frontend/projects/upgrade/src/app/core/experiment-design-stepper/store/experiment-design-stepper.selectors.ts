import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ExperimentDesignStepperState, State } from './experiment-design-stepper.model';

export const selectExperimentDesignStepperState = createFeatureSelector<State, ExperimentDesignStepperState>(
  'experimentDesignStepper'
);

export const selectIsSimpleExperimentAliasTableEditMode = createSelector(
  selectExperimentDesignStepperState,
  (state) => state.isSimpleExperimentAliasTableEditMode
);

export const selectSimpleExperimentAliasTableEditIndex = createSelector(
  selectExperimentDesignStepperState,
  (state) => state.simpleExperimentAliasTableEditIndex
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

export const selectIsLevelsTableEditMode = createSelector(
  selectExperimentDesignStepperState,
  (state) => state.isLevelsTableEditMode
);

export const selectConditionsTableEditIndex = createSelector(
  selectExperimentDesignStepperState,
  (state) => state.conditionsTableEditIndex
);

export const selectLevelsTableEditIndex = createSelector(
  selectExperimentDesignStepperState,
  (state) => state.levelsTableEditIndex
);
export const selectIsFormLockedForEdit = createSelector(selectExperimentDesignStepperState, (state) => {
  const lockSources = [
    state.isSimpleExperimentAliasTableEditMode,
    state.isDecisionPointsTableEditMode,
    state.isConditionsTableEditMode,
    state.isFactorialConditionsTableEditMode,
    state.isFactorialLevelsTableEditMode
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

export const selectSimpleExperimentDesignData = createSelector(
  selectExperimentDesignStepperState,
  (state) => state.simpleExperimentDesignData
);

export const selectSimpleExperimentAliasTableData = createSelector(
  selectExperimentDesignStepperState,
  (state) => state.simpleExperimentAliasTableData
);

export const selectFactorialConditionTableData = createSelector(
  selectExperimentDesignStepperState,
  (state) => state.factorialConditionsTableData
);

export const selectIsFactorialConditionsTableEditMode = createSelector(
  selectExperimentDesignStepperState,
  (state) => state.isFactorialConditionsTableEditMode
);

export const selectIsFactorialLevelsTableEditMode = createSelector(
  selectExperimentDesignStepperState,
  (state) => state.isFactorialLevelsTableEditMode
);

export const selectFactorialConditionsTableEditIndex = createSelector(
  selectExperimentDesignStepperState,
  (state) => state.factorialConditionsTableEditIndex
);

export const selectFactorialLevelsTableEditIndex = createSelector(
  selectExperimentDesignStepperState,
  (state) => state.factorialLevelsTableEditIndex
);

export const selectFactorialConditionsEditModePreviousRowData = createSelector(
  selectExperimentDesignStepperState,
  (state) => state.factorialConditionsEditModePreviousRowData
);
