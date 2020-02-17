import { createAction, props } from '@ngrx/store';
import { AuditLogs, ErrorLogs } from './logs.model';

export const actionGetAllAuditLogs = createAction('[Logs] Get All Audit Logs');

export const actionGetAllAuditLogsSuccess = createAction(
  '[Logs] Get All Audit Logs Success',
  props<{ auditLogs: AuditLogs[] }>()
);

export const actionGetAllAuditLogsFailure = createAction(
  '[Logs] Get All Audit Logs Failure'
);

export const actionGetAllErrorLogs = createAction('[Logs] Get All Error Logs');

export const actionGetAllErrorLogsSuccess = createAction(
  '[Logs] Get All Error Logs Success',
  props<{ errorLogs: ErrorLogs[] }>()
);

export const actionGetAllErrorLogsFailure = createAction(
  '[Logs] Get All Error Logs Failure'
);
