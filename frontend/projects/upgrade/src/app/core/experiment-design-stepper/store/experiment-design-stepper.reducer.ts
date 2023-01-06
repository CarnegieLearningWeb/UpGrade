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
  factorialDesignData: { factors: [] },
  factorialConditionsTableData: [],
  isFactorialConditionsTableEditMode: false,
  factorialConditionsTableEditIndex: null,
  factorialConditionsEditModePreviousRowData: null,
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
    experimentDesignStepperAction.actionToggleConditionsTableEditMode,
    (state, { conditionsTableEditIndex, conditionsRowData }) => {
      // toggle edit mode
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
  on(experimentDesignStepperAction.actionClearFactorialConditionTableEditDetails, (state) => ({
    ...state,
    isFactorialConditionsTableEditMode: false,
    factorialConditionsTableEditIndex: null,
    factorialConditionsEditModePreviousRowData: null,
  })),
  on(
    experimentDesignStepperAction.actionToggleFactorialConditionsTableEditMode,
    (state, { factorialConditionsTableEditIndex, factorialConditionsRowData }) => {
      // toggle edit mode
      const editMode = !state.isFactorialConditionsTableEditMode;

      // if not in edit mode, use null for row-index
      const editIndex = editMode ? factorialConditionsTableEditIndex : null;
      const previousRowData = editMode ? factorialConditionsRowData : null;

      return {
        ...state,
        isFactorialConditionsTableEditMode: editMode,
        factorialConditionsTableEditIndex: editIndex,
        factorialConditionsEditModePreviousRowData: previousRowData,
      };
    }
  ),
  on(experimentDesignStepperAction.actionClearConditionTableEditDetails, (state) => ({
    ...state,
    isConditionsTableEditMode: false,
    conditionsTableEditIndex: null,
    conditionsEditModePreviousRowData: null,
  })),
  on(experimentDesignStepperAction.actionUpdateFactorialDesignData, (state, { designData }) => ({
    ...state,
    factorialDesignData: designData,
  })),
  on(experimentDesignStepperAction.actionUpdateFactorialTableData, (state, { tableData }) => ({
    ...state,
    factorialConditionsTableData: tableData,
  })),
  on(experimentDesignStepperAction.clearFactorialDesignStepperData, (state) => {
    return {
      ...state,
      factorialDesignData: { factors: [] },
      factorialConditionsTableData: [],
    };
  })
);

export function experimentDesignStepperReducer(state: ExperimentDesignStepperState | undefined, action: Action) {
  return reducer(state, action);
}
