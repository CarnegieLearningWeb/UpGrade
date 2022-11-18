import { Injectable } from '@angular/core';
import { selecthasExperimentStepperDataChanged } from './store/experiments.selectors';
import { Store, select } from '@ngrx/store';
import { AppState } from '../core.state';
import * as experimentAction from './store//experiments.actions';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ExperimentDesignStepperService {
  expStepperDataChangedflag = false;
  hasExperimentStepperDataChanged$: Observable<boolean>;

  constructor(private store$: Store<AppState>) {
    this.hasExperimentStepperDataChanged$ = this.store$.pipe(select(selecthasExperimentStepperDataChanged));
    this.hasExperimentStepperDataChanged$.subscribe(
      (isdataChanged) => (this.expStepperDataChangedflag = isdataChanged)
    );
  }

  getHasExperimentDesignStepperDataChanged() {
    return this.expStepperDataChangedflag;
  }

  experimentStepperDataChanged() {
    this.store$.dispatch(experimentAction.experimentStepperDataChanged());
  }

  experimentStepperDataReset() {
    this.store$.dispatch(experimentAction.experimentStepperDataReset());
  }
}
