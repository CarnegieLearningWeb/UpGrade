import { Injectable } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { AppState } from '../core.module';
import * as logsActions from './store/logs.actions';
import {
  selectIsAuditLogLoading,
  selectAllAuditLogs,
  selectIsErrorLogLoading,
  selectAllErrorLogs,
  selectSkipAuditLog,
  selectTotalAuditLogs,
  selectTotalErrorLogs,
  selectSkipErrorLog,
} from './store/logs.selectors';
import { combineLatest } from 'rxjs';
import { selectAllExperiment } from '../experiments/store/experiments.selectors';
import { map } from 'rxjs/operators';
import { AuditLogs, SERVER_ERROR, EXPERIMENT_LOG_TYPE } from './store/logs.model';

@Injectable()
export class LogsService {
  constructor(private store$: Store<AppState>) {}

  isAuditLogLoading$ = this.store$.pipe(select(selectIsAuditLogLoading));
  isErrorLogLoading$ = this.store$.pipe(select(selectIsErrorLogLoading));
  getAllErrorLogs$ = this.store$.pipe(select(selectAllErrorLogs));

  getAuditLogs() {
    return combineLatest([
      this.store$.pipe(select(selectAllAuditLogs)),
      this.store$.pipe(select(selectAllExperiment)),
    ]).pipe(
      map(([auditLogs, experiments]) =>
        auditLogs.map((log: AuditLogs) => {
          const clonedLog = { ...log };
          if (log.data.experimentId) {
            const result = experiments.find((experiment) => experiment.id === log.data.experimentId);
            clonedLog.data = result
              ? {
                  ...log.data,
                  isExperimentExist: true,
                }
              : { ...log.data, isExperimentExist: false };
          } else {
            clonedLog.data = { ...log.data, isExperimentExist: false };
          }
          return clonedLog;
        })
      )
    );
  }

  isAllAuditLogsFetched() {
    return combineLatest([
      this.store$.pipe(select(selectSkipAuditLog)),
      this.store$.pipe(select(selectTotalAuditLogs)),
    ]).pipe(map(([skipAuditLogs, totalAuditLogs]) => skipAuditLogs === totalAuditLogs));
  }

  isAllErrorLogsFetched() {
    return combineLatest([
      this.store$.pipe(select(selectSkipErrorLog)),
      this.store$.pipe(select(selectTotalErrorLogs)),
    ]).pipe(map(([skipErrorLogs, totalErrorLogs]) => skipErrorLogs === totalErrorLogs));
  }

  fetchAuditLogs(fromStart?: boolean) {
    this.store$.dispatch(logsActions.actionGetAuditLogs({ fromStart }));
  }

  fetchErrorLogs(fromStart?: boolean) {
    this.store$.dispatch(logsActions.actionGetErrorLogs({ fromStart }));
  }

  setAuditLogFilter(filterType: EXPERIMENT_LOG_TYPE) {
    this.store$.dispatch(logsActions.actionSetAuditLogFilter({ filterType }));
  }

  setErrorLogFilter(filterType: SERVER_ERROR) {
    this.store$.dispatch(logsActions.actionSetErrorLogFilter({ filterType }));
  }
}
