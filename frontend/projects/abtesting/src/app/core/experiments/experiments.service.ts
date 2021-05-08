import { Injectable } from '@angular/core';
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
} from './store/experiments.model';
import { Store, select } from '@ngrx/store';
import {
  selectAllExperiment,
  selectIsLoadingExperiment,
  selectSelectedExperiment,
  selectAllPartitions,
  selectAllExperimentNames,
  selectExperimentById,
  selectSearchString,
  selectSearchKey,
  selectExperimentContext,
  selectExperimentGraphInfo,
  selectSkipExperiment,
  selectTotalExperiment,
  selectExperimentStatById,
  selectIsGraphLoading,
  selectSortKey,
  selectSortAs,
  selectExperimentPointsAndIds
} from './store/experiments.selectors';
import * as experimentAction from './store//experiments.actions';
import { AppState } from '../core.state';
import { map, first, filter } from 'rxjs/operators';
import { LocalStorageService } from '../local-storage/local-storage.service';

@Injectable()
export class ExperimentService {
  constructor(
    private store$: Store<AppState>,
    private localStorageService: LocalStorageService
  ) {}

  experiments$: Observable<Experiment[]> = this.store$.pipe(
    select(selectAllExperiment),
    map(experiments =>
      experiments.sort((a, b) => {
        const d1 = new Date(a.createdAt);
        const d2 = new Date(b.createdAt);
        return d1 < d2 ? 1 : d1 > d2 ? -1 : 0;
      })
    )
  );
  isLoadingExperiment$ = this.store$.pipe(select(selectIsLoadingExperiment));
  selectedExperiment$ = this.store$.pipe(select(selectSelectedExperiment));
  allPartitions$ = this.store$.pipe(select(selectAllPartitions));
  allExperimentNames$ = this.store$.pipe(select(selectAllExperimentNames));
  selectSearchString$ = this.store$.pipe(select(selectSearchString));
  selectSearchKey$ = this.store$.pipe(select(selectSearchKey));
  selectExperimentSortKey$ = this.store$.pipe(select(selectSortKey));
  selectExperimentSortAs$ = this.store$.pipe(select(selectSortAs));
  experimentContext$ = this.store$.pipe(select(selectExperimentContext));
  selectExperimentGraphInfo$ = this.store$.pipe(select(selectExperimentGraphInfo));
  isGraphLoading$ = this.store$.pipe(select(selectIsGraphLoading));
  experimentStatById$ = (experimentId) => this.store$.pipe(select(selectExperimentStatById, { experimentId }));
  expPointsAndIds$ = this.store$.pipe(select(selectExperimentPointsAndIds));

  selectSearchExperimentParams(): Observable<Object> {
    return combineLatest(this.selectSearchKey$, this.selectSearchString$).pipe(
      filter(([searchKey, searchString]) => !!searchKey && !!searchString),
      map(([searchKey, searchString]) => ({ searchKey, searchString })),
      first()
    );
  }

  isInitialExperimentsLoading() {
    return combineLatest(this.store$.pipe(select(selectIsLoadingExperiment)), this.experiments$).pipe(
      map(([isLoading, experiments]) => {
        return !isLoading || experiments.length;
      })
    );
  }

  isAllExperimentsFetched() {
    return combineLatest(
      this.store$.pipe(select(selectSkipExperiment)),
      this.store$.pipe(select(selectTotalExperiment))
    ).pipe(
      map(([skipExperiments, totalExperiments]) => skipExperiments === totalExperiments)
    );
  }

  loadExperiments(fromStarting?: boolean) {
    return this.store$.dispatch(experimentAction.actionGetExperiments({ fromStarting }));
  }

  createNewExperiment(experiment: Experiment) {
    this.store$.dispatch(
      experimentAction.actionUpsertExperiment({ experiment, actionType: UpsertExperimentType.CREATE_NEW_EXPERIMENT })
    );
  }

  importExperiment(experiment: Experiment) {
    this.store$.dispatch(
      experimentAction.actionUpsertExperiment({ experiment, actionType: UpsertExperimentType.IMPORT_EXPERIMENT })
    );
  }

  updateExperiment(experiment: ExperimentVM) {
    delete experiment.stat;
    this.store$.dispatch(
      experimentAction.actionUpsertExperiment({ experiment, actionType: UpsertExperimentType.UPDATE_EXPERIMENT })
    );
  }

  deleteExperiment(experimentId) {
    this.store$.dispatch(experimentAction.actionDeleteExperiment({ experimentId }));
  }

  selectExperimentById(experimentId: string) {
    return combineLatest(this.store$.pipe(select(selectExperimentById, { experimentId }))).pipe(
      map(([experiment]) => {
        if (!experiment) {
          this.fetchExperimentById(experimentId);
        }
        return experiment;
      })
    );
  }

  fetchExperimentById(experimentId: string) {
    this.store$.dispatch(experimentAction.actionGetExperimentById({ experimentId }));
  }

  updateExperimentState(experimentId: string, experimentStateInfo: ExperimentStateInfo) {
    this.store$.dispatch(experimentAction.actionUpdateExperimentState({ experimentId, experimentStateInfo }));
  }

  fetchExperimentContext() {
    this.store$.dispatch(experimentAction.actionFetchExperimentContext());
  }

  fetchExperimentPointsAndIds() {
    this.store$.dispatch(experimentAction.actionFetchExperimentPointsAndIds());
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

  setGraphRange(range: DATE_RANGE, experimentId: string) {
    this.store$.dispatch(experimentAction.actionSetGraphRange({ range, experimentId }));
  }

  fetchExperimentDetailStat(experimentId: string) {
    this.store$.dispatch(experimentAction.actionFetchExperimentDetailStat({ experimentId }));
  }
}
