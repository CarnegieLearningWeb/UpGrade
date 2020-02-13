import { Injectable } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { AppState } from '../core.module';
import * as logsActions from './store/logs.actions';
import { selectAllAudit, selectIsAuditLoading } from './store/logs.selectors';
import { combineLatest } from 'rxjs';
import { selectAllExperiment } from '../experiments/store/experiments.selectors';
import { map } from 'rxjs/operators';

@Injectable()
export class LogsService {
  constructor(private store$: Store<AppState>) {}

  isAuditLoading$ = this.store$.pipe(select(selectIsAuditLoading));
  loadAudits() {
    return this.store$.dispatch(logsActions.actionGetAllAudit());
  }

  getAuditLogs() {
    return combineLatest(this.store$.pipe(select(selectAllAudit)), this.store$.pipe(select(selectAllExperiment))).pipe(
      map(([auditLogs, experiments]) =>
        auditLogs.map(log => {
          if (log.data.experimentId) {
            const result = experiments.find(experiment => experiment.id === log.data.experimentId);
            log.data = result
              ? {
                  ...log.data,
                  isExperimentExist: true
                }
              : { ...log.data, isExperimentExist: false };
          } else {
            log.data = { ...log.data, isExperimentExist: false };
          }
          return log;
        })
      )
    );
  }
}
