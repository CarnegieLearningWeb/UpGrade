import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from '../core.module';
import * as auditActions from './store/audit.actions';

@Injectable()
export class AuditService {

  constructor(private store$: Store<AppState>) {}

  loadAudits() {
    return this.store$.dispatch(auditActions.actionGetAllAudit());
  }
}
