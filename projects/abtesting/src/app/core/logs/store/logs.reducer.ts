import { createReducer, on, Action } from '@ngrx/store';
import { createEntityAdapter, EntityAdapter } from '@ngrx/entity';
import { AuditLogs, LogState, ErrorLogs, AuditLogFilters, ErrorLogFilters } from './logs.model';
import * as logsActions from './logs.actions';

export const adapter: EntityAdapter<AuditLogs | ErrorLogs> = createEntityAdapter<AuditLogs | ErrorLogs>();

export const { selectIds, selectEntities, selectAll, selectTotal } = adapter.getSelectors();

export const initialState: LogState = adapter.getInitialState({
  isAuditLogLoading: false,
  isErrorLogLoading: false,
  skipAuditLog: 0,
  totalAuditLogs: null,
  skipErrorLog: 0,
  totalErrorLogs: null,
  auditLogFilter: AuditLogFilters.ALL,
  errorLogFilter: ErrorLogFilters.ALL
});

const reducer = createReducer(
  initialState,
  on(logsActions.actionGetAuditLogs, state => ({
    ...state
  })),
  on(logsActions.actionGetAuditLogsSuccess, (state, { auditLogs, totalAuditLogs }) => {
    return adapter.upsertMany(auditLogs, {
      ...state,
      isAuditLogLoading: false,
      totalAuditLogs,
      skipAuditLog: state.skipAuditLog + auditLogs.length
    });
  }),
  on(logsActions.actionGetAuditLogsFailure, state => ({
    ...state,
    isAuditLogLoading: false
  })),
  on(logsActions.actionGetErrorLogs, state => ({
    ...state,
  })),
  on(logsActions.actionGetErrorLogsSuccess, (state, { errorLogs, totalErrorLogs }) => {
    return adapter.upsertMany(errorLogs, {
      ...state,
      isErrorLogLoading: false,
      totalErrorLogs,
      skipErrorLog: state.skipErrorLog + errorLogs.length
    });
  }),
  on(logsActions.actionGetErrorLogsFailure, state => ({
    ...state,
    isErrorLogLoading: false
  })),
  on(logsActions.actionSetSkipAuditLog,  (state, { skipAuditLog }) => {
    return ({ ...state, skipAuditLog });
  }),
  on(logsActions.actionSetSkipErrorLog,  (state, { skipErrorLog }) => {
    return ({ ...state, skipErrorLog });
  }),
  on(logsActions.actionSetIsAuditLogLoading, (state, { isAuditLogLoading }) => {
    return ({ ...state, isAuditLogLoading })
  }),
  on(logsActions.actionSetIsErrorLogLoading, (state, { isErrorLogLoading }) => {
    return ({ ...state, isErrorLogLoading })
  }),
  on(logsActions.actionSetAuditLogFilter, (state, { filterType }) => {
    return ({ ...state, auditLogFilter: filterType })
  }),
  on(logsActions.actionSetErrorLogFilter, (state, { filterType }) => {
    return ({ ...state, errorLogFilter: filterType })
  })
);

export function logsReducer(state: LogState | undefined, action: Action) {
  return reducer(state, action);
}
