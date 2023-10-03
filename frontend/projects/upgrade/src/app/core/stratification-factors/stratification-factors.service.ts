import { Injectable } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { AppState } from '../core.state';
import * as StratificationFactorsActions from './store/stratification-factors.actions';
import { filter, map } from 'rxjs/operators';
import {
  selectAllStratificationFactors,
  selectIsLoadingStratificationFactors,
} from './store/stratification-factors.selectors';

@Injectable({ providedIn: 'root' })
@Injectable()
export class StratificationFactorsService {
  isLoadingStratificationFactors$ = this.store$.pipe(select(selectIsLoadingStratificationFactors));
  allStratificationFactors$ = this.store$.pipe(select(selectAllStratificationFactors));

  constructor(private store$: Store<AppState>) {}

  fetchStratificationFactors(isLoading?: boolean) {
    this.store$.dispatch(StratificationFactorsActions.actionFetchStratificationFactors({ isLoading }));
  }

  deleteStratificationFactors(factor: string) {
    this.store$.dispatch(StratificationFactorsActions.actionDeleteStratificationFactor({ factor }));
  }

  importStratificationFactors(csvData: string) {
    this.store$.dispatch(StratificationFactorsActions.actionImportStratificationFactor({ csvData }));
  }

  exportStratificationFactors(factor: string) {
    this.store$.dispatch(StratificationFactorsActions.actionExportStratificationFactor({ factor }));
  }
}
