import { createReducer, on, Action } from '@ngrx/store';
import { createEntityAdapter, EntityAdapter } from '@ngrx/entity';
import { Audit, AuditState } from './audit.model';
import * as auditActions from './audit.actions';

export const adapter: EntityAdapter<Audit> = createEntityAdapter<
  Audit
>();

export const {
  selectIds,
  selectEntities,
  selectAll,
  selectTotal
} = adapter.getSelectors();

export const initialState: AuditState = adapter.getInitialState({
  isAuditLoading : false
});

const reducer = createReducer(
  initialState,
  on(
    auditActions.actionGetAllAudit,
    (state) => ({ ...state, isAuditLoading: true })
  ),
  on(
    auditActions.actionStoreAudits,
    (state, { audits }) => {
      return adapter.addMany(audits, { ...state, isAuditLoading: false });
    }
  )
);

export function auditReducer(
  state: AuditState | undefined,
  action: Action
) {
  return reducer(state, action);
}
