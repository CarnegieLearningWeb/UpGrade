import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as experimentAction from './experiments.actions';
import { ExperimentDataService } from '../experiments.data.service';
import { mergeMap, map, filter, switchMap, catchError } from 'rxjs/operators';
import { UpsertExperimentType, IExperimentEnrollmentStats } from './experiments.model';

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
            switchMap((experiments: any) => {
              const experimentIds = experiments.map(experiment => experiment.id);
              return this.experimentDataService.getAllExperimentsStats(experimentIds).pipe(
                switchMap((stats: any) => {
                  const experimentStats = stats.reduce((acc, stat: IExperimentEnrollmentStats) =>
                    ({ ...acc, [stat.id]: stat })
                    , {});
                  return [
                    experimentAction.actionStoreExperiment({ experiments }),
                    experimentAction.actionStoreExperimentStats({ stats: experimentStats })
                  ];
                }),
                catchError(error => [experimentAction.actionGetAllExperimentFailure(error)])
              );
            }),
            catchError(error => [experimentAction.actionGetAllExperimentFailure(error)])
          )
        )
      )
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
