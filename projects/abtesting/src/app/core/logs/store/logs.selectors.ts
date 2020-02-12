import { createSelector, createFeatureSelector } from '@ngrx/store';
import { State, AuditState } from './logs.model';
import { selectAll } from './logs.reducer';

export const selectAuditState = createFeatureSelector<State, AuditState>(
  'logs'
);

export const selectAllAudit = createSelector(selectAuditState, selectAll);

export const selectIsAuditLoading = createSelector(
  selectAuditState,
  state => state.isAuditLoading
);
