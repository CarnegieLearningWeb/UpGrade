import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as AnalysisActions from './analysis.actions';
import { switchMap, catchError, map, filter } from 'rxjs/operators';
import { AnalysisDataService } from '../analysis.data.service';

@Injectable()
export class AnalysisEffects {

  constructor(
    private actions$: Actions,
    private analysisDataService: AnalysisDataService
  ) { }

  fetchMetrics$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AnalysisActions.actionFetchMetrics),
      switchMap(() =>
        this.analysisDataService.fetchMetrics().pipe(
          map((data: any) => AnalysisActions.actionFetchMetricsSuccess({ metrics: data })),
          catchError(() => [AnalysisActions.actionFetchMetricsFailure()])
        )
      )
    )
  );

  deleteMetrics$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AnalysisActions.actionDeleteMetric),
      map(action => action.key),
      filter(key => !!key),
      switchMap((key) =>
        this.analysisDataService.deleteMetric(key).pipe(
          map((data: any) => {
            if (data.length) {
              // If data is present then update tree
              return AnalysisActions.actionDeleteMetricSuccess({ metrics: data })
            } else {
              // if data length is 0 then it does not have any children so remove existing tree
              return AnalysisActions.actionDeleteMetricSuccess({ metrics: data, key })
            }
          }),
          catchError(() => [AnalysisActions.actionDeleteMetricFailure()])
        )
      )
    )
  );

  executeQuery$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AnalysisActions.actionExecuteQuery),
      map(action => action.queryId),
      filter(queryId => !!queryId),
      switchMap((queryId) =>
        this.analysisDataService.executeQuery(queryId).pipe(
          map((data: any) => AnalysisActions.actionExecuteQuerySuccess({ queryResult: data })),
          catchError(() => [AnalysisActions.actionExecuteQueryFailure()])
        )
      )
    )
  );
}
