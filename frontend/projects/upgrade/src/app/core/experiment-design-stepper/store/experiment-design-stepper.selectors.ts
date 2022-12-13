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

export const selectIsConditionsTableEditMode = createSelector(
  selectExperimentDesignStepperState,
  (state) => state.isConditionsTableEditMode
);

export const selectConditionsTableEditIndex = createSelector(
  selectExperimentDesignStepperState,
  (state) => state.conditionsTableEditIndex
);

export const selectIsFormLockedForEdit = createSelector(selectExperimentDesignStepperState, (state) => {
  const lockSources = [state.isAliasTableEditMode, state.isConditionsTableEditMode];
  return lockSources.some(Boolean);
});
