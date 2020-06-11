import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as AnalysisActions from './analysis.actions';
import * as ExperimentsActions from '../../experiments/store/experiments.actions';
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

  fetchQueries$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AnalysisActions.actionFetchQueries),
      switchMap(() =>
        this.analysisDataService.fetchQueries().pipe(
          map((data: any) => AnalysisActions.actionFetchQueriesSuccess({ queries: data })),
          catchError(() => [AnalysisActions.actionFetchQueriesFailure()])
        )
      )
    )
  );

  // TODO: Analysis query
  // saveQueries$ = createEffect(() =>
  //   this.actions$.pipe(
  //     ofType(AnalysisActions.actionSaveQuery),
  //     map(action => action.query),
  //     filter(query => !!query),
  //     switchMap((query) =>
  //       this.analysisDataService.saveQueries(query).pipe(
  //         switchMap((data: any) => [
  //           AnalysisActions.actionSaveQuerySuccess({ query: data }),
  //           ExperimentsActions.actionGetExperimentById({ experimentId: query.experimentId })
  //         ]),
  //         catchError(() => [AnalysisActions.actionSaveQueryFailure()])
  //       )
  //     )
  //   )
  // );

  // deleteQuery$ = createEffect(() =>
  //   this.actions$.pipe(
  //     ofType(AnalysisActions.actionDeleteQuery),
  //     map(action => action.queryId),
  //     filter(queryId => !!queryId),
  //     switchMap((queryId) =>
  //       this.analysisDataService.deleteQuery(queryId).pipe(
  //         switchMap((data: any) => [
  //           AnalysisActions.actionDeleteQuerySuccess({ query: data[0] }),
  //           ExperimentsActions.actionGetExperimentById({ experimentId: data[0].experimentId })
  //         ]),
  //         catchError(() => [AnalysisActions.actionDeleteQueryFailure()])
  //       )
  //     )
  //   )
  // );

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
