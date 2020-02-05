import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as experimentAction from './experiments.actions';
import { ExperimentDataService } from '../experiments.data.service';
import { mergeMap, map, filter, switchMap, catchError, tap, withLatestFrom } from 'rxjs/operators';
import { UpsertExperimentType, IExperimentEnrollmentStats, Experiment } from './experiments.model';
import { Router } from '@angular/router';
import { Store, select } from '@ngrx/store';
import { AppState } from '../../core.module';
import { selectExperimentStats } from './experiments.selectors';
import { selectCurrentUser } from '../../auth/store/auth.selectors';

@Injectable()
export class ExperimentEffects {
  constructor(
    private actions$: Actions,
    private store$: Store<AppState>,
    private experimentDataService: ExperimentDataService,
    private router: Router
  ) {}

  getAllExperiment$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(experimentAction.actionGetAllExperiment),
        withLatestFrom(
          this.store$.pipe(select(selectCurrentUser))
        ),
        filter(([, currentUser]) => !!currentUser),
        mergeMap(([, { token }]) =>
          this.experimentDataService.getAllExperiment(token).pipe(
            switchMap((experiments: any) => {
              const experimentIds = experiments.map(experiment => experiment.id);
              return this.experimentDataService.getAllExperimentsStats(experimentIds, token).pipe(
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
      withLatestFrom(
        this.store$.pipe(select(selectExperimentStats)),
        this.store$.pipe(select(selectCurrentUser))
      ),
      filter(([, _, currentUser]) => !!currentUser),
      switchMap(([{ experiment, actionType }, experimentStats,  { token }]) => {
        const experimentMethod =
          actionType === UpsertExperimentType.CREATE_NEW_EXPERIMENT
            ? this.experimentDataService.createNewExperiment(experiment, token)
            : this.experimentDataService.updateExperiment(experiment, token);
        return experimentMethod.pipe(
          switchMap((data: Experiment) => this.experimentDataService.getAllExperimentsStats([data.id], token).pipe(
            switchMap((experimentStat: IExperimentEnrollmentStats) => {
              const stats = { ...experimentStats, [data.id]: experimentStat[0] };
              return [
                experimentAction.actionStoreExperimentStats({ stats }),
                experimentAction.actionUpsertExperimentSuccess({ experiment: data })
              ];
            }),
          )),
          catchError(() => [experimentAction.actionUpsertExperimentFailure()])
        );
      })
    )
  );

  deleteExperiment$ = createEffect(() =>
    this.actions$.pipe(
      ofType(experimentAction.actionDeleteExperiment),
      map(action => action.experimentId),
      withLatestFrom(
        this.store$.pipe(select(selectCurrentUser))
      ),
      filter(([experimentId, currentUser]) => !!experimentId && !!currentUser),
      switchMap(([experimentId, { token }]) => {
        return this.experimentDataService.deleteExperiment(experimentId, token).pipe(
          map(_ => experimentAction.actionDeleteExperimentSuccess({ experimentId })),
          catchError(error => [experimentAction.actionDeleteExperimentFailure()])
        )
      })
    )
  );

  navigateOnDeleteExperiment$ = createEffect(() =>
    this.actions$.pipe(
      ofType(experimentAction.actionDeleteExperimentSuccess),
      map(action => action.experimentId),
      filter(experimentStatId => !!experimentStatId),
      tap((experimentStatId) => {
        this.store$.dispatch(experimentAction.actionRemoveExperimentStat({ experimentStatId }));
        this.router.navigate(['/home']);
      })
    ),
    { dispatch: false }
  )
}
