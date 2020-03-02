import { createReducer, on, Action } from '@ngrx/store';
import { createEntityAdapter, EntityAdapter } from '@ngrx/entity';
import { AuditLogs, LogState, ErrorLogs } from './logs.model';
import * as logsActions from './logs.actions';
import * as pullallby from 'lodash.pullallby';

export const adapter: EntityAdapter<AuditLogs | ErrorLogs> = createEntityAdapter<AuditLogs | ErrorLogs>();

export const { selectIds, selectEntities, selectAll, selectTotal } = adapter.getSelectors();

export const initialState: LogState = adapter.getInitialState({
  isAuditLogLoading: false,
  isErrorLogLoading: false,
  skipAuditLog: 0,
  totalAuditLogs: null,
  skipErrorLog: 0,
  totalErrorLogs: null
});

const reducer = createReducer(
  initialState,
  on(logsActions.actionGetAuditLogs, state => ({
    ...state
  })),
  on(logsActions.actionGetAuditLogsSuccess, (state, { auditLogs, totalAuditLogs }) => {
    const logs = pullallby(auditLogs, Object.values(state.entities), 'id');
    return adapter.upsertMany(auditLogs, {
      ...state,
      isAuditLogLoading: false,
      totalAuditLogs,
      skipAuditLog: state.skipAuditLog + logs.length
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
    const logs = pullallby(errorLogs, Object.values(state.entities), 'id');
    return adapter.upsertMany(errorLogs, {
      ...state,
      isErrorLogLoading: false,
      totalErrorLogs,
      skipErrorLog: state.skipErrorLog + logs.length
    });
  }),
  on(logsActions.actionGetErrorLogsFailure, state => ({
    ...state,
    isErrorLogLoading: false
  })),
  on(logsActions.actionSetIsAuditLogLoading, (state, { isAuditLogLoading }) => {
    return ({ ...state, isAuditLogLoading })
  }),
  on(logsActions.actionSetIsErrorLogLoading, (state, { isErrorLogLoading }) => {
    return ({ ...state, isErrorLogLoading })
  })
);

export function logsReducer(state: LogState | undefined, action: Action) {
  return reducer(state, action);
}
