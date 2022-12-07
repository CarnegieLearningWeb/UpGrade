import { Action, createReducer, on } from '@ngrx/store';
import { ExperimentDesignStepperState } from './experiment-design-stepper.model';
import * as experimentDesignStepperAction from './experiment-design-stepper.actions';

const initialState: ExperimentDesignStepperState = {
  isAliasTableEditMode: false,
  isConditionsTableEditMode: false,
  aliasTableEditIndex: null,
  conditionsTableEditIndex: null,
  hasExperimentStepperDataChanged: false,
};

const reducer = createReducer(
  initialState,
  on(
    experimentDesignStepperAction.actionUpdateAliasTableEditMode,
    (state, { isAliasTableEditMode, aliasTableEditIndex }) => ({
      ...state,
      isAliasTableEditMode,
      aliasTableEditIndex,
    })
  ),
  on(experimentDesignStepperAction.experimentStepperDataChanged, (state) => ({
    ...state,
    hasExperimentStepperDataChanged: true,
  })),
  on(experimentDesignStepperAction.experimentStepperDataReset, (state) => ({
    ...state,
    hasExperimentStepperDataChanged: false,
  })),
  on(
    experimentDesignStepperAction.actionUpdateConditionsTableEditMode,
    (state, { isConditionsTableEditMode, conditionsTableEditIndex }) => {
      return {
        ...state,
        isConditionsTableEditMode,
        conditionsTableEditIndex,
      };
    }
  )
);

export function experimentDesignStepperReducer(state: ExperimentDesignStepperState | undefined, action: Action) {
  return reducer(state, action);
}
