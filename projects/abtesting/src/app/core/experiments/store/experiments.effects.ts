import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as experimentAction from './experiments.actions';
import { ExperimentDataService } from '../experiments.data.service';
import { mergeMap, map, filter, switchMap, catchError } from 'rxjs/operators';
import { UpsertExperimentType } from './experiments.model';

@Injectable()
export class ExperimentEffects {
  constructor(
    private actions$: Actions,
    private experimentDataService: ExperimentDataService
  ) {}

  getAllExperiment$ = createEffect(
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

  UpsertExperiment$ = createEffect(() =>
    this.actions$.pipe(
      ofType(experimentAction.actionUpsertExperiment),
      map(action => ({ experiment: action.experiment, actionType: action.actionType })),
      filter(({ experiment, actionType }) => !!experiment && !!actionType),
      switchMap(({ experiment, actionType }) => {
        const experimentMethod =
          actionType === UpsertExperimentType.CREATE_NEW_EXPERIMENT
            ? this.experimentDataService.createNewExperiment(experiment)
            : this.experimentDataService.updateExperiment(experiment);
        return experimentMethod.pipe(
          map((data: any) => experimentAction.actionUpsertExperimentSuccess({ experiment: data }) ),
          catchError(() => [experimentAction.actionUpsertExperimentFailure()])
        );
      })
    )
  );
}
