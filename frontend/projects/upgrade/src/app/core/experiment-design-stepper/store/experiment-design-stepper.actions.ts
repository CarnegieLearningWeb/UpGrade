import { createAction, props } from '@ngrx/store';
import {
  DecisionPointsTableRowData,
  ConditionsTableRowData,
  ExperimentFactorialDesignData,
  FactorialConditionTableRowData,
  FactorialFactorTableRowData,
  SimpleExperimentDesignData,
  SimpleExperimentPayloadTableRowData,
  FactorialLevelTableRowData,
} from './experiment-design-stepper.model';

export const experimentStepperDataChanged = createAction(
  '[Experiment-Design-Stepper] turn isExperimentStepperDataChanged true'
);

export const experimentStepperDataReset = createAction(
  '[Experiment-Design-Stepper] turn isExperimentStepperDataChanged false'
);

export const actionUpdateSimpleExperimentDesignData = createAction(
  '[Experiment-Design-Stepper] update simple experiment design data',
  props<{ designData: SimpleExperimentDesignData }>()
);

export const actionUpdateFactorialExperimentDesignData = createAction(
  '[Experiment-Design-Stepper] update factorial experiment design data',
  props<{ designData: ExperimentFactorialDesignData }>()
);

export const clearSimpleExperimentDesignStepperData = createAction(
  `[Experiment-Design-Stepper] Clear Simple Experiment Design Data`
);

export const clearFactorialDesignStepperData = createAction(
  `[Experiment-Design-Stepper] Clear Factorial Experiment Design Data`
);

// Payload Table
export const actionUpdatePayloadTableEditMode = createAction(
  '[Experiment-Design-Stepper] Update Payload Table Edit Mode Details',
  props<{ isPayloadTableEditMode: boolean; payloadTableEditIndex: number | null }>()
);

export const actionToggleSimpleExperimentPayloadTableEditMode = createAction(
  '[Experiment-Design-Stepper] Update Simple Experiment Payload Table Edit Mode Details',
  props<{
    simpleExperimentPayloadTableEditIndex: number | null;
    isNgDestroyCall: boolean;
  }>()
);

export const actionUpdateSimpleExperimentPayloadTableData = createAction(
  '[Experiment-Design-Stepper] Update Simple Experiment Payload Table Data',
  props<{ tableData: SimpleExperimentPayloadTableRowData[] }>()
);

// Decision Point Table
export const actionToggleDecisionPointsTableEditMode = createAction(
  '[Experiment-Design-Stepper] Update Decision Points Table Edit Mode Details',
  props<{ decisionPointsTableEditIndex: number | null; decisionPointsRowData: DecisionPointsTableRowData }>()
);

export const actionClearDecisionPointTableEditDetails = createAction(
  `[Experiment-Design-Stepper] Clear Decision Point Table Edit Details`
);

// Condition Table
export const actionToggleConditionsTableEditMode = createAction(
  '[Experiment-Design-Stepper] Update Conditions Table Edit Mode Details',
  props<{ conditionsTableEditIndex: number | null; conditionsRowData: ConditionsTableRowData }>()
);

export const actionClearConditionTableEditDetails = createAction(
  `[Experiment-Design-Stepper] Clear Condition Table Edit Details`
);

// Factorial  Condition Table
export const actionToggleFactorialConditionsTableEditMode = createAction(
  '[Experiment-Design-Stepper] Update Factorial Conditions Table Edit Mode Details',
  props<{
    factorialConditionsTableEditIndex: number | null;
    factorialConditionsRowData: FactorialConditionTableRowData;
  }>()
);

export const actionClearFactorialConditionTableEditDetails = createAction(
  `[Experiment-Design-Stepper] Clear Factorial Condition Table Edit Details`
);

export const actionUpdateFactorialConditionTableData = createAction(
  '[Experiment-Design-Stepper] update factorial condition table data',
  props<{ tableData: FactorialConditionTableRowData[] }>()
);

// Factor Table:
export const actionToggleFactorialFactorsTableEditMode = createAction(
  '[Experiment-Design-Stepper] Update Factorial Factors Table Edit Mode Details',
  props<{
    factorialFactorsTableEditIndex: number | null;
    factorialFactorsRowData: FactorialFactorTableRowData;
  }>()
);

export const actionUpdateFactorialFactorsTableIndex = createAction(
  '[Experiment-Design-Stepper] Update Factorial Factors Table Index',
  props<{
    factorialFactorsTableIndex: number | null;
  }>()
);

export const actionClearFactorialFactorTableEditDetails = createAction(
  `[Experiment-Design-Stepper] Clear Factorial Factor Table Edit Details`
);

// Level Table:
export const actionToggleFactorialLevelsTableEditMode = createAction(
  '[Experiment-Design-Stepper] Update Factorial Levels Table Edit Mode Details',
  props<{
    factorialLevelsTableEditIndex: number | null;
    factorialLevelsRowData: FactorialLevelTableRowData;
  }>()
);

export const actionClearFactorialLevelTableEditDetails = createAction(
  `[Experiment-Design-Stepper] Clear Factorial Level Table Edit Details`
);
