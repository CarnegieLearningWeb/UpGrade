import { Injectable } from '@angular/core';
import { Observable, combineLatest } from 'rxjs';
import { Experiment, UpsertExperimentType, ExperimentVM, ExperimentStateInfo, EXPERIMENT_SEARCH_KEY, EXPERIMENT_SORT_KEY, EXPERIMENT_SORT_AS } from './store/experiments.model';
import { Store, select } from '@ngrx/store';
import {
  selectAllExperiment,
  selectIsLoadingExperiment,
  selectSelectedExperiment,
  selectAllPartitions,
  selectAllUniqueIdentifiers,
  selectAllExperimentNames,
  selectExperimentById
} from './store/experiments.selectors';
import * as experimentAction from './store//experiments.actions';
import { AppState } from '../core.state';
import { map } from 'rxjs/operators';

@Injectable()
export class ExperimentService {
  constructor(private store$: Store<AppState>) {}

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
  uniqueIdentifiers$ = this.store$.pipe(select(selectAllUniqueIdentifiers));
  allExperimentNames$ = this.store$.pipe(select(selectAllExperimentNames));

  isInitialExperimentsLoading() {
    return combineLatest(
      this.store$.pipe(select(selectIsLoadingExperiment)),
      this.experiments$
    ).pipe(
      map(([isLoading, experiments]) => {
        return !isLoading || experiments.length
      })
    )
  }

  loadExperiments(fromStarting?: boolean) {
    return this.store$.dispatch(experimentAction.actionGetExperiments({ fromStarting }));
  }

  createNewExperiment(experiment: Experiment) {
    this.store$.dispatch(
      experimentAction.actionUpsertExperiment({ experiment, actionType: UpsertExperimentType.CREATE_NEW_EXPERIMENT })
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
    return combineLatest(
      this.store$.pipe(select(selectExperimentById, { experimentId }))
    ).pipe(
      map(([experiment]) => {
        if (!experiment) {
          this.fetchExperimentById(experimentId);
        }
        return experiment;
      }),
    );
  }

  fetchExperimentById(experimentId: string) {
    this.store$.dispatch(experimentAction.actionGetExperimentById({ experimentId }));
  }

  updateExperimentState(experimentId: string, experimentStateInfo: ExperimentStateInfo) {
    this.store$.dispatch(experimentAction.actionUpdateExperimentState({ experimentId, experimentStateInfo }));
  }

  setSearchKey(searchKey: EXPERIMENT_SEARCH_KEY) {
    this.store$.dispatch(experimentAction.actionSetSearchKey({ searchKey }));
  }

  setSearchString(searchString: string) {
    this.store$.dispatch(experimentAction.actionSetSearchString({ searchString }));
  }

  setSortKey(sortKey: EXPERIMENT_SORT_KEY) {
    this.store$.dispatch(experimentAction.actionSetSortKey({ sortKey }));
  }

  setSortingType(sortingType: EXPERIMENT_SORT_AS) {
    this.store$.dispatch(experimentAction.actionSetSortingType({ sortingType }));
  }

  fetchAllExperimentNames() {
    this.store$.dispatch(experimentAction.actionFetchAllExperimentNames());
  }
}
