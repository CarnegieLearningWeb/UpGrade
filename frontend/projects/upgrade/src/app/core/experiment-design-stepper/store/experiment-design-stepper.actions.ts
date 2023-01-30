import { createAction, props } from '@ngrx/store';
import { DecisionPointsTableRowData, ConditionsTableRowData } from './experiment-design-stepper.model';

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
