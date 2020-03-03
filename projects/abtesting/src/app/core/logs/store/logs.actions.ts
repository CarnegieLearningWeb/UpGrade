import { createAction, props } from '@ngrx/store';
import { AuditLogs, ErrorLogs, AuditLogFilters, ErrorLogFilters } from './logs.model';

export const actionGetAuditLogs = createAction(
  '[Logs] Get Audit Logs',
  props<{ fromStart?: boolean }>()
);

export const actionGetAuditLogsSuccess = createAction(
  '[Logs] Get Audit Logs Success',
  props<{ auditLogs: AuditLogs[], totalAuditLogs: number }>()
);

export const actionGetAuditLogsFailure = createAction(
  '[Logs] Get Audit Logs Failure'
);

export const actionGetErrorLogs = createAction(
  '[Logs] Get Error Logs',
  props<{ fromStart?: boolean }>()
);

export const actionGetErrorLogsSuccess = createAction(
  '[Logs] Get Error Logs Success',
  props<{ errorLogs: ErrorLogs[], totalErrorLogs: number }>()
);

export const actionGetErrorLogsFailure = createAction(
  '[Logs] Get Error Logs Failure'
);

export const actionSetIsAuditLogLoading = createAction(
  '[Logs] Set Is Audit Log Loading',
  props<{ isAuditLogLoading: boolean }>()
);

export const actionSetIsErrorLogLoading = createAction(
  '[Logs] Set Is Error Log Loading',
  props<{ isErrorLogLoading: boolean }>()
);

export const actionSetSkipAuditLog = createAction(
  '[Logs] Set Skip Audit Log',
  props<{ skipAuditLog: number }>()
);

export const actionSetSkipErrorLog = createAction(
  '[Logs] Set Skip Error Log',
  props<{ skipErrorLog: number }>()
);

export const actionSetAuditLogFilter = createAction(
  '[Logs] Set Audit Log Filter',
  props<{ filterType: AuditLogFilters }>()
);

export const actionSetErrorLogFilter = createAction(
  '[Logs] Set Error Log Filter',
  props<{ filterType: ErrorLogFilters }>()
);
