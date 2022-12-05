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
