import { createAction, props } from '@ngrx/store';
import {
  Experiment,
  UpsertExperimentType,
  ExperimentStateInfo,
  ExperimentNameVM,
  EXPERIMENT_SEARCH_KEY,
  EXPERIMENT_SORT_KEY,
  EXPERIMENT_SORT_AS,
  IExperimentEnrollmentDetailStats,
  DATE_RANGE,
  IEnrollmentStatByDate,
  IContextMetaData,
} from './experiments.model';

export const actionGetExperiments = createAction('[Experiment] Get Experiments', props<{ fromStarting?: boolean }>());

export const actionGetExperimentsSuccess = createAction(
  '[Experiment] Get Experiments Success',
  props<{ experiments: Experiment[]; totalExperiments: number }>()
);

export const actionGetExperimentsFailure = createAction('[Experiment] Get Experiment Failure', props<{ error: any }>());

export const actionFetchExperimentStats = createAction(
  '[Experiment] Fetch Experiment stats',
  props<{ experimentIds: string[] }>()
);

export const actionFetchExperimentStatsSuccess = createAction(
  '[Experiment] Fetch Experiment Stats Success',
  props<{ stats: any }>()
);

export const actionFetchExperimentStatsFailure = createAction('[Experiment] Fetch Experiment Stats Failure');

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

export const actionGetExperimentByIdFailure = createAction('[Experiment] Get Experiment By Id Failure');

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

export const actionFetchAllDecisionPoints = createAction('[Experiment] Fetch All Decision Points');

export const actionFetchAllDecisionPointsSuccess = createAction(
  '[Experiment] Fetch All DecisionPoints Success',
  props<{ decisionPoints: any }>()
);

export const actionFetchAllDecisionPointsFailure = createAction('[Experiment] Fetch All Decision Points Failure');

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

export const actionSetSearchString = createAction('[Experiment] Set Search String', props<{ searchString: string }>());

export const actionSetSortKey = createAction(
  '[Experiment] Set Sort key value',
  props<{ sortKey: EXPERIMENT_SORT_KEY }>()
);

export const actionSetSortingType = createAction(
  '[Experiment] Set Sorting type',
  props<{ sortingType: EXPERIMENT_SORT_AS }>()
);

export const actionFetchAllExperimentNames = createAction('[Experiment] Fetch All Experiment Names');

export const actionFetchAllExperimentNamesSuccess = createAction(
  '[Experiment] Fetch All Experiment Names Success',
  props<{ allExperimentNames: ExperimentNameVM[] }>()
);

export const actionFetchAllExperimentNamesFailure = createAction('[Experiment] Fetch All Experiment Names Failure');

export const actionExportExperimentInfo = createAction(
  '[Experiment] Export Experiment Info',
  props<{ experimentId: string; experimentName: string }>()
);

export const actionExportExperimentDesign = createAction(
  '[Experiment] Export Experiment Design',
  props<{ experimentIds: string[] }>()
);

export const actionExportExperimentInfoSuccess = createAction('[Experiment] Export Experiment Info Success');

export const actionExportExperimentDesignSuccess = createAction('[Experiment] Export Experiment Design Success');

export const actionExportExperimentInfoFailure = createAction('[Experiment] Export Experiment Info Failure');

export const actionExportExperimentDesignFailure = createAction('[Experiment] Export Experiment Design Failure');

export const actionImportExperiment = createAction(
  '[Experiment] Import Experiment',
  props<{ experiments: Experiment[] }>()
);

export const actionImportExperimentSuccess = createAction('[Experiment] Import Experiment Success');

export const actionImportExperimentFailure = createAction('[Experiment] Import Experiment Failure');

export const actionSetIsGraphLoading = createAction(
  '[Experiment] Set is Graph Loading',
  props<{ isGraphInfoLoading: boolean }>()
);

export const actionFetchExperimentGraphInfo = createAction(
  '[Experiment] Fetch Experiment graph Info',
  props<{ experimentId: string; range: DATE_RANGE; clientOffset: number }>()
);

export const actionFetchExperimentGraphInfoSuccess = createAction(
  '[Experiment] Fetch Experiment graph Info Success',
  props<{ range: DATE_RANGE; graphInfo: IEnrollmentStatByDate[] }>()
);

export const actionFetchExperimentGraphInfoFailure = createAction('[Experiment] Fetch Experiment graph Info Failure');

export const actionSetExperimentGraphInfo = createAction(
  '[Experiment] Set Experiment Graph Info',
  props<{ graphInfo: any }>()
);

export const actionSetGraphRange = createAction(
  '[Experiment] Set Graph Range',
  props<{ range: DATE_RANGE; experimentId: string; clientOffset: number }>()
);

export const actionFetchExperimentDetailStat = createAction(
  '[Experiment] Fetch Experiment Detail stat',
  props<{ experimentId: string }>()
);

export const actionFetchExperimentDetailStatSuccess = createAction(
  '[Experiment] Fetch Experiment Detail stat Success',
  props<{ stat: IExperimentEnrollmentDetailStats }>()
);

export const actionFetchExperimentDetailStatFailure = createAction('[Experiment] Fetch Experiment Detail stat Failure');

export const actionFetchContextMetaData = createAction(
  '[Experiment] Fetch contextMetaData',
  props<{ isLoadingContextMetaData: boolean }>()
);

export const actionSetIsLoadingContextMetaData = createAction(
  '[Experiment] Set IsLoadingContextMetaData',
  props<{ isLoadingContextMetaData: boolean }>()
);

export const actionFetchContextMetaDataSuccess = createAction(
  '[Experiment] Fetch contextMetaData Success',
  props<{ contextMetaData: IContextMetaData; isLoadingContextMetaData: boolean }>()
);

export const actionFetchContextMetaDataFailure = createAction(
  '[Experiment] Fetch contextMetaData Failure',
  props<{ isLoadingContextMetaData: boolean }>()
);

export const actionSetCurrentContext = createAction(
  '[Experiment] Set User-Selected Context',
  props<{ context: string }>()
);

export const actionFetchGroupAssignmentStatus = createAction(
  '[Experiment] Fetch group counts having met ending criteria',
  props<{ experimentId: string }>()
);

export const actionFetchGroupAssignmentStatusSuccess = createAction(
  '[Experiment] Fetch group counts having met ending criteria Success',
  props<{ experiment: Experiment }>()
);

export const actionFetchGroupAssignmentStatusFailure = createAction(
  '[Experiment] Fetch group counts having met ending criteria Failure'
);
export const actionBeginExperimentDetailStatsPolling = createAction(
  '[Experiment] Begin polling every n seconds for details stats',
  props<{ experimentId: string }>()
);

export const actionEndExperimentDetailStatsPolling = createAction('[Experiment] End polling for detail stats');
