import { createSelector, createFeatureSelector } from '@ngrx/store';
import { State, LogState, EXPERIMENT_LOG_TYPE, AuditLogs, ErrorLogs, SERVER_ERROR } from './logs.model';
import { selectAll } from './logs.reducer';

export const selectLogState = createFeatureSelector<LogState>('logs');

export const selectAllLogs = createSelector(selectLogState, selectAll);

export const selectIsAuditLogLoading = createSelector(selectLogState, (state) => state.isAuditLogLoading);

export const selectIsErrorLogLoading = createSelector(selectLogState, (state) => state.isErrorLogLoading);

export const selectAllAuditLogs = createSelector(selectLogState, selectAllLogs, (state, logs) =>
  logs.filter(
    (log: AuditLogs | ErrorLogs) =>
      Object.values(EXPERIMENT_LOG_TYPE).includes((log as any).type) &&
      ((log.type as any) === state.auditLogFilter || state.auditLogFilter === null)
  )
);

export const selectAllErrorLogs = createSelector(selectLogState, selectAllLogs, (state, logs) =>
  logs.filter(
    (log: AuditLogs | ErrorLogs) =>
      Object.values(SERVER_ERROR).includes((log as any).type) &&
      ((log.type as any) === state.errorLogFilter || state.errorLogFilter === null)
  )
);

export const selectSkipAuditLog = createSelector(selectLogState, (state) => state.skipAuditLog);

export const selectTotalAuditLogs = createSelector(selectLogState, (state) => state.totalAuditLogs);

export const selectSkipErrorLog = createSelector(selectLogState, (state) => state.skipErrorLog);

export const selectTotalErrorLogs = createSelector(selectLogState, (state) => state.totalErrorLogs);

export const selectAuditFilterType = createSelector(selectLogState, (state) => state.auditLogFilter);

export const selectErrorFilterType = createSelector(selectLogState, (state) => state.errorLogFilter);
