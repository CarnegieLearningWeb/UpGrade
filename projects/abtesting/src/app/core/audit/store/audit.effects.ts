import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { AuditDataService } from '../audit.data.service';
import * as auditActions from './audit.actions';
import { mergeMap, map, catchError } from 'rxjs/operators';

@Injectable()
export class AuditEffects {
  constructor(
    private actions$: Actions,
    private auditDataService: AuditDataService
  ) {}

  getAllAudits$ = createEffect(() =>
    this.actions$.pipe(
      ofType(auditActions.actionGetAllAudit),
      mergeMap(() =>
        this.auditDataService.getAllAudits().pipe(
          map((data: any) =>
            auditActions.actionStoreAudits({
              audits: data.nodes
            })
          ),
          catchError(() => [auditActions.actionGetAllAuditFailure()])
        )
      )
    )
  );
}
