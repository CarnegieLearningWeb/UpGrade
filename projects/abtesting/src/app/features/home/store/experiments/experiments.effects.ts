import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as experimentAction from './experiments.actions';
import { ExperimentDataService } from './experiments.data.service';
import { mergeMap, map } from 'rxjs/operators';

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
}
