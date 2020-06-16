import { Injectable } from '@angular/core';
import { AppState } from '../core.module';
import { Store, select } from '@ngrx/store';
import { selectMetrics, selectIsMetricsLoading, selectQueryResult, selectIsQueryExecuting } from './store/analysis.selectors';
import * as AnalysisActions from './store/analysis.actions';

@Injectable()
export class AnalysisService {

  constructor(
    private store$: Store<AppState>
  ) {}

  isMetricsLoading$ = this.store$.pipe(select(selectIsMetricsLoading));
  isQueryExecuting$ = this.store$.pipe(select(selectIsQueryExecuting));
  allMetrics$ = this.store$.pipe(select(selectMetrics));
  queryResult$ = this.store$.pipe(select(selectQueryResult));

  setMetricsFilterValue(filterString: string) {
    this.store$.dispatch(AnalysisActions.actionSetMetricsFilterValue({ filterString }));
  }

  executeQuery(queryId: string) {
    this.store$.dispatch(AnalysisActions.actionExecuteQuery({ queryId }));
  }

  setQueryResult(queryResult: any) {
    this.store$.dispatch(AnalysisActions.actionSetQueryResult({ queryResult }));
  }
}
