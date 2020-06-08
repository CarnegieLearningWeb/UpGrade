import { Injectable } from '@angular/core';
import { AppState } from '../core.module';
import { Store, select } from '@ngrx/store';
import { selectMetrics, selectQueries, selectIsMetricsLoading, selectIsQueriesLoading, selectQueryResult, selectIsQueryExecuting } from './store/analysis.selectors';
import * as AnalysisActions from './store/analysis.actions';

@Injectable()
export class AnalysisService {

  constructor(
    private store$: Store<AppState>
  ) {}

  isMetricsLoading$ = this.store$.pipe(select(selectIsMetricsLoading));
  isQueriesLoading$ = this.store$.pipe(select(selectIsQueriesLoading));
  isQueryExecuting$ = this.store$.pipe(select(selectIsQueryExecuting));
  allMetrics$ = this.store$.pipe(select(selectMetrics));
  allQueries$ = this.store$.pipe(select(selectQueries));
  queryResult$ = this.store$.pipe(select(selectQueryResult));

  setMetricsFilterValue(filterString: string) {
    this.store$.dispatch(AnalysisActions.actionSetMetricsFilterValue({ filterString }));
  }

  setQueriesFilterValue(filterString: string) {
    this.store$.dispatch(AnalysisActions.actionSetQueriesFilterValue({ filterString }));
  }

  executeQuery(queryId: string) {
    this.store$.dispatch(AnalysisActions.actionExecuteQuery({ queryId }));
  }

  saveQuery(query: any) {
    this.store$.dispatch(AnalysisActions.actionSaveQuery({ query }));
  }

  setQueryResult(queryResult: any) {
    this.store$.dispatch(AnalysisActions.actionSetQueryResult({ queryResult }));
  }
}
