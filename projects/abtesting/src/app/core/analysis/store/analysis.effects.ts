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
