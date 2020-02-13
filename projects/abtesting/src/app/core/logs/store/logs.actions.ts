import { createAction, props } from '@ngrx/store';
import { Audit } from './logs.model';

export const actionGetAllAudit = createAction('[Logs] Get All Audits');

export const actionStoreAudits = createAction('[Logs] Store Audits', props<{ audits: Audit[] }>());

export const actionGetAllAuditFailure = createAction('[Logs] Get All Audits Failure');
