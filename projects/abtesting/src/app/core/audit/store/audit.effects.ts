import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { AuditDataService } from '../audit.data.service';
import * as auditActions from './audit.actions';
import { mergeMap, map, filter, withLatestFrom } from 'rxjs/operators';
import { AppState } from '../../core.module';
import { Store, select } from '@ngrx/store';
import { selectCurrentUser } from '../../auth/store/auth.selectors';

@Injectable()
export class AuditEffects {
  constructor(
    private actions$: Actions,
    private auditDataService: AuditDataService,
    private store$: Store<AppState>
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
          )
        )
      )
    )
  );
}
