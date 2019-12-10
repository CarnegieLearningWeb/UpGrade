import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Experiment } from './store/experiments.model';
import { Store, select } from '@ngrx/store';
import { selectAllExperiment, selectIsLoadingExperiment } from './store/experiments.selectors';
import * as experimentAction from './store//experiments.actions';
import { AppState } from '../core.state';

@Injectable()
export class ExperimentService {
  constructor(private store$: Store<AppState>) {}

  experiments$: Observable<Experiment[]> = this.store$.pipe(select(selectAllExperiment));
  isLoadingExperiment$ = this.store$.pipe(select(selectIsLoadingExperiment));

  loadExperiments() {
    return this.store$.dispatch(experimentAction.actionGetAllExperiment());
  }
}
