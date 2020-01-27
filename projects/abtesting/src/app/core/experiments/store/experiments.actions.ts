import { createAction, props } from '@ngrx/store';
import { Experiment, UpsertExperimentType } from './experiments.model';

export const actionGetAllExperiment = createAction('[Experiment] Get All');

export const actionGetExperimentById = createAction('[Experiment] Get By Id');

export const actionStoreExperiment = createAction(
  '[Experiment] Store Experiment',
  props<{ experiments: Experiment[] }>()
);

export const actionStoreExperimentStats = createAction(
  '[Experiment] Store Experiment Stats',
  props<{ stats: any }>()
);

export const actionRemoveExperimentStat = createAction(
  '[Experiment] Remove Experiment stat',
  props<{ experimentStatId: string }>()
);

export const actionGetAllExperimentFailure = createAction(
  '[Experiment] Get All Experiment Failure',
  props<{ error: any }>()
);

export const actionUpsertExperiment = createAction(
  '[Experiment] Upsert Experiment',
  props<{ experiment: Experiment, actionType: UpsertExperimentType }>()
);

export const actionUpsertExperimentSuccess = createAction(
  '[Experiment] Upsert Experiment Success',
  props<{ experiment: Experiment }>()
);

export const actionUpsertExperimentFailure = createAction(
  '[Experiment] Upsert Experiment Failure'
);

export const actionDeleteExperiment = createAction(
  '[Experiment] Delete Experiment',
  props<{ experimentId: string }>()
);

export const actionDeleteExperimentSuccess = createAction(
  '[Experiment] Delete Experiment Success',
  props<{ experimentId: string }>()
)

export const actionDeleteExperimentFailure = createAction(
  '[Experiment] Delete Experiment Failure'
)
