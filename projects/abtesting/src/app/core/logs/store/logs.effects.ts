import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { LogsDataService } from '../logs.data.service';
import * as logsActions from './logs.actions';
import { mergeMap, map, catchError } from 'rxjs/operators';

@Injectable()
export class LogsEffects {
  constructor(private actions$: Actions, private logsDataService: LogsDataService) {}

  getAllAudits$ = createEffect(() =>
    this.actions$.pipe(
      ofType(logsActions.actionGetAllAudit),
      mergeMap(() =>
        this.logsDataService.getAllAudits().pipe(
          map((data: any) =>
            logsActions.actionStoreAudits({
              audits: data.nodes
            })
          ),
          catchError(() => [logsActions.actionGetAllAuditFailure()])
        )
      )
    )
  );
}
