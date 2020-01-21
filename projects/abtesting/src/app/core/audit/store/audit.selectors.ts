import { createSelector, createFeatureSelector } from '@ngrx/store';
import { State, AuditState } from './audit.model';
import { selectAll } from './audit.reducer';

export const selectAuditState = createFeatureSelector<
  State,
  AuditState
>('audit');

export const selectAllAudit = createSelector(
  selectAuditState,
  selectAll
);
