import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { LogsDataService } from '../logs.data.service';
import * as logsActions from './logs.actions';
import { mergeMap, map, catchError } from 'rxjs/operators';

@Injectable()
export class LogsEffects {
  constructor(private actions$: Actions, private logsDataService: LogsDataService) {}

  getAllAuditLogs$ = createEffect(() =>
    this.actions$.pipe(
      ofType(logsActions.actionGetAllAuditLogs),
      mergeMap(() =>
        this.logsDataService.getAllAuditLogs().pipe(
          map((data: any) =>
            logsActions.actionGetAllAuditLogsSuccess({
              auditLogs: data.nodes
            })
          ),
          catchError(() => [logsActions.actionGetAllAuditLogsFailure()])
        )
      )
    )
  );

  getAllErrorLogs$ = createEffect(() =>
    this.actions$.pipe(
      ofType(logsActions.actionGetAllErrorLogs),
      mergeMap(() =>
        this.logsDataService.getAllErrorLogs().pipe(
          map((data: any) =>
            logsActions.actionGetAllErrorLogsSuccess({
              errorLogs: data.nodes
            })
          ),
          catchError(() => [logsActions.actionGetAllErrorLogsFailure()])
        )
      )
    )
  );
}
