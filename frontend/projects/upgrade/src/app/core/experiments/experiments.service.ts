import { Inject, Injectable } from '@angular/core';
import { Observable, combineLatest } from 'rxjs';
import {
  Experiment,
  UpsertExperimentType,
  ExperimentVM,
  ExperimentStateInfo,
  EXPERIMENT_SEARCH_KEY,
  EXPERIMENT_SORT_KEY,
  SORT_AS_DIRECTION,
  DATE_RANGE,
  ExperimentLocalStorageKeys,
  EXPERIMENT_STATE,
  AddExperimentRequest,
  UpdateExperimentFilterModeRequest,
  UpdateExperimentDecisionPointsRequest,
  UpdateExperimentConditionsRequest,
} from './store/experiments.model';
import { Store, select } from '@ngrx/store';
import {
  selectAllExperiment,
  selectIsLoadingExperiment,
  selectIsLoadingExperimentDetailStats,
  selectSelectedExperiment,
  selectExperimentOverviewDetails,
  selectSearchExperimentParams,
  selectRootTableState,
  selectAllDecisionPoints,
  selectAllExperimentNames,
  selectExperimentById,
  selectSearchString,
  selectSearchKey,
  selectExperimentGraphInfo,
  selectSkipExperiment,
  selectTotalExperiment,
  selectExperimentStatById,
  selectIsGraphLoading,
  selectSortKey,
  selectSortAs,
  selectContextMetaData,
  selectGroupAssignmentStatus,
  selectIsPollingExperimentDetailStats,
  selectCurrentContextMetaDataConditions,
  selectIsLoadingContextMetaData,
  selectExperimentsExportLoading,
  selectExperimentInclusions,
  selectExperimentInclusionsLength,
  selectExperimentExclusions,
  selectExperimentExclusionsLength,
} from './store/experiments.selectors';
import * as experimentAction from './store//experiments.actions';
import { AppState } from '../core.state';
import { map, filter, tap } from 'rxjs/operators';
import { LocalStorageService } from '../local-storage/local-storage.service';
import { ENV, Environment } from '../../../environments/environment-types';
import { ExperimentSegmentListRequest } from '../segments/store/segments.model';
import { ConditionWeightUpdate } from '../../features/dashboard/experiments/modals/edit-condition-weights-modal/edit-condition-weights-modal.component';

@Injectable()
export class ExperimentService {
  constructor(
    private store$: Store<AppState>,
    private localStorageService: LocalStorageService,
    @Inject(ENV) private environment: Environment
  ) {}

  experiments$: Observable<Experiment[]> = this.store$.pipe(
    select(selectAllExperiment),
    map((experiments) =>
      experiments.sort((a, b) => {
        const d1 = new Date(a.createdAt);
        const d2 = new Date(b.createdAt);
        return d1 < d2 ? 1 : d1 > d2 ? -1 : 0;
      })
    )
  );
  totalExperiments$ = this.store$.pipe(select(selectTotalExperiment));
  isLoadingExperiment$ = this.store$.pipe(select(selectIsLoadingExperiment));
  isLoadingExperimentDetailStats$ = this.store$.pipe(select(selectIsLoadingExperimentDetailStats));
  isPollingExperimentDetailStats$ = this.store$.pipe(select(selectIsPollingExperimentDetailStats));
  isExperimentsExportLoading$ = this.store$.pipe(select(selectExperimentsExportLoading));
  selectedExperiment$ = this.store$.pipe(select(selectSelectedExperiment));
  selectedExperimentOverviewDetails$ = this.store$.pipe(select(selectExperimentOverviewDetails));
  searchParams$ = this.store$.pipe(select(selectSearchExperimentParams));
  selectRootTableState$ = this.store$.pipe(select(selectRootTableState));
  allDecisionPoints$ = this.store$.pipe(select(selectAllDecisionPoints));
  allExperimentNames$ = this.store$.pipe(select(selectAllExperimentNames));
  selectSearchString$ = this.store$.pipe(select(selectSearchString));
  selectSearchKey$ = this.store$.pipe(select(selectSearchKey));
  selectExperimentSortKey$ = this.store$.pipe(select(selectSortKey));
  selectExperimentSortAs$ = this.store$.pipe(select(selectSortAs));
  selectExperimentGraphInfo$ = this.store$.pipe(select(selectExperimentGraphInfo));
  isGraphLoading$ = this.store$.pipe(select(selectIsGraphLoading));
  selectExperimentInclusions$ = this.store$.pipe(select(selectExperimentInclusions));
  selectExperimentInclusionsLength$ = this.store$.pipe(select(selectExperimentInclusionsLength));
  selectExperimentExclusions$ = this.store$.pipe(select(selectExperimentExclusions));
  selectExperimentExclusionsLength$ = this.store$.pipe(select(selectExperimentExclusionsLength));
  experimentStatById$ = (experimentId) => this.store$.pipe(select(selectExperimentStatById, { experimentId }));
  contextMetaData$ = this.store$.pipe(select(selectContextMetaData));
  isLoadingContextMetaData$ = this.store$.pipe(select(selectIsLoadingContextMetaData));
  groupSatisfied$ = (experimentId) => this.store$.pipe(select(selectGroupAssignmentStatus, { experimentId }));
  pollingEnabled: boolean = this.environment.pollingEnabled;
  currentContextMetaDataConditions$ = this.store$.pipe(select(selectCurrentContextMetaDataConditions));

