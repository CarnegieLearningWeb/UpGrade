import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from '../../core.state';

@Injectable({ providedIn: 'root' })
export class ExperimentDesignStepperEffects {
  constructor(private store$: Store<AppState>) {}
}
