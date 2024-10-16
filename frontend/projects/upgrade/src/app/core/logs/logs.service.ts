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
import { AuditLogs } from './store/logs.model';
import { SERVER_ERROR, LOG_TYPE } from 'upgrade_types';
import { selectAllFeatureFlags } from '../feature-flags/store/feature-flags.selectors';

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
      this.store$.pipe(select(selectAllFeatureFlags)),
    ]).pipe(
      map(([auditLogs, experiments, featureFlags]) =>
        auditLogs.map((log: AuditLogs) => {
          const clonedLog = { ...log };

          if (log.data.experimentId && this.isExperimentType(log.type)) {
            const result = experiments.find((experiment) => experiment.id === log.data.experimentId);
            clonedLog.data = result
              ? {
                  ...log.data,
                  isExperimentExist: true,
                }
              : { ...log.data, isExperimentExist: false };
          } else if (!log.data.experimentId || this.isExperimentLogTypeWithoutId(log.type)) {
            clonedLog.data = { ...log.data, isExperimentExist: false };
          }

          if (log.data.flagId && this.isFeatureFlagType(log.type)) {
            const result = featureFlags.find((featureFlag) => featureFlag.id === log.data.flagId);
            clonedLog.data = result
              ? {
                  ...log.data,
                  isFlagExist: true,
                }
              : { ...log.data, isFlagExist: false };
          } else if (!log.data.flagId && this.isFeatureFlagLogTypeWithoutId(log.type)) {
            clonedLog.data = { ...log.data, isFlagExist: false };
          }

          return clonedLog;
        })
      )
    );
  }

  isExperimentType = (type: LOG_TYPE) =>
    [LOG_TYPE.EXPERIMENT_CREATED, LOG_TYPE.EXPERIMENT_UPDATED, LOG_TYPE.EXPERIMENT_STATE_CHANGED].includes(type);

  isExperimentLogTypeWithoutId = (type: LOG_TYPE) =>
    [LOG_TYPE.EXPERIMENT_DELETED, LOG_TYPE.EXPERIMENT_DATA_EXPORTED, LOG_TYPE.EXPERIMENT_DESIGN_EXPORTED].includes(
      type
    );

  isFeatureFlagType = (type: LOG_TYPE) =>
    [LOG_TYPE.FEATURE_FLAG_CREATED, LOG_TYPE.FEATURE_FLAG_UPDATED, LOG_TYPE.FEATURE_FLAG_STATUS_CHANGED].includes(type);

  isFeatureFlagLogTypeWithoutId = (type: LOG_TYPE) =>
    [
      LOG_TYPE.FEATURE_FLAG_DELETED,
      LOG_TYPE.FEATURE_FLAG_DATA_EXPORTED,
      LOG_TYPE.FEATURE_FLAG_DESIGN_EXPORTED,
    ].includes(type);

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

  setAuditLogFilter(filterType: LOG_TYPE) {
    this.store$.dispatch(logsActions.actionSetAuditLogFilter({ filterType }));
  }

  setErrorLogFilter(filterType: SERVER_ERROR) {
    this.store$.dispatch(logsActions.actionSetErrorLogFilter({ filterType }));
  }
}