  selectSearchExperimentParams(): Observable<Record<string, unknown>> {
    return combineLatest([this.selectSearchKey$, this.selectSearchString$]).pipe(
      filter(([searchKey, searchString]) => !!searchKey && !!searchString),
      map(([searchKey, searchString]) => ({ searchKey, searchString }))
    );
  }

  haveInitialExperimentsLoaded() {
    return combineLatest([this.store$.pipe(select(selectIsLoadingExperiment)), this.experiments$]).pipe(
      map(([isLoading, experiments]) => !isLoading || !!experiments.length)
    );
  }

  isAllExperimentsFetched() {
    return combineLatest([
      this.store$.pipe(select(selectSkipExperiment)),
      this.store$.pipe(select(selectTotalExperiment)),
    ]).pipe(map(([skipExperiments, totalExperiments]) => skipExperiments === totalExperiments));
  }

  loadExperiments(fromStarting?: boolean) {
    return this.store$.dispatch(experimentAction.actionGetExperiments({ fromStarting }));
  }

  createNewExperiment(experiment: AddExperimentRequest) {
    //const experiment = this.forExperimentWithPayloadObj(experimentWithPayloadAsString);
    this.store$.dispatch(
      experimentAction.actionUpsertExperiment({
        experiment: experiment as unknown as Experiment,
        actionType: UpsertExperimentType.CREATE_NEW_EXPERIMENT,
      })
    );
  }

  updateExperiment(experiment: ExperimentVM) {
    delete experiment.stat;
    //const experiment = this.forExperimentWithPayloadObj(experimentWithPayloadAsString);
    this.store$.dispatch(
      experimentAction.actionUpsertExperiment({ experiment, actionType: UpsertExperimentType.UPDATE_EXPERIMENT })
    );
  }

  deleteExperiment(experimentId) {
    this.store$.dispatch(experimentAction.actionDeleteExperiment({ experimentId }));
  }

  // forExperimentWithPayloadObj(experiment): Experiment {
  //   if (experiment.type === 'Factorial') {
  //     const factorsWithPayloadObj = experiment.factors?.map((factor) => {
  //       const levelsWithPayloadObj = factor.levels.map((level) => {
  //         return { ...level, payload: { type: PAYLOAD_TYPE.STRING, value: level.payload } };
  //       });
  //       return { ...factor, levels: levelsWithPayloadObj };
  //     });

  //     const conditionPayloadWithPayloadObj = experiment.conditionPayloads.map((conditionPayload) => {
  //       return { ...conditionPayload, payload: { type: PAYLOAD_TYPE.STRING, value: conditionPayload.payload } };
  //     });

