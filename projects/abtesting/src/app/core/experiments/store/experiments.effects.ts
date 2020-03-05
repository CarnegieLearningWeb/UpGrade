import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as experimentAction from './experiments.actions';
import * as logsAction from '../../logs/store/logs.actions';
import { ExperimentDataService } from '../experiments.data.service';
import { mergeMap, map, filter, switchMap, catchError, tap, withLatestFrom } from 'rxjs/operators';
import { UpsertExperimentType, IExperimentEnrollmentStats, Experiment } from './experiments.model';
import { Router } from '@angular/router';
import { Store, select } from '@ngrx/store';
import { AppState } from '../../core.module';
import { selectExperimentStats } from './experiments.selectors';

@Injectable()
export class ExperimentEffects {
  constructor(
    private actions$: Actions,
    private store$: Store<AppState>,
    private experimentDataService: ExperimentDataService,
    private router: Router
  ) {}

  getAllExperiment$ = createEffect(() =>
    this.actions$.pipe(
      ofType(experimentAction.actionGetAllExperiment),
      mergeMap(() =>
        this.experimentDataService.getAllExperiment().pipe(
          switchMap((experiments: any) => {
            const experimentIds = experiments.map(experiment => experiment.id);
            return this.experimentDataService.getAllExperimentsStats(experimentIds).pipe(
              switchMap((stats: any) => {
                const experimentStats = stats.reduce(
                  (acc, stat: IExperimentEnrollmentStats) => ({ ...acc, [stat.id]: stat }),
                  {}
                );
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
      withLatestFrom(this.store$.pipe(select(selectExperimentStats))),
      switchMap(([{ experiment, actionType }, experimentStats]) => {
        const experimentMethod =
          actionType === UpsertExperimentType.CREATE_NEW_EXPERIMENT
            ? this.experimentDataService.createNewExperiment(experiment)
            : this.experimentDataService.updateExperiment(experiment);
        return experimentMethod.pipe(
          switchMap((data: Experiment) =>
            this.experimentDataService.getAllExperimentsStats([data.id]).pipe(
              switchMap((experimentStat: IExperimentEnrollmentStats) => {
                const stats = { ...experimentStats, [data.id]: experimentStat[0] };
                return [
                  experimentAction.actionStoreExperimentStats({ stats }),
                  experimentAction.actionUpsertExperimentSuccess({ experiment: data }),
                  experimentAction.actionFetchAllPartitions(),
                  experimentAction.actionFetchAllUniqueIdentifiers()
                ];
              })
            )
          ),
          catchError(() => [experimentAction.actionUpsertExperimentFailure()])
        );
      })
    )
  );

  updateExperimentState$ = createEffect(() =>
    this.actions$.pipe(
      ofType(experimentAction.actionUpdateExperimentState),
      map(action => ({ experimentId: action.experimentId, experimentState: action.experimentStateInfo })),
      filter(({ experimentId, experimentState }) => !!experimentId && !!experimentState),
      switchMap(({ experimentId, experimentState }) =>
        this.experimentDataService.updateExperimentState(experimentId, experimentState).pipe(
          switchMap((result: Experiment) => [
            experimentAction.actionUpdateExperimentStateSuccess({ experiment: result[0] })
          ]),
          catchError(() => [experimentAction.actionUpdateExperimentStateFailure()])
        )
      )
    )
  );

  deleteExperiment$ = createEffect(() =>
    this.actions$.pipe(
      ofType(experimentAction.actionDeleteExperiment),
      map(action => action.experimentId),
      filter(experimentId => !!experimentId),
      switchMap(experimentId => {
        return this.experimentDataService.deleteExperiment(experimentId).pipe(
          switchMap(_ => [experimentAction.actionDeleteExperimentSuccess({ experimentId })]),
          catchError(() => [experimentAction.actionDeleteExperimentFailure()])
        );
      })
    )
  );

  fetchAllPartitions = createEffect(() =>
    this.actions$.pipe(
      ofType(experimentAction.actionFetchAllPartitions),
      switchMap(() =>
        this.experimentDataService.fetchAllPartitions().pipe(
          map(allPartitions => experimentAction.actionFetchAllPartitionSuccess({ partitions: allPartitions })),
          catchError(() => [experimentAction.actionFetchAllPartitionFailure()])
        )
      )
    )
  );

  fetchAllUniqueIdentifiers = createEffect(() =>
    this.actions$.pipe(
      ofType(experimentAction.actionFetchAllUniqueIdentifiers),
      switchMap(() =>
        this.experimentDataService.fetchAllUniqueIdentifiers().pipe(
          map(uniqueIdentifiers => experimentAction.actionFetchAllUniqueIdentifiersSuccess({ uniqueIdentifiers })),
          catchError(() => [experimentAction.actionFetchAllUniqueIdentifiersFailure()])
        )
      )
    )
  );

  navigateOnDeleteExperiment$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(experimentAction.actionDeleteExperimentSuccess),
        map(action => action.experimentId),
        filter(experimentStatId => !!experimentStatId),
        tap(experimentStatId => {
          this.store$.dispatch(experimentAction.actionRemoveExperimentStat({ experimentStatId }));
          this.router.navigate(['/home']);
        })
      ),
    { dispatch: false }
  );
}
