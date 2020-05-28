import { Injectable } from '@angular/core';
import { AppState } from '../core.module';
import { Store, select } from '@ngrx/store';
import * as AnalysisActions from './store/analysis.actions';
import { selectIsAnalysisLoading, selectAnalysisData } from './store/analysis.selectors';
import { IQueryBuilder } from './store/analysis.models';

@Injectable()
export class AnalysisService {

  constructor(
    private store$: Store<AppState>
  ) {}

  isAnalysisDataLoading$ = this.store$.pipe(select(selectIsAnalysisLoading));
  analysisData$ = this.store$.pipe(select(selectAnalysisData));

  fetchExperimentAnalysis(query: IQueryBuilder) {
    this.store$.dispatch(AnalysisActions.actionFetchAnalysis({ query }));
  }

  setData(data: any) {
    this.store$.dispatch(AnalysisActions.actionSetData(data));
  }
}
