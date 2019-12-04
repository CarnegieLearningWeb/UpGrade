import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Experiment } from './experiments.model';
import { Store, select } from '@ngrx/store';
import { AppState } from '../../../../core/core.state';
import { selectAllExperiment } from './experiments.selectors';
import * as experimentAction from './experiments.actions';

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
