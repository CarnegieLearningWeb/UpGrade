import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { LogsDataService } from '../logs.data.service';
import * as logsActions from './logs.actions';
import { mergeMap, map, catchError, withLatestFrom, filter, tap } from 'rxjs/operators';
import { Store, select } from '@ngrx/store';
import { AppState } from '../../core.state';
import {
  selectIsAuditLogLoading,
  selectTotalAuditLogs,
  selectTotalErrorLogs,
  selectIsErrorLogLoading,
  selectSkipAuditLog,
  selectSkipErrorLog,
  selectAuditFilterType,
  selectErrorFilterType,
} from './logs.selectors';
import { NUMBER_OF_LOGS, AuditLogParams, ErrorLogParams } from './logs.model';

@Injectable()
export class LogsEffects {
  constructor(private actions$: Actions, private logsDataService: LogsDataService, private store$: Store<AppState>) {}

  getAllAuditLogs$ = createEffect(() =>
    this.actions$.pipe(
      ofType(logsActions.actionGetAuditLogs),
      map((action) => action.fromStart),
      withLatestFrom(
        this.store$.pipe(select(selectSkipAuditLog)),
        this.store$.pipe(select(selectAuditFilterType)),
        this.store$.pipe(select(selectIsAuditLogLoading)),
        this.store$.pipe(select(selectTotalAuditLogs))
      ),
      filter(
        ([fromStart, skipAuditLog, __, isAuditLogLoading, totalAuditLogs]) =>
          !isAuditLogLoading && (skipAuditLog < totalAuditLogs || totalAuditLogs === null || fromStart)
      ),
      tap(([fromStart]) => {
        this.store$.dispatch(logsActions.actionSetIsAuditLogLoading({ isAuditLogLoading: true }));
        if (fromStart) {
          this.store$.dispatch(logsActions.actionSetSkipAuditLog({ skipAuditLog: 0 }));
        }
      }),
      mergeMap(([fromStart, skipAuditLog, filterType]) => {
        let params: AuditLogParams = { skip: fromStart ? 0 : skipAuditLog, take: NUMBER_OF_LOGS };
        if (filterType) {
          params = {
            ...params,
            filter: filterType,
          };
        }
        return this.logsDataService.getAllAuditLogs(params).pipe(
          map((data: any) =>
            logsActions.actionGetAuditLogsSuccess({
              auditLogs: data.nodes,
              totalAuditLogs: data.total,
            })
          ),
          catchError(() => [logsActions.actionGetAuditLogsFailure()])
        );
      })
    )
  );

  getAllErrorLogs$ = createEffect(() =>
    this.actions$.pipe(
      ofType(logsActions.actionGetErrorLogs),
      map((action) => action.fromStart),
      withLatestFrom(
        this.store$.pipe(select(selectSkipErrorLog)),
        this.store$.pipe(select(selectErrorFilterType)),
        this.store$.pipe(select(selectIsErrorLogLoading)),
        this.store$.pipe(select(selectTotalErrorLogs))
      ),
      filter(
        ([fromStart, skipErrorLog, __, isErrorLogLoading, totalErrorLogs]) =>
          !isErrorLogLoading && (skipErrorLog < totalErrorLogs || totalErrorLogs === null || fromStart)
      ),
      tap(([fromStart]) => {
        this.store$.dispatch(logsActions.actionSetIsErrorLogLoading({ isErrorLogLoading: true }));
        if (fromStart) {
          this.store$.dispatch(logsActions.actionSetSkipErrorLog({ skipErrorLog: 0 }));
        }
      }),
      mergeMap(([fromStart, skipErrorLog, filterType]) => {
        let params: ErrorLogParams = { skip: fromStart ? 0 : skipErrorLog, take: NUMBER_OF_LOGS };
        if (filterType) {
          params = {
            ...params,
            filter: filterType,
          };
        }
        return this.logsDataService.getAllErrorLogs(params).pipe(
          map((data: any) =>
            logsActions.actionGetErrorLogsSuccess({
              errorLogs: data.nodes,
              totalErrorLogs: data.total,
            })
          ),
          catchError(() => [logsActions.actionGetErrorLogsFailure()])
        );
      })
    )
  );

  changeAuditFilter$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(logsActions.actionSetAuditLogFilter),
        map((action) => action.filterType),
        tap(() => {
          this.store$.dispatch(logsActions.actionGetAuditLogs({ fromStart: true }));
        })
      ),
    { dispatch: false }
  );

  changeErrorFilter$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(logsActions.actionSetErrorLogFilter),
        map((action) => action.filterType),
        tap(() => {
          this.store$.dispatch(logsActions.actionGetErrorLogs({ fromStart: true }));
        })
      ),
    { dispatch: false }
  );
}
