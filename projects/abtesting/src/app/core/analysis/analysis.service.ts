import { Injectable } from '@angular/core';
import { AppState } from '../core.module';
import { Store, select } from '@ngrx/store';
import { selectIsAnalysisLoading } from './store/analysis.selectors';

@Injectable()
export class AnalysisService {

  constructor(
    private store$: Store<AppState>
  ) {}

  isAnalysisDataLoading$ = this.store$.pipe(select(selectIsAnalysisLoading));
}
