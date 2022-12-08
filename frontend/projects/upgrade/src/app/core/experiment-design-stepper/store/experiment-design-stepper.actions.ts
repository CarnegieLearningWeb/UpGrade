import { createAction, props } from '@ngrx/store';

export const actionUpdateAliasTableEditMode = createAction(
  '[Experiment] Update Alias Table Edit Mode Details',
  props<{ isAliasTableEditMode: boolean; aliasTableEditIndex: number | null }>()
);

export const experimentStepperDataChanged = createAction('[Experiment] turn isExperimentStepperDataChanged true');

export const experimentStepperDataReset = createAction('[Experiment] turn isExperimentStepperDataChanged false');
