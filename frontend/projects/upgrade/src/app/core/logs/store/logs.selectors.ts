import { createSelector, createFeatureSelector } from '@ngrx/store';
import { LogState, AuditLogs, ErrorLogs } from './logs.model';
import { SERVER_ERROR, LOG_TYPE } from 'upgrade_types';
import { selectAll } from './logs.reducer';

export const selectLogState = createFeatureSelector<LogState>('logs');

export const selectAllLogs = createSelector(selectLogState, selectAll);

export const selectIsAuditLogLoading = createSelector(selectLogState, (state) => state.isAuditLogLoading);

export const selectIsErrorLogLoading = createSelector(selectLogState, (state) => state.isErrorLogLoading);

export const selectAllAuditLogs = createSelector(selectLogState, selectAllLogs, (state, logs) =>
  logs.filter(
    (log: AuditLogs | ErrorLogs) =>
      Object.values(LOG_TYPE).includes((log as any).type) &&
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

// Experiment-specific log selectors
export const selectExperimentLogsState = createSelector(selectLogState, (state) => state.experimentLogs);

export const selectExperimentLogsMetadata = createSelector(
  selectExperimentLogsState,
  (experimentLogs: Record<string, any>, props: { experimentId: string }) => experimentLogs[props.experimentId] || null
);

export const selectExperimentLogs = createSelector(selectExperimentLogsMetadata, (metadata) => metadata?.logs || []);

export const selectExperimentLogsFiltered = createSelector(selectExperimentLogsMetadata, (metadata) => {
  if (!metadata) return [];
  const { logs, filter } = metadata;
  if (!filter) return logs;
  return logs.filter((log) => log.type === filter);
});

export const selectIsExperimentLogsLoading = createSelector(
  selectExperimentLogsMetadata,
  (metadata) => metadata?.isLoading || false
);

export const selectExperimentLogsTotal = createSelector(
  selectExperimentLogsMetadata,
  (metadata) => metadata?.total || 0
);

export const selectExperimentLogsSkip = createSelector(selectExperimentLogsMetadata, (metadata) => metadata?.skip || 0);

export const selectIsAllExperimentLogsFetched = createSelector(selectExperimentLogsMetadata, (metadata) => {
  if (!metadata || metadata.total === null) return false;
  return metadata.skip >= metadata.total;
});
