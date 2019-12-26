import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as experimentAction from './experiments.actions';
import { ExperimentDataService } from '../experiments.data.service';
import { mergeMap, map, filter, switchMap, catchError } from 'rxjs/operators';

@Injectable()
export class ExperimentEffects {
  constructor(
    private actions$: Actions,
    private experimentDataService: ExperimentDataService
  ) {}

  getAllExperiment = createEffect(
    () =>
      this.actions$.pipe(
        ofType(experimentAction.actionGetAllExperiment),
        mergeMap(() =>
          this.experimentDataService.getAllExperiment().pipe(
            map((data: any) => {
              return experimentAction.actionStoreExperiment({
                experiments: data
              });
            })
          )
        )
      ),
    { dispatch: true }
  );

  createNewExperiment = createEffect(
    () =>
      this.actions$.pipe(
        ofType(experimentAction.actionCreateNewExperiment),
        map(action => action.experiment),
        filter(experiment => !!experiment),
        switchMap((experiment) => this.experimentDataService.createNewExperiment(experiment).pipe(
            map((data: any) => experimentAction.actionCreateNewExperimentSuccess({ experiment: data })),
            catchError(() => [experimentAction.actionCreateNewExperimentFailure()])
          )
        )
      )
  );
}
