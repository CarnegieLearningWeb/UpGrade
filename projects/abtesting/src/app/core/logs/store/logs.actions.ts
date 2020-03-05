import { createAction, props } from '@ngrx/store';
import { AuditLogs, ErrorLogs } from './logs.model';

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
