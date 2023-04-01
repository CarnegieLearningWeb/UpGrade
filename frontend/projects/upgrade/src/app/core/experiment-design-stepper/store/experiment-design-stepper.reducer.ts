import { Action, createReducer, on } from '@ngrx/store';
import { ExperimentDesignStepperState } from './experiment-design-stepper.model';
import * as experimentDesignStepperAction from './experiment-design-stepper.actions';

const initialState: ExperimentDesignStepperState = {
  isSimpleExperimentAliasTableEditMode: false,
  isDecisionPointsTableEditMode: false,
  isConditionsTableEditMode: false,
  simpleExperimentAliasTableEditIndex: null,
  decisionPointsTableEditIndex: null,
  conditionsTableEditIndex: null,
  decisionPointsEditModePreviousRowData: null,
  conditionsEditModePreviousRowData: null,
  hasExperimentStepperDataChanged: false,
  simpleExperimentDesignData: { decisionPoints: [], conditions: [] },
  simpleExperimentAliasTableData: [],
  factorialDesignData: { factors: [] },
  factorialConditionsTableData: [],
  isFactorialConditionsTableEditMode: false,
  isFactorialLevelsTableEditMode: false,
  factorialConditionsTableEditIndex: null,
  factorialLevelsTableEditIndex: null,
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
    experimentDesignStepperAction.actionToggleDecisionPointsTableEditMode,
    (state, { decisionPointsTableEditIndex, decisionPointsRowData }) => {
      // toggle edit mode
      const editMode = !state.isDecisionPointsTableEditMode;

      // if not in edit mode, use null for row-index
      const editIndex = editMode ? decisionPointsTableEditIndex : null;
      const previousRowData = editMode ? decisionPointsRowData : null;

      return {
        ...state,
        isDecisionPointsTableEditMode: editMode,
        decisionPointsTableEditIndex: editIndex,
        decisionPointsEditModePreviousRowData: previousRowData,
      };
    }
  ),
  on(experimentDesignStepperAction.actionClearDecisionPointTableEditDetails, (state) => ({
    ...state,
    isDecisionPointsTableEditMode: false,
    decisionPointsTableEditIndex: null,
    decisionPointsEditModePreviousRowData: null,
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
  on(
    experimentDesignStepperAction.actionUpdateSimpleExperimentAliasTableEditModeDetails,
    (state, { simpleExperimentAliasTableEditIndex }): ExperimentDesignStepperState => {
      // toggle edit mode
      const editMode = !state.isSimpleExperimentAliasTableEditMode;

      // if not in edit mode, use null for row-index
      const editIndex = editMode ? simpleExperimentAliasTableEditIndex : null;

      return {
        ...state,
        isSimpleExperimentAliasTableEditMode: editMode,
        simpleExperimentAliasTableEditIndex: editIndex,
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
  on(experimentDesignStepperAction.actionUpdateSimpleExperimentDesignData, (state, { designData }) => ({
    ...state,
    simpleExperimentDesignData: designData,
  })),
  on(experimentDesignStepperAction.actionUpdateSimpleExperimentAliasTableData, (state, { tableData }) => ({
    ...state,
    simpleExperimentAliasTableData: tableData,
  })),
  on(experimentDesignStepperAction.actionUpdateFactorialDesignData, (state, { designData }) => ({
    ...state,
    factorialDesignData: designData,
  })),
  on(experimentDesignStepperAction.actionUpdateFactorialConditionTableData, (state, { tableData }) => ({
    ...state,
    factorialConditionsTableData: tableData,
  })),
  on(experimentDesignStepperAction.clearFactorialDesignStepperData, (state) => {
    return {
      ...state,
      factorialDesignData: { factors: [] },
      factorialConditionsTableData: [],
    };
  }),
  on(experimentDesignStepperAction.clearSimpleExperimentDesignStepperData, (state) => {
    return {
      ...state,
      simpleExperimentDesignData: { decisionPoints: [], conditions: [] },
      simpleExperimentAliasTableData: [],
      simpleExperimentAliasTableEditIndex: null,
      isSimpleExperimentAliasTableEditMode: false,
    };
  })
);

export function experimentDesignStepperReducer(state: ExperimentDesignStepperState | undefined, action: Action) {
  return reducer(state, action);
}
