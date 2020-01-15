import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Experiment, UpsertExperimentType } from './store/experiments.model';
import { Store, select } from '@ngrx/store';
import { selectAllExperiment, selectIsLoadingExperiment, selectSelectedExperiment } from './store/experiments.selectors';
import * as experimentAction from './store//experiments.actions';
import { AppState } from '../core.state';
import { map } from 'rxjs/operators';

@Injectable()
export class ExperimentService {
  constructor(private store$: Store<AppState>) {}

  experiments$: Observable<Experiment[]> = this.store$.pipe(
    select(selectAllExperiment),
    map(experiments => experiments.sort((a, b) => {
      const d1 = new Date(a.createdAt);
      const d2 = new Date(b.createdAt);
      return d1 < d2 ? 1 : (d1 > d2) ? -1 : 0;
    }))
  );
  isLoadingExperiment$ = this.store$.pipe(select(selectIsLoadingExperiment));
  selectedExperiment$ = this.store$.pipe(select(selectSelectedExperiment));

  loadExperiments() {
    return this.store$.dispatch(experimentAction.actionGetAllExperiment());
  }

  createNewExperiment(experiment: Experiment) {
    this.store$.dispatch(experimentAction.actionUpsertExperiment({ experiment, actionType: UpsertExperimentType.CREATE_NEW_EXPERIMENT }));
  }

  updateExperiment(experiment: Experiment) {
    this.store$.dispatch(experimentAction.actionUpsertExperiment({ experiment, actionType: UpsertExperimentType.UPDATE_EXPERIMENT }));
  }
}
