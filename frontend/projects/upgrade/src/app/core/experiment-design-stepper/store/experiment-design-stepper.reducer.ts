import { Action, createReducer, on } from '@ngrx/store';
import { ExperimentDesignStepperState } from './experiment-design-stepper.model';
import * as experimentDesignStepperAction from './experiment-design-stepper.actions';

const initialState: ExperimentDesignStepperState = {
  isAliasTableEditMode: false,
  isConditionsTableEditMode: false,
  aliasTableEditIndex: null,
  conditionsTableEditIndex: null,
  conditionsEditModePreviousRowData: null,
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
    (state, { conditionsTableEditIndex, conditionsRowData }) => {
      // toggle previous value
      const editMode = !state.isConditionsTableEditMode;

      // if not in edit mode, use null for row-index
      const editIndex = editMode ? conditionsTableEditIndex : null;
      const previousRowData = editMode ? conditionsRowData : null;

      return {
        ...state,
        isConditionsTableEditMode: editMode,
        conditionsTableEditIndex: editIndex,
        conditionsEditModePreviousRowData: previousRowData,
      };
    }
  ),
  on(experimentDesignStepperAction.actionClearConditionTableEditDetails, (state) => ({
    ...state,
    isConditionsTableEditMode: false,
    conditionsTableEditIndex: null,
    conditionsEditModePreviousRowData: null,
  }))
);

export function experimentDesignStepperReducer(state: ExperimentDesignStepperState | undefined, action: Action) {
  return reducer(state, action);
}
