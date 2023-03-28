import { createAction, props } from '@ngrx/store';
import {
  DecisionPointsTableRowData,
  ConditionsTableRowData,
  ExperimentFactorialDesignData,
  FactorialConditionTableRowData,
  SimpleExperimentDesignData,
  SimpleExperimentAliasTableRow,
  FactorialLevelTableRowData,
  ExperimentLevelFormData,
} from './experiment-design-stepper.model';

export const actionUpdateAliasTableEditMode = createAction(
  '[Experiment-Design-Stepper] Update Alias Table Edit Mode Details',
  props<{ isAliasTableEditMode: boolean; aliasTableEditIndex: number | null }>()
);

export const actionToggleDecisionPointsTableEditMode = createAction(
  '[Experiment-Design-Stepper] Update Decision Points Table Edit Mode Details',
  props<{ decisionPointsTableEditIndex: number | null; decisionPointsRowData: DecisionPointsTableRowData }>()
);

export const actionToggleConditionsTableEditMode = createAction(
  '[Experiment-Design-Stepper] Update Conditions Table Edit Mode Details',
  props<{ conditionsTableEditIndex: number | null; conditionsRowData: ConditionsTableRowData }>()
);

export const actionClearDecisionPointTableEditDetails = createAction(
  `[Experiment-Design-Stepper] Clear Decision Point Table Edit Details`
);

export const actionClearConditionTableEditDetails = createAction(
  `[Experiment-Design-Stepper] Clear Condition Table Edit Details`
);

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

export const actionUpdateSimpleExperimentAliasTableData = createAction(
  '[Experiment-Design-Stepper] update simple experiment alias table data',
  props<{ tableData: SimpleExperimentAliasTableRow[] }>()
);

export const actionUpdateSimpleExperimentAliasTableEditModeDetails = createAction(
  '[Experiment-Design-Stepper] Update Simple Experiment Alias Table Edit Mode Details',
  props<{
    simpleExperimentAliasTableEditIndex: number | null;
  }>()
);

export const actionUpdateFactorialDesignData = createAction(
  '[Experiment-Design-Stepper] update factorial design data',
  props<{ designData: ExperimentFactorialDesignData }>()
);

export const actionUpdateFactorialConditionTableData = createAction(
  '[Experiment-Design-Stepper] update factorial condition table data',
  props<{ tableData: FactorialConditionTableRowData[] }>()
);

export const actionToggleFactorialConditionsTableEditMode = createAction(
  '[Experiment-Design-Stepper] Update Factorial Conditions Table Edit Mode Details',
  props<{
    factorialConditionsTableEditIndex: number | null;
    factorialConditionsRowData: FactorialConditionTableRowData;
  }>()
);

export const actionToggleFactorialLevelsTableEditMode = createAction(
  '[Experiment-Design-Stepper] Update Factorial Levels Table Edit Mode Details',
  props<{
    factorialLevelsTableEditIndex: number | null;
    factorialLevelsRowData: ExperimentLevelFormData;
  }>()
);

export const actionClearFactorialConditionTableEditDetails = createAction(
  `[Experiment-Design-Stepper] Clear Factorial Condition Table Edit Details`
);

export const actionClearFactorialLevelTableEditDetails = createAction(
  `[Experiment-Design-Stepper] Clear Factorial Level Table Edit Details`
);

export const clearFactorialDesignStepperData = createAction(`[Experiment-Design-Stepper] Clear Factorial Design Data`);

export const clearSimpleExperimentDesignStepperData = createAction(
  `[Experiment-Design-Stepper] Clear Simple Experiment Design Data`
);