  //     return { ...experiment, factors: factorsWithPayloadObj, conditionPayloads: conditionPayloadWithPayloadObj };
  //   } else {
  //     const conditionPayloadWithPayloadObj = experiment.conditionPayloads.map((conditionPayload) => {
  //       return { ...conditionPayload, payload: { type: PAYLOAD_TYPE.STRING, value: conditionPayload.payload } };
  //     });

  //     return { ...experiment, conditionPayloads: conditionPayloadWithPayloadObj };
  //   }
  // }

  selectExperimentById(experimentId: string) {
    return this.store$.pipe(select(selectExperimentById, { experimentId })).pipe(
      tap((experiment) => {
        if (!experiment) {
          this.fetchExperimentById(experimentId);
        }
        return { ...experiment };
      })
    );
  }

  fetchExperimentById(experimentId: string) {
    this.store$.dispatch(experimentAction.actionGetExperimentById({ experimentId }));
  }

  updateExperimentState(experimentId: string, experimentStateInfo: ExperimentStateInfo) {
    this.store$.dispatch(experimentAction.actionUpdateExperimentState({ experimentId, experimentStateInfo }));
  }

  updateFilterMode(updateExperimentFilterModeRequest: UpdateExperimentFilterModeRequest) {
    this.store$.dispatch(experimentAction.actionUpdateExperimentFilterMode({ updateExperimentFilterModeRequest }));
  }

  updateExperimentDecisionPoints(updateExperimentDecisionPointsRequest: UpdateExperimentDecisionPointsRequest) {
    this.store$.dispatch(
      experimentAction.actionUpdateExperimentDecisionPoints({ updateExperimentDecisionPointsRequest })
    );
  }

  updateExperimentConditions(updateExperimentConditionsRequest: UpdateExperimentConditionsRequest) {
    this.store$.dispatch(experimentAction.actionUpdateExperimentConditions({ updateExperimentConditionsRequest }));
  }

  fetchContextMetaData() {
    this.store$.dispatch(experimentAction.actionFetchContextMetaData({ isLoadingContextMetaData: true }));
  }

  setCurrentContext(context: string) {
    this.store$.dispatch(experimentAction.actionSetCurrentContext({ context }));
  }

  setSearchKey(searchKey: EXPERIMENT_SEARCH_KEY) {
    this.localStorageService.setItem(ExperimentLocalStorageKeys.EXPERIMENT_SEARCH_KEY, searchKey);
    this.store$.dispatch(experimentAction.actionSetSearchKey({ searchKey }));
  }

  setSearchString(searchString: string) {
    this.localStorageService.setItem(ExperimentLocalStorageKeys.EXPERIMENT_SEARCH_STRING, searchString);
    this.store$.dispatch(experimentAction.actionSetSearchString({ searchString }));
  }

  setSortKey(sortKey: EXPERIMENT_SORT_KEY) {
    this.localStorageService.setItem(ExperimentLocalStorageKeys.EXPERIMENT_SORT_KEY, sortKey);
    this.store$.dispatch(experimentAction.actionSetSortKey({ sortKey }));
  }

  setSortingType(sortingType: SORT_AS_DIRECTION) {
    this.localStorageService.setItem(ExperimentLocalStorageKeys.EXPERIMENT_SORT_TYPE, sortingType);
    this.store$.dispatch(experimentAction.actionSetSortingType({ sortingType }));
  }

  fetchAllExperimentNames() {
    this.store$.dispatch(experimentAction.actionFetchAllExperimentNames());
  }

  exportExperimentInfo(experimentId: string, experimentName: string) {
    this.store$.dispatch(experimentAction.actionExportExperimentInfo({ experimentId, experimentName }));
  }

  exportExperimentDesign(experimentIds: string[]) {
    this.store$.dispatch(experimentAction.actionExportExperimentDesign({ experimentIds, exportAll: false }));
  }

  exportAllExperimentDesign() {
    this.store$.dispatch(experimentAction.actionExportExperimentDesign({ experimentIds: [], exportAll: true }));
  }

