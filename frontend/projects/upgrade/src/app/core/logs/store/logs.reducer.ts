import { createReducer, on, Action } from '@ngrx/store';
import { createEntityAdapter, EntityAdapter } from '@ngrx/entity';
import { AuditLogs, LogState, ErrorLogs, ExperimentLogsMetadata } from './logs.model';
import * as logsActions from './logs.actions';

export const adapter: EntityAdapter<AuditLogs | ErrorLogs> = createEntityAdapter<AuditLogs | ErrorLogs>();

export const { selectIds, selectEntities, selectAll, selectTotal } = adapter.getSelectors();

const initialExperimentLogsMetadata: ExperimentLogsMetadata = {
  logs: [],
  skip: 0,
  total: null,
  isLoading: false,
  filter: null,
};

export const initialState: LogState = adapter.getInitialState({
  isAuditLogLoading: false,
  isErrorLogLoading: false,
  skipAuditLog: 0,
  totalAuditLogs: null,
  skipErrorLog: 0,
  totalErrorLogs: null,
  auditLogFilter: null,
  errorLogFilter: null,
  experimentLogs: {},
});

const reducer = createReducer(
  initialState,
  on(logsActions.actionGetAuditLogs, (state) => ({
    ...state,
  })),
  on(logsActions.actionGetAuditLogsSuccess, (state, { auditLogs, totalAuditLogs }) =>
    adapter.upsertMany(auditLogs, {
      ...state,
      isAuditLogLoading: false,
      totalAuditLogs,
      skipAuditLog: state.skipAuditLog + auditLogs.length,
    })
  ),
  on(logsActions.actionGetAuditLogsFailure, (state) => ({
    ...state,
    isAuditLogLoading: false,
  })),
  on(logsActions.actionGetErrorLogs, (state) => ({
    ...state,
  })),
  on(logsActions.actionGetErrorLogsSuccess, (state, { errorLogs, totalErrorLogs }) =>
    adapter.upsertMany(errorLogs, {
      ...state,
      isErrorLogLoading: false,
      totalErrorLogs,
      skipErrorLog: state.skipErrorLog + errorLogs.length,
    })
  ),
  on(logsActions.actionGetErrorLogsFailure, (state) => ({
    ...state,
    isErrorLogLoading: false,
  })),
  on(logsActions.actionSetSkipAuditLog, (state, { skipAuditLog }) => ({ ...state, skipAuditLog })),
  on(logsActions.actionSetSkipErrorLog, (state, { skipErrorLog }) => ({ ...state, skipErrorLog })),
  on(logsActions.actionSetIsAuditLogLoading, (state, { isAuditLogLoading }) => ({ ...state, isAuditLogLoading })),
  on(logsActions.actionSetIsErrorLogLoading, (state, { isErrorLogLoading }) => ({ ...state, isErrorLogLoading })),
  on(logsActions.actionSetAuditLogFilter, (state, { filterType }) => ({ ...state, auditLogFilter: filterType })),
  on(logsActions.actionSetErrorLogFilter, (state, { filterType }) => ({ ...state, errorLogFilter: filterType })),
  // Experiment-specific log handlers
  on(logsActions.actionGetExperimentLogs, (state, { experimentId, fromStart }) => {
    const experimentLog = state.experimentLogs[experimentId] || initialExperimentLogsMetadata;
    return {
      ...state,
      experimentLogs: {
        ...state.experimentLogs,
        [experimentId]: {
          ...experimentLog,
          isLoading: true,
          ...(fromStart && { skip: 0, logs: [] }),
        },
      },
    };
  }),
  on(logsActions.actionGetExperimentLogsSuccess, (state, { experimentId, auditLogs, totalAuditLogs, fromStart }) => {
    const experimentLog = state.experimentLogs[experimentId] || initialExperimentLogsMetadata;
    const updatedLogs = fromStart ? auditLogs : [...experimentLog.logs, ...auditLogs];

    return {
      ...state,
      experimentLogs: {
        ...state.experimentLogs,
        [experimentId]: {
          ...experimentLog,
          logs: updatedLogs,
          skip: updatedLogs.length,
          total: totalAuditLogs,
          isLoading: false,
        },
      },
    };
  }),
  on(logsActions.actionGetExperimentLogsFailure, (state, { experimentId }) => {
    const experimentLog = state.experimentLogs[experimentId] || initialExperimentLogsMetadata;
    return {
      ...state,
      experimentLogs: {
        ...state.experimentLogs,
        [experimentId]: {
          ...experimentLog,
          isLoading: false,
        },
      },
    };
  }),
  on(logsActions.actionSetExperimentLogFilter, (state, { experimentId, filterType }) => {
    const experimentLog = state.experimentLogs[experimentId] || initialExperimentLogsMetadata;
    return {
      ...state,
      experimentLogs: {
        ...state.experimentLogs,
        [experimentId]: {
          ...experimentLog,
          filter: filterType,
          logs: [],
          skip: 0,
        },
      },
    };
  }),
  on(logsActions.actionClearExperimentLogs, (state, { experimentId }) => {
    const experimentLogs = { ...state.experimentLogs };
    delete experimentLogs[experimentId];
    return { ...state, experimentLogs };
  })
);

export function logsReducer(state: LogState | undefined, action: Action) {
  return reducer(state, action);
}
