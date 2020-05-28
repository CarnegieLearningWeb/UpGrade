import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as AnalysisActions from './analysis.actions';
import { map, filter, switchMap, catchError } from 'rxjs/operators';
import { AnalysisDataService } from '../analysis.data.service';

@Injectable()
export class AnalysisEffects {

  constructor(
    private actions$: Actions,
    private analysisDataService: AnalysisDataService
  ) { }

  fetchExperimentAnalysis$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AnalysisActions.actionFetchAnalysis),
      map(action => action.query),
      filter(query => !!query),
      switchMap((query) =>
        this.analysisDataService.fetchAnalysisData(query).pipe(
          map((data: any) => AnalysisActions.actionFetchAnalysisSuccess({ data })),
          catchError(() => [AnalysisActions.actionFetchAnalysisFailure()])
        )
      )
    )
  );
}
