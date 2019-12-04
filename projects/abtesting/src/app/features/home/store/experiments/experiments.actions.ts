import { createAction, props } from '@ngrx/store';
import { Experiment } from './experiments.model';

export const actionGetAllExperiment = createAction('[Experiment] Get All');

export const actionGetExperimentById = createAction('[Experiment] Get By Id');

export const actionStoreExperiment = createAction(
  '[Experiment] Store Experiment',
  props<{ experiments: Experiment[] }>()
);
