import { Inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as experimentAction from './experiments.actions';
import * as analysisAction from '../../analysis/store/analysis.actions';
import { ExperimentDataService } from '../experiments.data.service';
import {
  map,
  filter,
  switchMap,
  catchError,
  tap,
  withLatestFrom,
  first,
  mergeMap,
  takeWhile,
  take,
} from 'rxjs/operators';
import {
  UpsertExperimentType,
  IExperimentEnrollmentStats,
  Experiment,
  NUMBER_OF_EXPERIMENTS,
  ExperimentPaginationParams,
  IExperimentEnrollmentDetailStats,
  IContextMetaData,
} from './experiments.model';
import { Router } from '@angular/router';
import { Store, select } from '@ngrx/store';
import { AppState } from '../../core.module';
import {
  selectExperimentStats,
  selectSkipExperiment,
  selectSearchKey,
  selectSortAs,
  selectSortKey,
  selectTotalExperiment,
  selectSearchString,
  selectExperimentGraphInfo,
  selectContextMetaData,
  selectExperimentById,
  selectIsPollingExperimentDetailStats,
  selectExperimentGraphRange,
} from './experiments.selectors';
import { interval } from 'rxjs';
import { selectCurrentUser } from '../../auth/store/auth.selectors';
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar';
import { ENV, Environment } from '../../../../environments/environment-types';
import JSZip from 'jszip';

@Injectable()
export class ExperimentEffects {
  constructor(
    private actions$: Actions,
    private store$: Store<AppState>,
    private experimentDataService: ExperimentDataService,
    private router: Router,
    private _snackBar: MatSnackBar,
    @Inject(ENV) private environment: Environment
  ) {}

  getPaginatedExperiment$ = createEffect(() =>
    this.actions$.pipe(
      ofType(experimentAction.actionGetExperiments),
      map((action) => action.fromStarting),
      withLatestFrom(
        this.store$.pipe(select(selectSkipExperiment)),
        this.store$.pipe(select(selectTotalExperiment)),
        this.store$.pipe(select(selectSearchKey)),
        this.store$.pipe(select(selectSortKey)),
        this.store$.pipe(select(selectSortAs))
      ),
      filter(([fromStarting, skip, total]) => skip < total || total === null || fromStarting),
      tap(() => {
        this.store$.dispatch(experimentAction.actionSetIsLoadingExperiment({ isLoadingExperiment: true }));
      }),
      switchMap(([fromStarting, skip, _, searchKey, sortKey, sortAs]) => {
        let searchString = null;
        // As withLatestFrom does not support more than 5 arguments
        // TODO: Find alternative
        this.getSearchString$().subscribe((searchInput) => {
          searchString = searchInput;
        });
        let params: ExperimentPaginationParams = {
          skip: fromStarting ? 0 : skip,
          take: NUMBER_OF_EXPERIMENTS,
        };
        if (sortKey) {
          params = {
            ...params,
            sortParams: {
              key: sortKey,
              sortAs,
            },
          };
        }
        if (searchString) {
          params = {
            ...params,
            searchParams: {
              key: searchKey,
              string: searchString,
            },
          };
        }
        return this.experimentDataService.getAllExperiment(params).pipe(
          switchMap((data: any) => {
            const experiments = data.nodes;
            const experimentIds = experiments.map((experiment) => experiment.id);
            const actions = fromStarting ? [experimentAction.actionSetSkipExperiment({ skipExperiment: 0 })] : [];

            return [
              ...actions,
              experimentAction.actionGetExperimentsSuccess({ experiments, totalExperiments: data.total }),
              experimentAction.actionFetchExperimentStats({ experimentIds }),
            ];
          }),
          catchError((error) => [experimentAction.actionGetExperimentsFailure(error)])
        );
      })
    )
  );

  fetchExperimentStatsForHome$ = createEffect(() =>
    this.actions$.pipe(
      ofType(experimentAction.actionFetchExperimentStats),
      map((action) => action.experimentIds),
      filter((experimentIds) => !!experimentIds.length),
      switchMap((experimentIds) =>
        this.experimentDataService.getAllExperimentsStats(experimentIds).pipe(
          map((stats: any) => {
            const experimentStats = stats.reduce(
              (acc, stat: IExperimentEnrollmentStats) => ({ ...acc, [stat.id]: stat }),
              {}
            );
            return experimentAction.actionFetchExperimentStatsSuccess({ stats: experimentStats });
          }),
          catchError(() => [experimentAction.actionFetchExperimentStatsFailure()])
        )
      )
    )
  );

  UpsertExperiment$ = createEffect(() =>
    this.actions$.pipe(
      ofType(experimentAction.actionUpsertExperiment),
      map((action) => ({ experiment: action.experiment, actionType: action.actionType })),
      filter(({ experiment, actionType }) => !!experiment && !!actionType),
      withLatestFrom(this.store$.pipe(select(selectExperimentStats))),
      switchMap(([{ experiment, actionType }, experimentStats]) => {
        const experimentMethod =
          actionType === UpsertExperimentType.CREATE_NEW_EXPERIMENT
            ? this.experimentDataService.createNewExperiment(experiment)
            : actionType === UpsertExperimentType.IMPORT_EXPERIMENT
            ? this.experimentDataService.importExperiment([])
            : this.experimentDataService.updateExperiment(experiment);
        return experimentMethod.pipe(
          switchMap((data: Experiment) =>
            this.experimentDataService.getAllExperimentsStats([data.id]).pipe(
              switchMap((experimentStat: IExperimentEnrollmentStats) => {
                const stats = { ...experimentStats, [data.id]: experimentStat[0] };
                const queryIds = data.queries.map((query) => query.id);
                return [
                  experimentAction.actionFetchExperimentStatsSuccess({ stats }),
                  experimentAction.actionUpsertExperimentSuccess({ experiment: data }),
                  experimentAction.actionFetchAllDecisionPoints(),
                  analysisAction.actionExecuteQuery({ queryIds }),
                ];
              })
            )
          ),
          catchError((error) => {
            this._snackBar.open(error.error.message, null, { duration: 2000 });
            return [experimentAction.actionUpsertExperimentFailure()];
          })
        );
      })
    )
  );

  updateExperimentState$ = createEffect(() =>
    this.actions$.pipe(
      ofType(experimentAction.actionUpdateExperimentState),
      map((action) => ({ experimentId: action.experimentId, experimentState: action.experimentStateInfo })),
      filter(({ experimentId, experimentState }) => !!experimentId && !!experimentState),
      switchMap(({ experimentId, experimentState }) =>
        this.experimentDataService.updateExperimentState(experimentId, experimentState).pipe(
          switchMap((result: Experiment) => [
            experimentAction.actionUpdateExperimentStateSuccess({ experiment: result }),
          ]),
          catchError(() => [experimentAction.actionUpdateExperimentStateFailure()])
        )
      )
    )
  );

  deleteExperiment$ = createEffect(() =>
    this.actions$.pipe(
      ofType(experimentAction.actionDeleteExperiment),
      map((action) => action.experimentId),
      filter((experimentId) => !!experimentId),
      switchMap((experimentId) =>
        this.experimentDataService.deleteExperiment(experimentId).pipe(
          switchMap(() => [
            experimentAction.actionDeleteExperimentSuccess({ experimentId }),
            experimentAction.actionFetchAllDecisionPoints(),
          ]),
          catchError(() => [experimentAction.actionDeleteExperimentFailure()])
        )
      )
    )
  );

  getExperimentById$ = createEffect(() =>
    this.actions$.pipe(
      ofType(experimentAction.actionGetExperimentById),
      map((action) => action.experimentId),
      filter((experimentId) => !!experimentId),
      withLatestFrom(this.store$.pipe(select(selectExperimentStats))),
      mergeMap(([experimentId, experimentStats]) =>
        this.experimentDataService.getExperimentById(experimentId).pipe(
          switchMap((data: Experiment) =>
            this.experimentDataService.getAllExperimentsStats([data.id]).pipe(
              switchMap((stat: IExperimentEnrollmentStats) => {
                const stats = { ...experimentStats, [data.id]: stat[0] };
                return [
                  experimentAction.actionGetExperimentByIdSuccess({ experiment: data }),
                  experimentAction.actionFetchExperimentStatsSuccess({ stats }),
                ];
              })
            )
          )
        )
      )
    )
  );

  getExperimentDetailStat$ = createEffect(() =>
    this.actions$.pipe(
      ofType(experimentAction.actionFetchExperimentDetailStat),
      map((action) => action.experimentId),
      filter((experimentId) => !!experimentId),
      switchMap((experimentId) =>
        this.experimentDataService.getExperimentDetailStat(experimentId).pipe(
          map((data: IExperimentEnrollmentDetailStats) =>
            experimentAction.actionFetchExperimentDetailStatSuccess({ stat: data })
          ),
          catchError(() => [experimentAction.actionFetchExperimentDetailStatFailure()])
        )
      )
    )
  );

  beginExperimentDetailStatsPolling$ = createEffect(() =>
    this.actions$.pipe(
      ofType(experimentAction.actionBeginExperimentDetailStatsPolling),
      map((action) => action.experimentId),
      filter((experimentId) => !!experimentId),
      switchMap((experimentId) =>
        interval(this.environment.pollingInterval).pipe(
          switchMap(() => this.store$.pipe(select(selectIsPollingExperimentDetailStats))),
          takeWhile((isPolling) => isPolling),
          take(this.environment.pollingLimit),
          switchMap(() => this.store$.pipe(select(selectExperimentGraphRange))),
          switchMap((graphRange) => [
            experimentAction.actionFetchExperimentDetailStat({ experimentId }),
            experimentAction.actionFetchExperimentGraphInfo({
              experimentId,
              range: graphRange,
              clientOffset: -new Date().getTimezoneOffset(),
            }),
          ])
        )
      )
    )
  );

  fetchAllDecisionPoints = createEffect(() =>
    this.actions$.pipe(
      ofType(experimentAction.actionFetchAllDecisionPoints),
      switchMap(() =>
        this.experimentDataService.fetchAllPartitions().pipe(
          map((decisionPoints) => experimentAction.actionFetchAllDecisionPointsSuccess({ decisionPoints })),
          catchError(() => [experimentAction.actionFetchAllDecisionPointsFailure()])
        )
      )
    )
  );

  fetchAllExperimentNames$ = createEffect(() =>
    this.actions$.pipe(
      ofType(experimentAction.actionFetchAllExperimentNames),
      switchMap(() =>
        this.experimentDataService.fetchAllExperimentNames().pipe(
          map((data: any) => experimentAction.actionFetchAllExperimentNamesSuccess({ allExperimentNames: data })),
          catchError(() => [experimentAction.actionFetchAllExperimentNamesFailure()])
        )
      )
    )
  );

  fetchGroupAssignmentStatus$ = createEffect(() =>
    this.actions$.pipe(
      ofType(experimentAction.actionFetchGroupAssignmentStatus),
      map((action) => action.experimentId),
      switchMap((experimentId) =>
        this.experimentDataService.fetchGroupAssignmentStatus(experimentId).pipe(
          withLatestFrom(this.store$.pipe(select(selectExperimentById, { experimentId }))),
          map(([actionData, experimentData]) => {
            experimentData.groupSatisfied = actionData;
            return experimentAction.actionFetchGroupAssignmentStatusSuccess({ experiment: experimentData });
          }),
          catchError(() => [experimentAction.actionFetchGroupAssignmentStatusFailure()])
        )
      )
    )
  );

  fetchGraphInfo$ = createEffect(() =>
    this.actions$.pipe(
      ofType(experimentAction.actionFetchExperimentGraphInfo),
      map((action) => ({ experimentId: action.experimentId, range: action.range, clientOffset: action.clientOffset })),
      filter(({ experimentId, range, clientOffset }) => !!experimentId && !!range && !!clientOffset),
      withLatestFrom(this.store$.pipe(select(selectExperimentGraphInfo))),
      mergeMap(([{ experimentId, range, clientOffset }, graphData]) => {
        if (!graphData) {
          const params = {
            experimentId,
            dateEnum: range,
            clientOffset,
          };
          this.store$.dispatch(experimentAction.actionSetIsGraphLoading({ isGraphInfoLoading: true }));
          return this.experimentDataService.fetchExperimentGraphInfo(params).pipe(
            map((data: any) =>
              experimentAction.actionFetchExperimentGraphInfoSuccess({ range, graphInfo: data.reverse() })
            ),
            catchError(() => [
              experimentAction.actionFetchExperimentGraphInfoFailure(),
              experimentAction.actionSetIsGraphLoading({ isGraphInfoLoading: false }),
            ])
          );
        }
        return [];
      })
    )
  );

  setExperimentGraphRange$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(experimentAction.actionSetGraphRange),
        map((action) => ({
          experimentId: action.experimentId,
          range: action.range,
          clientOffset: action.clientOffset,
        })),
        filter(({ experimentId }) => !!experimentId),
        tap(({ experimentId, range, clientOffset }) => {
          if (range) {
            this.store$.dispatch(
              experimentAction.actionFetchExperimentGraphInfo({ experimentId, range, clientOffset })
            );
          } else {
            this.store$.dispatch(experimentAction.actionSetExperimentGraphInfo({ graphInfo: null }));
          }
        })
      ),
    { dispatch: false }
  );

  navigateOnDeleteExperiment$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(experimentAction.actionDeleteExperimentSuccess),
        map((action) => action.experimentId),
        filter((experimentStatId) => !!experimentStatId),
        tap((experimentStatId) => {
          this.store$.dispatch(experimentAction.actionRemoveExperimentStat({ experimentStatId }));
          this.router.navigate(['/home']);
        })
      ),
    { dispatch: false }
  );

  fetchExperimentOnSearchString$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(experimentAction.actionSetSearchString),
        map((action) => action.searchString),
        tap((searchString) => {
          // Allow empty string as we erasing text from search input
          if (searchString !== null) {
            this.store$.dispatch(experimentAction.actionGetExperiments({ fromStarting: true }));
          }
        })
      ),
    { dispatch: false }
  );

  fetchExperimentOnSearchKeyChange$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(experimentAction.actionSetSearchKey),
        withLatestFrom(this.store$.pipe(select(selectSearchString))),
        tap(([_, searchString]) => {
          if (searchString) {
            this.store$.dispatch(experimentAction.actionGetExperiments({ fromStarting: true }));
          }
        })
      ),
    { dispatch: false }
  );

  fetchContextMetaData$ = createEffect(() =>
    this.actions$.pipe(
      ofType(experimentAction.actionFetchContextMetaData),
      withLatestFrom(this.store$.pipe(select(selectContextMetaData))),
      filter(([, contextMetaData]) => {
        // check if contextmetadata is already fetched. cancel if so.
        const metaDataExists = Object.keys(contextMetaData.contextMetadata).length;
        if (metaDataExists) {
          this.store$.dispatch(experimentAction.actionSetIsLoadingContextMetaData({ isLoadingContextMetaData: false }));
        }
        return !metaDataExists;
      }),
      switchMap(() =>
        this.experimentDataService.fetchContextMetaData().pipe(
          map((contextMetaData: IContextMetaData) =>
            experimentAction.actionFetchContextMetaDataSuccess({ contextMetaData, isLoadingContextMetaData: false })
          ),
          catchError(() => [experimentAction.actionFetchContextMetaDataFailure({ isLoadingContextMetaData: false })])
        )
      )
    )
  );

  exportExperimentInfo$ = createEffect(() =>
    this.actions$.pipe(
      ofType(experimentAction.actionExportExperimentInfo),
      map((action) => ({ experimentId: action.experimentId, experimentName: action.experimentName })),
      withLatestFrom(this.store$.pipe(select(selectCurrentUser))),
      filter(([{ experimentId }, { email }]) => !!experimentId && !!email),
      switchMap(([{ experimentId }, { email }]) =>
        this.experimentDataService.exportExperimentInfo(experimentId, email).pipe(
          map(() => experimentAction.actionExportExperimentInfoSuccess()),
          catchError(() => [experimentAction.actionExportExperimentInfoFailure()])
        )
      )
    )
  );

  importExperiment$ = createEffect(() =>
    this.actions$.pipe(
      ofType(experimentAction.actionImportExperiment),
      map((action) => ({ experiments: action.experiments })),
      filter(({ experiments }) => !!experiments),
      switchMap(({ experiments }) =>
        this.experimentDataService.importExperiment(experiments).pipe(
          switchMap((data: Experiment[]) => {
            const experimentIds = data.map((exp) => exp.id);
            return [
              experimentAction.actionImportExperimentSuccess(),
              experimentAction.actionGetExperimentsSuccess({ experiments: data, totalExperiments: data.length }),
              experimentAction.actionFetchExperimentStats({ experimentIds }),
            ];
          }),
          catchError(() => [experimentAction.actionImportExperimentFailure()])
        )
      )
    )
  );

  exportExperimentDesign$ = createEffect(() =>
    this.actions$.pipe(
      ofType(experimentAction.actionExportExperimentDesign),
      map((action) => ({ experimentIds: action.experimentIds })),
      filter(({ experimentIds }) => !!experimentIds),
      switchMap(({ experimentIds }) =>
        this.experimentDataService.exportExperimentDesign(experimentIds).pipe(
          map((data: Experiment[]) => {
            if (data.length > 1) {
              const zip = new JSZip();
              data.forEach((experiment, index) => {
                zip.file(experiment.name + ' (File ' + (index + 1) + ').json', JSON.stringify(experiment));
              });
              zip.generateAsync({ type: 'base64' }).then((content) => {
                this.download('Experiments.zip', content, true);
              });
            } else {
              this.download(data[0].name + '.json', data[0], false);
            }
            return experimentAction.actionExportExperimentDesignSuccess();
          }),
          catchError(() => [experimentAction.actionExportExperimentDesignFailure()])
        )
      )
    )
  );

  private download(filename, text, isZip: boolean) {
    const element = document.createElement('a');
    isZip
      ? element.setAttribute('href', 'data:application/zip;base64,' + text)
      : element.setAttribute('href', 'data:text/plain;charset=utf-8,' + JSON.stringify(text));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }
  private getSearchString$ = () => this.store$.pipe(select(selectSearchString)).pipe(first());
}
