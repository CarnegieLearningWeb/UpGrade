import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as experimentAction from './experiments.actions';
import { ExperimentDataService } from '../experiments.data.service';
import { map, filter, switchMap, catchError, tap, withLatestFrom, first, mergeMap } from 'rxjs/operators';
import {
  UpsertExperimentType,
  IExperimentEnrollmentStats,
  Experiment,
  NUMBER_OF_EXPERIMENTS,
  ExperimentPaginationParams,
  ExperimentGraphDateFilterOptions
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
  selectExperimentGraphInfo
} from './experiments.selectors';
import { combineLatest } from 'rxjs';
import { saveAs } from 'file-saver';
import { subDays, subMonths, addDays, startOfMonth } from 'date-fns';

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
      ofType(experimentAction.actionGetExperiments),
      map(action => action.fromStarting),
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
        this.getSearchString$().subscribe(searchInput => {
          searchString = searchInput;
        });
        let params: ExperimentPaginationParams = {
          skip: fromStarting ? 0 : skip,
          take: NUMBER_OF_EXPERIMENTS
        };
        if (sortKey) {
          params = {
            ...params,
            sortParams: {
              key: sortKey,
              sortAs
            }
          };
        }
        if (searchString) {
          params = {
            ...params,
            searchParams: {
              key: searchKey,
              string: searchString
            }
          };
        }
        return this.experimentDataService.getAllExperiment(params).pipe(
          switchMap((data: any) => {
            const experiments = data.nodes;
            const experimentIds = experiments.map(experiment => experiment.id);
            return this.experimentDataService.getAllExperimentsStats(experimentIds).pipe(
              switchMap((stats: any) => {
                const experimentStats = stats.reduce(
                  (acc, stat: IExperimentEnrollmentStats) => ({ ...acc, [stat.id]: stat }),
                  {}
                );

                const actions = fromStarting ? [experimentAction.actionSetSkipExperiment({ skipExperiment: 0 })] : [];
                return [
                  ...actions,
                  experimentAction.actionGetExperimentsSuccess({ experiments, totalExperiments: data.total }),
                  experimentAction.actionStoreExperimentStats({ stats: experimentStats })
                ];
              }),
              catchError(error => [experimentAction.actionGetExperimentsFailure(error)])
            );
          }),
          catchError(error => [experimentAction.actionGetExperimentsFailure(error)])
        );
      })
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
                  experimentAction.actionFetchAllPartitions()
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
          switchMap(_ => [
            experimentAction.actionDeleteExperimentSuccess({ experimentId }),
            experimentAction.actionFetchAllPartitions()
          ]),
          catchError(() => [experimentAction.actionDeleteExperimentFailure()])
        );
      })
    )
  );

  getExperimentById$ = createEffect(() =>
    this.actions$.pipe(
      ofType(experimentAction.actionGetExperimentById),
      map(action => action.experimentId),
      filter(experimentId => !!experimentId),
      withLatestFrom(this.store$.pipe(select(selectExperimentStats))),
      mergeMap(([experimentId, experimentStats]) =>
        this.experimentDataService.getExperimentById(experimentId).pipe(
          switchMap((data: Experiment) =>
            this.experimentDataService.getAllExperimentsStats([data.id]).pipe(
              switchMap((stat: IExperimentEnrollmentStats) => {
                const stats = { ...experimentStats, [data.id]: stat[0] };
                return [
                  experimentAction.actionGetExperimentByIdSuccess({ experiment: data }),
                  experimentAction.actionStoreExperimentStats({ stats })
                ];
              })
            )
          )
        )
      )
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

  fetchAllExperimentNames$ = createEffect(() =>
    this.actions$.pipe(
      ofType(experimentAction.actionFetchAllExperimentNames),
      switchMap(() =>
        this.experimentDataService.fetchAllExperimentNames().pipe(
          map(
            (data: any) => experimentAction.actionFetchAllExperimentNamesSuccess({ allExperimentNames: data }),
            catchError(() => [experimentAction.actionFetchAllExperimentNamesFailure()])
          )
        )
      )
    )
  );

  fetchGraphInfo$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(experimentAction.actionFetchExperimentGraphInfo),
        map(action => ({ experimentId: action.experimentId, range: action.range})),
        filter(({ experimentId, range }) => !!experimentId && !!range),
        withLatestFrom(
          this.store$.pipe(select(selectExperimentGraphInfo))
        ),
        mergeMap(([{ experimentId, range }, graphData]) => {
          if (!graphData) {
            // TODO: Update todate after updating backend
            let params: any = {
              experimentId,
              toDate: addDays(new Date(), 1).toISOString()
            };
            const startDateOfCurrentMonth = startOfMonth(new Date());
            let fromDate;
            switch (range) {
              case ExperimentGraphDateFilterOptions.LAST_7_DAYS:
                fromDate = subDays(new Date(), 7);
                break;
              case ExperimentGraphDateFilterOptions.LAST_3_MONTHS:
                fromDate = subMonths(startDateOfCurrentMonth, 2); // Subtract current Month so 3 - 1 = 2
                break;
              case ExperimentGraphDateFilterOptions.LAST_6_MONTHS:
                fromDate = subMonths(startDateOfCurrentMonth, 5);
                break;
              case ExperimentGraphDateFilterOptions.LAST_12_MONTHS:
                fromDate = subMonths(startDateOfCurrentMonth, 11);
                break;
            }
            params = {
              ...params,
              fromDate: fromDate.toISOString()
            }
            return this.experimentDataService.fetchExperimentGraphInfo(params).pipe(
              map((data: any) => {
                return experimentAction.actionFetchExperimentGraphInfoSuccess({ range, graphInfo: data })
              }),
              catchError(() => [experimentAction.actionFetchExperimentGraphInfoFailure()])
            )
          }
          return [];
        })
      )
  );

  setExperimentGraphRange$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(experimentAction.actionSetGraphRange),
        map(action => ({ experimentId: action.experimentId, range: action.range })),
        filter(({ experimentId }) => !!experimentId),
        tap(({ experimentId, range }) => {
          if (range) {
            this.store$.dispatch(experimentAction.actionFetchExperimentGraphInfo({ experimentId, range }));
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
        map(action => action.experimentId),
        filter(experimentStatId => !!experimentStatId),
        tap(experimentStatId => {
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
        map(action => action.searchString),
        tap(searchString => {
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

  fetchExperimentContext$ = createEffect(() =>
    this.actions$.pipe(
      ofType(experimentAction.actionFetchExperimentContext),
      switchMap(() =>
        this.experimentDataService.fetchExperimentContext().pipe(
          map((context: string[]) => experimentAction.actionFetchExperimentContextSuccess({ context })),
          catchError(() => [experimentAction.actionFetchExperimentContextFailure()])
        )
      )
    )
  );

  exportExperimentInfo$ = createEffect(() =>
    this.actions$.pipe(
      ofType(experimentAction.actionExportExperimentInfo),
      map(action => ({ experimentId: action.experimentId, experimentName: action.experimentName })),
      filter(({ experimentId }) => !!experimentId),
      switchMap(({ experimentId, experimentName }) =>
        this.experimentDataService.exportExperimentInfo(experimentId).pipe(
          map((data: any) => {
            const BOM = '\uFEFF';
            const csvData = BOM + data;
            const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8' });
            saveAs(blob, `${experimentName}.csv`);
            return experimentAction.actionExportExperimentInfoSuccess();
          }),
          catchError(() => [experimentAction.actionExportExperimentInfoFailure()])
        )
      )
    )
  );

  private getSearchString$ = () =>
    combineLatest(this.store$.pipe(select(selectSearchString))).pipe(
      map(([searchString]) => searchString),
      first()
    );
}
