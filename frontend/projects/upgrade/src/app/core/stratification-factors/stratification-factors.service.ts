import { Injectable } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { AppState } from '../core.state';
import * as StratificationFactorsActions from './store/stratification-factors.actions';
import {
  selectAllStratificationFactors,
  selectIsLoadingStratificationFactors,
} from './store/stratification-factors.selectors';
import { CsvDataItem } from './store/stratification-factors.model';

@Injectable({ providedIn: 'root' })
export class StratificationFactorsService {
  isLoading$ = this.store$.pipe(select(selectIsLoadingStratificationFactors));
  allStratificationFactors$ = this.store$.pipe(select(selectAllStratificationFactors));

  constructor(private store$: Store<AppState>) {}

  fetchStratificationFactors(isLoading?: boolean) {
    this.store$.dispatch(StratificationFactorsActions.actionFetchStratificationFactors({ isLoading }));
  }

  deleteStratificationFactors(factor: string) {
    this.store$.dispatch(StratificationFactorsActions.actionDeleteStratificationFactor({ factor }));
  }

  importStratificationFactors(csvData: CsvDataItem[]) {
    this.store$.dispatch(StratificationFactorsActions.actionImportStratificationFactor({ csvData }));
  }

  exportStratificationFactors(factor: string) {
    this.store$.dispatch(StratificationFactorsActions.actionExportStratificationFactor({ factor }));
  }
}
