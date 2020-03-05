import { createAction, props } from '@ngrx/store';
import { Experiment, UpsertExperimentType, ExperimentStateInfo } from './experiments.model';

export const actionGetAllExperiment = createAction('[Experiment] Get All');

export const actionGetExperimentById = createAction('[Experiment] Get By Id');

export const actionStoreExperiment = createAction(
  '[Experiment] Store Experiment',
  props<{ experiments: Experiment[] }>()
);

export const actionStoreExperimentStats = createAction('[Experiment] Store Experiment Stats', props<{ stats: any }>());

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
  props<{ experiment: Experiment; actionType: UpsertExperimentType }>()
);

export const actionUpsertExperimentSuccess = createAction(
  '[Experiment] Upsert Experiment Success',
  props<{ experiment: Experiment }>()
);

export const actionUpsertExperimentFailure = createAction('[Experiment] Upsert Experiment Failure');

export const actionDeleteExperiment = createAction('[Experiment] Delete Experiment', props<{ experimentId: string }>());

export const actionDeleteExperimentSuccess = createAction(
  '[Experiment] Delete Experiment Success',
  props<{ experimentId: string }>()
);

export const actionDeleteExperimentFailure = createAction('[Experiment] Delete Experiment Failure');

export const actionUpdateExperimentState = createAction(
  '[Experiment] Update Experiment State',
  props<{ experimentId: string; experimentStateInfo: ExperimentStateInfo }>()
);

export const actionUpdateExperimentStateSuccess = createAction(
  '[Experiment] Update Experiment State Success',
  props<{ experiment: Experiment }>()
);

export const actionUpdateExperimentStateFailure = createAction('[Experiment] Update Experiment State Failure');

export const actionFetchAllPartitions = createAction('[Experiment] Fetch All Partitions');

export const actionFetchAllPartitionSuccess = createAction(
  '[Experiment] Fetch All Partitions Success',
  props<{ partitions: any }>()
);

export const actionFetchAllPartitionFailure = createAction('[Experiment] Fetch All Partitions Failure');

export const actionFetchAllUniqueIdentifiers = createAction('[Experiment] Fetch All Unique Identifiers');

export const actionFetchAllUniqueIdentifiersSuccess = createAction(
  '[Experiment] Fetch All Unique Identifiers Success',
  props<{ uniqueIdentifiers: any }>()
);

export const actionFetchAllUniqueIdentifiersFailure = createAction('[Experiment] Fetch All Unique Identifiers Failure');
