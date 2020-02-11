import { createAction, props } from '@ngrx/store';
import { Audit } from './audit.model';

export const actionGetAllAudit = createAction('[Audit] Get All Audits');

export const actionStoreAudits = createAction(
  '[Audit] Store Audits',
  props<{ audits: Audit[] }>()
);

export const actionGetAllAuditFailure = createAction(
  '[Audit] Get All Audits Failure'
);
