import { createSelector, createFeatureSelector } from '@ngrx/store';
import { State, LogState, EXPERIMENT_LOG_TYPE, AuditLogs, ErrorLogs, SERVER_ERROR } from './logs.model';
import { selectAll } from './logs.reducer';

export const selectLogState = createFeatureSelector<State, LogState>(
  'logs'
);

export const selectAllLogs = createSelector(selectLogState, selectAll);

export const selectIsAuditLogLoading = createSelector(
  selectLogState,
  state => state.isAuditLogLoading
);

export const selectIsErrorLogLoading = createSelector(
  selectLogState,
  state => state.isErrorLogLoading
);

export const selectAllAuditLogs = createSelector(
  selectAllLogs,
  (logs) => logs.filter((log: AuditLogs | ErrorLogs) => (Object.values(EXPERIMENT_LOG_TYPE).includes((log as any ).type)))
);

export const selectAllErrorLogs = createSelector(
  selectAllLogs,
  (logs) => logs.filter((log: AuditLogs | ErrorLogs) => (Object.values(SERVER_ERROR).includes((log as any ).type)))
);
