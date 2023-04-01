import { Action, createReducer, on } from '@ngrx/store';
import { ExperimentDesignStepperState } from './experiment-design-stepper.model';
import * as experimentDesignStepperAction from './experiment-design-stepper.actions';

const initialState: ExperimentDesignStepperState = {
  hasExperimentStepperDataChanged: false,

  simpleExperimentDesignData: { decisionPoints: [], conditions: [] },
  simpleExperimentAliasTableData: [],
  factorialExperimentDesignData: { factors: [] },
  factorialConditionsTableData: [],
  factorialFactorsTableData: [],
  factorialLevelsTableData: [],

  isSimpleExperimentAliasTableEditMode: false,
  simpleExperimentAliasTableEditIndex: null,

  isDecisionPointsTableEditMode: false,
  decisionPointsTableEditIndex: null,
  decisionPointsEditModePreviousRowData: null,

  isConditionsTableEditMode: false,
  conditionsTableEditIndex: null,
  conditionsEditModePreviousRowData: null,

  isFactorialConditionsTableEditMode: false,
  factorialConditionsTableEditIndex: null,
  factorialConditionsEditModePreviousRowData: null,

  isFactorialFactorsTableEditMode: false,
  factorialFactorsTableEditIndex: null,
  factorialFactorsTableIndex: null,
  factorialFactorsEditModePreviousRowData: null,

  isFactorialLevelsTableEditMode: false,
  factorialLevelsTableEditIndex: null,
  factorialLevelsEditModePreviousRowData: null,
};

const reducer = createReducer(
  initialState,
  on(experimentDesignStepperAction.actionUpdateAliasTableEditMode,
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
  on(experimentDesignStepperAction.actionUpdateSimpleExperimentDesignData, (state, { designData }) => ({
    ...state,
    simpleExperimentDesignData: designData,
  })),
  on(experimentDesignStepperAction.actionUpdateSimpleExperimentAliasTableData, (state, { tableData }) => ({
    ...state,
    simpleExperimentAliasTableData: tableData,
  })),
  on(experimentDesignStepperAction.actionUpdateFactorialExperimentDesignData, (state, { designData }) => ({
    ...state,
    factorialExperimentDesignData: designData,
  })),
  on(experimentDesignStepperAction.actionUpdateFactorialConditionTableData, (state, { tableData }) => ({
    ...state,
    factorialConditionsTableData: tableData,
  })),
  on(experimentDesignStepperAction.actionToggleSimpleExperimentAliasTableEditMode,
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
  on(experimentDesignStepperAction.actionToggleDecisionPointsTableEditMode,
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
  on(experimentDesignStepperAction.actionToggleConditionsTableEditMode,
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
  on(experimentDesignStepperAction.actionClearConditionTableEditDetails, (state) => ({
    ...state,
    isConditionsTableEditMode: false,
    conditionsTableEditIndex: null,
    conditionsEditModePreviousRowData: null,
  })),
  on(experimentDesignStepperAction.actionToggleFactorialConditionsTableEditMode,
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
  on(experimentDesignStepperAction.actionClearFactorialConditionTableEditDetails, (state) => ({
    ...state,
    isFactorialConditionsTableEditMode: false,
    factorialConditionsTableEditIndex: null,
    factorialConditionsEditModePreviousRowData: null,
  })),
  on(experimentDesignStepperAction.clearFactorialDesignStepperData, (state) => {
    return {
      ...state,
      factorialExperimentDesignData: { factors: [] },
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
  }),
  on(experimentDesignStepperAction.actionToggleFactorialFactorsTableEditMode,
    (state, { factorialFactorsTableEditIndex, factorialFactorsRowData }) => {
      // toggle edit mode
      const editMode = !state.isFactorialFactorsTableEditMode;

      // if not in edit mode, use null for row-index
      const editIndex = editMode ? factorialFactorsTableEditIndex : null;
      const previousRowData = editMode ? factorialFactorsRowData : null;

      return {
        ...state,
        isFactorialFactorsTableEditMode: editMode,
        factorialFactorsTableEditIndex: editIndex,
        factorialFactorsTableIndex: factorialFactorsTableEditIndex,
        factorialFactorsRowData: previousRowData,
      };
    }
  ),
  on(experimentDesignStepperAction.actionClearFactorialFactorTableEditDetails, (state) => ({
    ...state,
    isFactorialFactorsTableEditMode: false,
    factorialFactorsTableEditIndex: null,
    factorialFactorsRowData: null,
  })),
  on(experimentDesignStepperAction.actionToggleFactorialLevelsTableEditMode,
    (state, { factorialLevelsTableEditIndex, factorialLevelsRowData }) => {
      // toggle edit mode
      const editMode = !state.isFactorialLevelsTableEditMode;
      // if not in edit mode, use null for row-index
      const editIndex = editMode ? factorialLevelsTableEditIndex : null;
      const previousRowData = editMode ? factorialLevelsRowData : null;

      return {
        ...state,
        isFactorialLevelsTableEditMode: editMode,
        factorialLevelsTableEditIndex: editIndex,
        factorialLevelsRowData: previousRowData,
      };
    }
  ),
  on(experimentDesignStepperAction.actionClearFactorialLevelTableEditDetails, (state) => ({
    ...state,
    isFactorialLevelsTableEditMode: false,
    factorialLevelsTableEditIndex: null,
    factorialLevelsRowData: null,
  })),
);

export function experimentDesignStepperReducer(state: ExperimentDesignStepperState | undefined, action: Action) {
  return reducer(state, action);
}
