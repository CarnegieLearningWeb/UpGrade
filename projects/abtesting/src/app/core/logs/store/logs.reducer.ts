import { createReducer, on, Action } from '@ngrx/store';
import { createEntityAdapter, EntityAdapter } from '@ngrx/entity';
import { AuditLogs, LogState, ErrorLogs } from './logs.model';
import * as logsActions from './logs.actions';

export const adapter: EntityAdapter<AuditLogs | ErrorLogs> = createEntityAdapter<AuditLogs | ErrorLogs>();

export const { selectIds, selectEntities, selectAll, selectTotal } = adapter.getSelectors();

export const initialState: LogState = adapter.getInitialState({
  isAuditLogLoading: false,
  isErrorLogLoading: false
});

const reducer = createReducer(
  initialState,
  on(logsActions.actionGetAllAuditLogs, state => ({
    ...state,
    isAuditLogLoading: true
  })),
  on(logsActions.actionGetAllAuditLogsSuccess, (state, { auditLogs }) => {
    return adapter.upsertMany(auditLogs, {
      ...state,
      isAuditLogLoading: false
    });
  }),
  on(logsActions.actionGetAllAuditLogsFailure, state => ({
    ...state,
    isAuditLogLoading: false
  })),
  on(logsActions.actionGetAllErrorLogs, state => ({
    ...state,
    isErrorLogLoading: true
  })),
  on(logsActions.actionGetAllErrorLogsSuccess, (state, { errorLogs }) => {
    return adapter.upsertMany(errorLogs, {
      ...state,
      isErrorLogLoading: false
    });
  }),
  on(logsActions.actionGetAllErrorLogsFailure, state => ({
    ...state,
    isErrorLogLoading: false
  }))
);

export function logsReducer(state: LogState | undefined, action: Action) {
  return reducer(state, action);
}
