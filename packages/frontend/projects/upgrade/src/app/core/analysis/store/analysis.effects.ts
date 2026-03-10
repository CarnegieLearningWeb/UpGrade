import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as AnalysisActions from './analysis.actions';
import { switchMap, catchError, map, filter, withLatestFrom } from 'rxjs/operators';
import { AnalysisDataService } from '../analysis.data.service';
import { Store, select } from '@ngrx/store';
import { AppState } from '../../core.state';
import { selectQueryResult } from './analysis.selectors';

@Injectable()
export class AnalysisEffects {
  constructor(
    private actions$: Actions,
    private store$: Store<AppState>,
    private analysisDataService: AnalysisDataService
  ) {}

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

  upsertMetrics$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AnalysisActions.actionUpsertMetrics),
      map((action) => action.metrics),
      filter((metrics) => !!metrics),
      switchMap((metrics) =>
        this.analysisDataService.upsertMetrics(metrics).pipe(
          map(() => AnalysisActions.actionFetchMetrics()),
          catchError(() => [AnalysisActions.actionUpsertMetricsFailure()])
        )
      )
    )
  );

  deleteMetrics$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AnalysisActions.actionDeleteMetric),
      map((action) => action.key),
      filter((key) => !!key),
      switchMap((key) =>
        this.analysisDataService.deleteMetric(key).pipe(
          map((data: any) => {
            if (data.length) {
              // If data is present then update tree
              return AnalysisActions.actionDeleteMetricSuccess({ metrics: data });
            } else {
              // if data length is 0 then it does not have any children so remove existing tree
              return AnalysisActions.actionDeleteMetricSuccess({ metrics: data, key });
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
      map((action) => action.queryIds),
      filter((queryIds) => !!queryIds.length),
      withLatestFrom(this.store$.pipe(select(selectQueryResult))),
      switchMap(([queryIds, queryResult]) =>
        this.analysisDataService.executeQuery(queryIds).pipe(
          map((data: any) => {
            let newResults = queryResult && queryResult.length ? queryResult : [];
            if (data.length) {
              data.map((res) => {
                const existingResultIndex = newResults.findIndex((result) => result.id === res.id);
                if (existingResultIndex !== -1) {
                  newResults[existingResultIndex] = res;
                } else {
                  newResults = [...newResults, res];
                }
              });
            }
            return AnalysisActions.actionExecuteQuerySuccess({ queryResult: newResults });
          }),
          catchError(() => [AnalysisActions.actionExecuteQueryFailure()])
        )
      )
    )
  );
}
