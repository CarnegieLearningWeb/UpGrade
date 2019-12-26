import { createAction, props } from '@ngrx/store';
import { Experiment } from './experiments.model';

export const actionGetAllExperiment = createAction('[Experiment] Get All');

export const actionGetExperimentById = createAction('[Experiment] Get By Id');

export const actionStoreExperiment = createAction(
  '[Experiment] Store Experiment',
  props<{ experiments: Experiment[] }>()
);

export const actionCreateNewExperiment = createAction(
  '[Experiment] Create New Experiment',
  props<{ experiment: Experiment }>()
);

export const actionCreateNewExperimentSuccess = createAction(
  '[Experiment] Create New Experiment Success',
  props<{ experiment: Experiment }>()
);

export const actionCreateNewExperimentFailure = createAction(
  '[Experiment] Create New Experiment Failure'
);
