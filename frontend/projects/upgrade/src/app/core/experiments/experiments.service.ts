import { Inject, Injectable } from '@angular/core';
import { Observable, combineLatest } from 'rxjs';
import {
  Experiment,
  UpsertExperimentType,
  ExperimentVM,
  ExperimentStateInfo,
  EXPERIMENT_SEARCH_KEY,
  EXPERIMENT_SORT_KEY,
  EXPERIMENT_SORT_AS,
  DATE_RANGE,
  ExperimentLocalStorageKeys,
  EXPERIMENT_STATE,
} from './store/experiments.model';
import { Store, select } from '@ngrx/store';
import {
  selectAllExperiment,
  selectIsLoadingExperiment,
  selectIsLoadingExperimentDetailStats,
  selectSelectedExperiment,
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
} from './store/experiments.selectors';
import * as experimentAction from './store//experiments.actions';
import { AppState } from '../core.state';
import { map, first, filter, tap } from 'rxjs/operators';
import { LocalStorageService } from '../local-storage/local-storage.service';
import { ENV, Environment } from '../../../environments/environment-types';
import { PAYLOAD_TYPE } from '../../../../../../../types/src';

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
  isLoadingExperiment$ = this.store$.pipe(select(selectIsLoadingExperiment));
  isLoadingExperimentDetailStats$ = this.store$.pipe(select(selectIsLoadingExperimentDetailStats));
  isPollingExperimentDetailStats$ = this.store$.pipe(select(selectIsPollingExperimentDetailStats));
  selectedExperiment$ = this.store$.pipe(select(selectSelectedExperiment));
  allDecisionPoints$ = this.store$.pipe(select(selectAllDecisionPoints));
  allExperimentNames$ = this.store$.pipe(select(selectAllExperimentNames));
  selectSearchString$ = this.store$.pipe(select(selectSearchString));
  selectSearchKey$ = this.store$.pipe(select(selectSearchKey));
  selectExperimentSortKey$ = this.store$.pipe(select(selectSortKey));
  selectExperimentSortAs$ = this.store$.pipe(select(selectSortAs));
  selectExperimentGraphInfo$ = this.store$.pipe(select(selectExperimentGraphInfo));
  isGraphLoading$ = this.store$.pipe(select(selectIsGraphLoading));
  experimentStatById$ = (experimentId) => this.store$.pipe(select(selectExperimentStatById, { experimentId }));
  contextMetaData$ = this.store$.pipe(select(selectContextMetaData));
  isLoadingContextMetaData$ = this.store$.pipe(select(selectIsLoadingContextMetaData));
  groupSatisfied$ = (experimentId) => this.store$.pipe(select(selectGroupAssignmentStatus, { experimentId }));
  pollingEnabled: boolean = this.environment.pollingEnabled;
  currentContextMetaDataConditions$ = this.store$.pipe(select(selectCurrentContextMetaDataConditions));

  selectSearchExperimentParams(): Observable<Record<string, unknown>> {
    return combineLatest([this.selectSearchKey$, this.selectSearchString$]).pipe(
      filter(([searchKey, searchString]) => !!searchKey && !!searchString),
      map(([searchKey, searchString]) => ({ searchKey, searchString })),
      first()
    );
  }

  isInitialExperimentsLoading() {
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

  createNewExperiment(experiment: Experiment) {
    //const experiment = this.forExperimentWithPayloadObj(experimentWithPayloadAsString);
    this.store$.dispatch(
      experimentAction.actionUpsertExperiment({
        experiment,
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

  setSortingType(sortingType: EXPERIMENT_SORT_AS) {
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
    this.store$.dispatch(experimentAction.actionExportExperimentDesign({ experimentIds }));
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
}
