import { createAction, props } from '@ngrx/store';
import {
  ConditionsTableRowData,
  ExperimentFactorialDesignData,
  FactorialConditionTableRowData,
} from './experiment-design-stepper.model';

export const actionUpdateAliasTableEditMode = createAction(
  '[Experiment-Design-Stepper] Update Alias Table Edit Mode Details',
  props<{ isAliasTableEditMode: boolean; aliasTableEditIndex: number | null }>()
);

export const actionToggleConditionsTableEditMode = createAction(
  '[Experiment-Design-Stepper] Update Conditions Table Edit Mode Details',
  props<{ conditionsTableEditIndex: number | null; conditionsRowData: ConditionsTableRowData }>()
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
  '[Experiment-Design-Stepper] update factorial table data',
  props<{ designData: ExperimentFactorialDesignData }>()
);

export const actionUpdateFactorialTableData = createAction(
  '[Experiment-Design-Stepper] update factorial table data',
  props<{ tableData: FactorialConditionTableRowData[] }>()
);
