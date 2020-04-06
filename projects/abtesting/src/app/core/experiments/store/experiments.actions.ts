import { createAction, props } from '@ngrx/store';
import { Experiment, UpsertExperimentType, ExperimentStateInfo, ExperimentNameVM, EXPERIMENT_SEARCH_KEY, EXPERIMENT_SORT_KEY, EXPERIMENT_SORT_AS } from './experiments.model';

export const actionGetExperiments = createAction(
  '[Experiment] Get Experiments',
  props<{ fromStarting?: boolean }>()
);

export const actionGetExperimentsSuccess = createAction(
  '[Experiment] Get Experiments Success',
  props<{ experiments: Experiment[], totalExperiments: number }>()
);

export const actionGetExperimentsFailure = createAction(
  '[Experiment] Get Experiment Failure',
  props<{ error: any }>()
);

export const actionStoreExperimentStats = createAction('[Experiment] Store Experiment Stats', props<{ stats: any }>());

export const actionRemoveExperimentStat = createAction(
  '[Experiment] Remove Experiment stat',
  props<{ experimentStatId: string }>()
);

export const actionGetExperimentById = createAction(
  '[Experiment] Get Experiment By Id',
  props<{ experimentId: string }>()
);

export const actionGetExperimentByIdSuccess = createAction(
  '[Experiment] Get Experiment By Id Success',
  props<{ experiment: Experiment }>()
);

export const actionGetExperimentByIdFailure = createAction(
  '[Experiment] Get Experiment By Id Failure'
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

export const actionSetIsLoadingExperiment = createAction(
  '[Experiment] Set Is Loading Experiment',
  props<{ isLoadingExperiment: boolean }>()
);

export const actionSetSkipExperiment = createAction(
  '[Experiment] Set Skip Experiment Value',
  props<{ skipExperiment: number }>()
);

export const actionSetSearchKey = createAction(
  '[Experiment] Set Search key value',
  props<{ searchKey: EXPERIMENT_SEARCH_KEY }>()
);

export const actionSetSearchString = createAction(
  '[Experiment] Set Search String',
  props<{ searchString: string }>()
);

export const actionSetSortKey = createAction(
  '[Experiment] Set Sort key value',
  props<{ sortKey: EXPERIMENT_SORT_KEY }>()
);

export const actionSetSortingType = createAction(
  '[Experiment] Set Sorting type',
  props<{ sortingType: EXPERIMENT_SORT_AS }>()
);

export const actionFetchAllExperimentNames = createAction(
  '[Experiment] Fetch All Experiment Names'
);

export const actionFetchAllExperimentNamesSuccess = createAction(
  '[Experiment] Fetch All Experiment Names Success',
  props<{ allExperimentNames: ExperimentNameVM[] }>()
);

export const actionFetchAllExperimentNamesFailure = createAction(
  '[Experiment] Fetch All Experiment Names Failure'
);
