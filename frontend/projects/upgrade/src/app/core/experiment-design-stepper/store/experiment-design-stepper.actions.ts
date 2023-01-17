import { createAction, props } from '@ngrx/store';
import {
  DecisionPointsTableRowData,
  ConditionsTableRowData,
  ExperimentFactorialDesignData,
  FactorialConditionTableRowData,
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

export const actionUpdateFactorialDesignData = createAction(
  '[Experiment-Design-Stepper] update factorial design data',
  props<{ designData: ExperimentFactorialDesignData }>()
);

export const actionUpdateFactorialTableData = createAction(
  '[Experiment-Design-Stepper] update factorial table data',
  props<{ tableData: FactorialConditionTableRowData[] }>()
);

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

export const clearFactorialDesignStepperData = createAction(`[Experiment-Design-Stepper] Clear Factorial Design Data`);