  importExperiment(experiments: Experiment[]) {
    this.store$.dispatch(experimentAction.actionImportExperiment({ experiments }));
  }

  setGraphRange(range: DATE_RANGE, experimentId: string, clientOffset: number) {
    this.store$.dispatch(experimentAction.actionSetGraphRange({ range, experimentId, clientOffset }));
  }

  fetchExperimentDetailStat(experimentId: string) {
    this.store$.dispatch(experimentAction.actionFetchExperimentDetailStat({ experimentId }));
  }

  fetchGroupAssignmentStatus(experimentId: string) {
    this.store$.dispatch(experimentAction.actionFetchGroupAssignmentStatus({ experimentId }));
  }

  toggleDetailsPolling(experiment: Experiment, isPolling: boolean) {
    if (!isPolling && experiment.state === EXPERIMENT_STATE.ENROLLING) {
      this.beginDetailStatsPolling(experiment.id);
    }

    if (isPolling && experiment.state !== EXPERIMENT_STATE.ENROLLING) {
      this.endDetailStatsPolling();
    }
  }

  beginDetailStatsPolling(experimentId: string) {
    if (this.pollingEnabled) {
      this.store$.dispatch(experimentAction.actionBeginExperimentDetailStatsPolling({ experimentId }));
    }
  }

  endDetailStatsPolling() {
    this.store$.dispatch(experimentAction.actionEndExperimentDetailStatsPolling());
  }

  formatExperimentName(experimentName: string) {
    return experimentName.trim().toUpperCase().replace(/ /g, '_');
  }

  getOutcomeVariableName(experimentName: string) {
    return `${this.formatExperimentName(experimentName)}_REWARD_VARIABLE`;
  }

  getRewardMetricKey(experimentName: string) {
    return `${this.formatExperimentName(experimentName)}_REWARD`;
  }

  getRewardMetricData(rewardMetricKey: string) {
    return {
      metric_Key: rewardMetricKey,
      metric_Operation: 'Percentage (Success)',
      metric_Name: 'Success Rate',
    };
  }

  addExperimentInclusionPrivateSegmentList(list: ExperimentSegmentListRequest) {
    this.store$.dispatch(experimentAction.actionAddExperimentInclusionList({ list }));
  }

  updateExperimentInclusionPrivateSegmentList(list: ExperimentSegmentListRequest) {
    this.store$.dispatch(experimentAction.actionUpdateExperimentInclusionList({ list }));
  }

  deleteExperimentInclusionPrivateSegmentList(segmentId: string) {
    this.store$.dispatch(experimentAction.actionDeleteExperimentInclusionList({ segmentId }));
  }

  addExperimentExclusionPrivateSegmentList(list: ExperimentSegmentListRequest) {
    this.store$.dispatch(experimentAction.actionAddExperimentExclusionList({ list }));
  }

  updateExperimentExclusionPrivateSegmentList(list: ExperimentSegmentListRequest) {
    this.store$.dispatch(experimentAction.actionUpdateExperimentExclusionList({ list }));
  }

  deleteExperimentExclusionPrivateSegmentList(segmentId: string) {
    this.store$.dispatch(experimentAction.actionDeleteExperimentExclusionList({ segmentId }));
  }

  updateExperimentConditionWeights(experiment: ExperimentVM, weightUpdates: ConditionWeightUpdate[]): void {
    // Create updated experiment with new condition weights
    const updatedExperiment: ExperimentVM = {
      ...experiment,
      conditions: experiment.conditions.map((condition) => {
        const weightUpdate = weightUpdates.find((update) => update.conditionId === condition.id);

        return weightUpdate
          ? {
              ...condition,
              assignmentWeight: weightUpdate.assignmentWeight,
            }
          : condition;
      }),
    };

    // Dispatch the update action
    this.store$.dispatch(
      experimentAction.actionUpsertExperiment({
        experiment: updatedExperiment,
        actionType: UpsertExperimentType.UPDATE_EXPERIMENT,
      })
    );
  }
}
