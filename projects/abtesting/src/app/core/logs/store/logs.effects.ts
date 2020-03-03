import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { LogsDataService } from '../logs.data.service';
import * as logsActions from './logs.actions';
import { mergeMap, map, catchError, withLatestFrom, filter, tap } from 'rxjs/operators';
import { Store, select } from '@ngrx/store';
import { AppState } from '../../core.state';
import { selectIsAuditLogLoading, selectTotalAuditLogs, selectTotalErrorLogs, selectIsErrorLogLoading, selectSkipAuditLog, selectSkipErrorLog, selectAllAuditLogs, selectAllErrorLogs } from './logs.selectors';
import * as pullallby from 'lodash.pullallby';

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
        this.store$.pipe(select(selectIsAuditLogLoading)),
        this.store$.pipe(select(selectTotalAuditLogs))
      ),
      filter(([fromStart, _, skipAuditLog, isAuditLogLoading, totalAuditLogs]) => {
        return !isAuditLogLoading && (skipAuditLog < totalAuditLogs || totalAuditLogs === null || fromStart);
      }),
      tap(() => {
        this.store$.dispatch(logsActions.actionSetIsAuditLogLoading({ isAuditLogLoading: true }));
      }),
      mergeMap(([fromStart, allAuditLogs, skipAuditLog]) =>
        this.logsDataService.getAllAuditLogs(skipAuditLog, fromStart).pipe(
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
        this.store$.pipe(select(selectIsErrorLogLoading)),
        this.store$.pipe(select(selectTotalErrorLogs))
      ),
      filter(([fromStart, _, skipErrorLog, isErrorLogLoading, totalErrorLogs]) => {
        return !isErrorLogLoading && (skipErrorLog < totalErrorLogs || totalErrorLogs === null || fromStart);
      }),
      tap(() => {
        this.store$.dispatch(logsActions.actionSetIsErrorLogLoading({ isErrorLogLoading: true }));
      }),
      mergeMap(([fromStart, allErrorLogs, skipErrorLog]) =>
        this.logsDataService.getAllErrorLogs(skipErrorLog, fromStart).pipe(
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
}
