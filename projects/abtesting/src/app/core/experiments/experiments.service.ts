import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Experiment } from './store/experiments.model';
import { Store, select } from '@ngrx/store';
import { selectAllExperiment } from './store/experiments.selectors';
import * as experimentAction from './store//experiments.actions';
import { AppState } from '../core.state';

@Injectable()
export class ExperimentService {
  experiments$: Observable<Experiment[]>;
  constructor(private store: Store<AppState>) {
    this.experiments$ = this.store.pipe(select(selectAllExperiment));
  }

  loadExperiments() {
    return this.store.dispatch(experimentAction.actionGetAllExperiment());
  }
}
