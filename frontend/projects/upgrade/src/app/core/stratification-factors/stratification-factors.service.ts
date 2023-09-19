import { Injectable } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { AppState } from '../core.state';
import * as StratificationFactorsActions from './store/stratification-factors.actions';

import {
  selectAllStratificationFactors,
  selectIsStratificationFactorsLoading,
} from './store/stratification-factors.selectors';

@Injectable({ providedIn: 'root' })
@Injectable()
export class StratificationFactorsService {
  isStratificationFactorsLoading$ = this.store$.pipe(select(selectIsStratificationFactorsLoading));
  allStratificationFactors$ = this.store$.pipe(select(selectAllStratificationFactors));

  constructor(private store$: Store<AppState>) {}

  fetchStratificationFactors(isLoading?: boolean) {
    this.store$.dispatch(StratificationFactorsActions.actionFetchStratificationFactors({ isLoading }));
  }
}
