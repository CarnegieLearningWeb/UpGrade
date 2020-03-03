import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { LogsDataService } from '../logs.data.service';
import * as logsActions from './logs.actions';
import { mergeMap, map, catchError, withLatestFrom, filter, tap, switchMap } from 'rxjs/operators';
import { Store, select } from '@ngrx/store';
import { AppState } from '../../core.state';
import * as pullallby from 'lodash.pullallby';
import {
  selectAllErrorLogs,
  selectIsAuditLogLoading,
  selectTotalAuditLogs,
  selectTotalErrorLogs,
  selectIsErrorLogLoading,
  selectSkipAuditLog,
  selectSkipErrorLog,
  selectAllAuditLogs,
  selectAuditFilterType,
  selectErrorFilterType
} from './logs.selectors';
import { AuditLogFilters, ErrorLogFilters } from './logs.model';

@Injectable()
export class LogsEffects {
  constructor(
    private actions$: Actions,
    private logsDataService: LogsDataService,
    private store$: Store<AppState>
  ) {}

  getAllAuditLogs$ = createEffect(() =>
    this.actions$.pipe(
      ofType(logsActions.actionGetAuditLogs),
      map(action => action.fromStart),
      withLatestFrom(
        this.store$.pipe(select(selectAllAuditLogs)),
        this.store$.pipe(select(selectSkipAuditLog)),
        this.store$.pipe(select(selectAuditFilterType)),
        this.store$.pipe(select(selectIsAuditLogLoading)),
        this.store$.pipe(select(selectTotalAuditLogs)),
      ),
      filter(([fromStart, _, skipAuditLog, __, isAuditLogLoading, totalAuditLogs]) => {
        return !isAuditLogLoading && (skipAuditLog < totalAuditLogs || totalAuditLogs === null || fromStart);
      }),
      tap(() => {
        this.store$.dispatch(logsActions.actionSetIsAuditLogLoading({ isAuditLogLoading: true }));
      }),
      mergeMap(([fromStart, allAuditLogs, skipAuditLog, filterType]) =>
        this.logsDataService.getAllAuditLogs(skipAuditLog, fromStart, filterType).pipe(
          map((data: any) => {
            const logs = pullallby(data.nodes, Object.values(allAuditLogs), 'id');
            return logsActions.actionGetAuditLogsSuccess({
              auditLogs: logs,
              totalAuditLogs: data.total
            })
          }),
          catchError(() => [logsActions.actionGetAuditLogsFailure()])
        )
      )
    )
  );

  getAllErrorLogs$ = createEffect(() =>
    this.actions$.pipe(
      ofType(logsActions.actionGetErrorLogs),
      map(action => action.fromStart),
      withLatestFrom(
        this.store$.pipe(select(selectAllErrorLogs)),
        this.store$.pipe(select(selectSkipErrorLog)),
        this.store$.pipe(select(selectErrorFilterType)),
        this.store$.pipe(select(selectIsErrorLogLoading)),
        this.store$.pipe(select(selectTotalErrorLogs))
      ),
      filter(([fromStart, _, skipErrorLog, __, isErrorLogLoading, totalErrorLogs]) => {
        return !isErrorLogLoading && (skipErrorLog < totalErrorLogs || totalErrorLogs === null || fromStart);
      }),
      tap(() => {
        this.store$.dispatch(logsActions.actionSetIsErrorLogLoading({ isErrorLogLoading: true }));
      }),
      mergeMap(([fromStart, allErrorLogs, skipErrorLog, filterType]) =>
        this.logsDataService.getAllErrorLogs(skipErrorLog, fromStart, filterType).pipe(
          map((data: any) => {
            const logs = pullallby(data.nodes, Object.values(allErrorLogs), 'id');
            return logsActions.actionGetErrorLogsSuccess({
              errorLogs: logs,
              totalErrorLogs: data.total
            })
          }
          ),
          catchError(() => [logsActions.actionGetErrorLogsFailure()])
        )
      )
    )
  );

  changeAuditFilter$ = createEffect(() =>
    this.actions$.pipe(
      ofType(logsActions.actionSetAuditLogFilter),
      map(action => action.filterType),
      withLatestFrom(
        this.store$.pipe(select(selectAllAuditLogs))
      ),
      switchMap(([filterType, allLogs]) => {
        const filteredLogs = filterType === AuditLogFilters.ALL ? allLogs : allLogs.filter((log: any) => log.type === filterType);
        return [
          logsActions.actionSetSkipAuditLog({ skipAuditLog: filteredLogs.length }),
          logsActions.actionGetAuditLogs({})
        ];
      })
    )
  );

  changeErrorFilter$ = createEffect(() =>
    this.actions$.pipe(
      ofType(logsActions.actionSetErrorLogFilter),
      map(action => action.filterType),
      withLatestFrom(
        this.store$.pipe(select(selectAllErrorLogs))
      ),
      switchMap(([filterType, allLogs]) => {
        const filteredLogs = filterType === ErrorLogFilters.ALL ? allLogs : allLogs.filter((log: any) => log.type === filterType);
        return [
          logsActions.actionSetSkipErrorLog({ skipErrorLog: filteredLogs.length }),
          logsActions.actionGetErrorLogs({})
        ];
      })
    )
  );
}
