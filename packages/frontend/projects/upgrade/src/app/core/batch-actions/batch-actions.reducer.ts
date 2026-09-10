import { Action } from '@ngrx/store';
import { BatchDeleteEntity, DeletionReasonCode, SEGMENT_TYPE, hasBatchDeletePermission } from 'upgrade_types';
import * as auth from '../auth/store/auth.actions';
import { RootBatchActions } from './batch-actions.actions';
import { RootBatchState, RootSelectionItem, initialRootBatchState, isBatchBusy } from './batch-actions.models';
import { confirmedRemovedIds, selectionView } from './batch-actions.helpers';

function matches<C extends { type: string; (...args: any[]): Action }>(
  action: Action,
  creator: C
): action is ReturnType<C> {
  return action.type === creator.type;
}

export function invalidateSelection(state: RootBatchState): RootBatchState {
  return { ...state, revision: state.revision + 1, eligibility: { status: 'idle' }, confirmation: null };
}

function removeConfirmed(state: RootBatchState, ids: string[]): RootBatchState {
  if (!ids.length) return state;
  const removed = new Set(ids);
  return {
    ...invalidateSelection(state),
    removedIds: [...new Set([...state.removedIds, ...ids])],
    selectedById: Object.fromEntries(Object.entries(state.selectedById).filter(([id]) => !removed.has(id))),
    loadedIds: state.loadedIds.filter((id) => !removed.has(id)),
  };
}

export function receiveListRows(
  state: RootBatchState,
  items: RootSelectionItem[],
  fromStarting: boolean
): RootBatchState {
  const removed = new Set(state.removedIds);
  const rows = items.filter((item) => !removed.has(item.id));
  const selectedById = { ...state.selectedById };
  let changed = false;
  rows.forEach((item) => {
    if (selectedById[item.id]) {
      changed = changed || JSON.stringify(selectedById[item.id]) !== JSON.stringify(item);
      selectedById[item.id] = item;
    }
  });
  return {
    ...(changed ? invalidateSelection(state) : state),
    // A background page refresh must not replace the snapshot already shown in the dialog.
    confirmation: state.confirmation,
    selectedById,
    loadedIds: [...new Set([...(fromStarting ? [] : state.loadedIds), ...rows.map((item) => item.id)])],
    listLoading: false,
    listRefreshFailed: false,
  };
}

export function reduceRootBatch(
  state: RootBatchState,
  action: Action,
  actions: RootBatchActions,
  entity: BatchDeleteEntity
): RootBatchState {
  if (matches(action, auth.actionLogoutStart) || matches(action, auth.actionLogoutSuccess))
    return initialRootBatchState;
  if (
    matches(action, auth.actionSetUserInfo) ||
    matches(action, auth.actionSetUserInfoSuccess) ||
    matches(action, auth.actionLoginSuccess)
  ) {
    const email = action.user?.email || null;
    const role = action.user?.role || null;
    if (state.userEmail !== email) return { ...initialRootBatchState, userEmail: email, role };
    return state.role === role
      ? state
      : {
          ...invalidateSelection(state),
          role,
          selectedById: Object.fromEntries(
            Object.entries(state.selectedById).map(([id, item]) => [
              id,
              item.reasonCode === DeletionReasonCode.MISSING_PERMISSION ? { ...item, reasonCode: undefined } : item,
            ])
          ),
        };
  }
  if (matches(action, actions.listRequested))
    return {
      ...state,
      listRequestId: action.requestId,
      loadedIds: action.fromStarting ? [] : state.loadedIds,
      listLoading: true,
      listRefreshFailed: false,
    };
  if (matches(action, actions.listFailed))
    return action.requestId === state.listRequestId
      ? { ...state, listLoading: false, listRefreshFailed: action.batchRefresh }
      : state;
  if (matches(action, actions.invalidateEligibility)) return invalidateSelection(state);
  if (matches(action, actions.confirmedRemoved)) return removeConfirmed(state, action.ids);
  if (
    matches(action, actions.clearSelection) ||
    matches(action, actions.toggleHeader) ||
    matches(action, actions.toggleRow)
  ) {
    if (isBatchBusy(state)) return state;
    let selectedById = { ...state.selectedById };
    if (
      matches(action, actions.clearSelection) ||
      (matches(action, actions.toggleHeader) && Object.keys(selectedById).length)
    ) {
      selectedById = {};
    } else {
      const items = matches(action, actions.toggleRow)
        ? [action.item]
        : matches(action, actions.toggleHeader) && !state.listLoading
        ? action.items
        : [];
      for (const item of items) {
        if (selectedById[item.id] && matches(action, actions.toggleRow)) delete selectedById[item.id];
        else if (
          state.loadedIds.includes(item.id) &&
          (entity !== 'segments' || item.segmentType === SEGMENT_TYPE.PUBLIC)
        ) {
          selectedById[item.id] = { ...item };
        }
      }
    }
    return { ...invalidateSelection(state), selectedById };
  }
  if (matches(action, actions.refreshEligibility)) {
    if (isBatchBusy(state) || !Object.keys(state.selectedById).length) return state;
    if (state.confirmation && !action.forConfirmation) return state;
    if (state.eligibility.status === 'checking' && state.eligibility.revision === state.revision) {
      return {
        ...state,
        eligibility: {
          ...state.eligibility,
          forConfirmation: state.eligibility.forConfirmation || action.forConfirmation,
        },
      };
    }
    return {
      ...state,
      confirmation: null,
      eligibility: {
        status: 'checking',
        requestId: action.requestId,
        revision: state.revision,
        forConfirmation: action.forConfirmation,
      },
    };
  }
  if (matches(action, actions.eligibilitySucceeded) || matches(action, actions.eligibilityFailed)) {
    if (action.requestId !== state.eligibility.requestId || action.revision !== state.revision) return state;
    if (matches(action, actions.eligibilityFailed))
      return { ...state, confirmation: null, eligibility: { status: 'failed' } };
    const selectedById = { ...state.selectedById };
    for (const item of action.result.items) {
      if (selectedById[item.id]) {
        const { id, name, stateOrStatus, segmentType, availability, reasonCode } = item;
        selectedById[id] = {
          id,
          name: name || selectedById[id].name,
          stateOrStatus,
          segmentType,
          availability,
          reasonCode,
        };
      }
    }
    const allDeletable = action.result.allDeletable && hasBatchDeletePermission(state.role, entity);
    const confirmation =
      state.eligibility.forConfirmation && allDeletable
        ? {
            operationId: action.requestId,
            revision: state.revision,
            items: Object.values(selectedById).map((item) => ({ ...item })),
            notShownCount: selectionView(state, entity).notShownCount,
          }
        : null;
    const absentIds = action.result.items.filter((item) => item.availability === 'not_found').map((item) => item.id);
    return {
      ...removeConfirmed({ ...state, selectedById }, absentIds),
      confirmation: absentIds.length ? null : confirmation,
      eligibility: {
        status: 'ready',
        requestId: action.requestId,
        revision: action.revision,
        allDeletable: allDeletable && !absentIds.length,
        absentIds,
      },
    };
  }
  if (matches(action, actions.dismissConfirmation))
    return isBatchBusy(state) ? state : { ...state, confirmation: null };
  if (matches(action, actions.batchDeleteRequested)) {
    const snapshot = state.confirmation;
    if (
      isBatchBusy(state) ||
      !snapshot ||
      snapshot.operationId !== action.snapshot.operationId ||
      snapshot.revision !== action.snapshot.revision ||
      !hasBatchDeletePermission(state.role, entity)
    )
      return state;
    return {
      ...state,
      listRequestId: null,
      listLoading: false,
      confirmation: null,
      operation: { snapshot, status: 'submitting', reconciledAbsentIds: [] },
    };
  }
  if (
    matches(action, actions.batchDeleteCompleted) ||
    matches(action, actions.batchDeleteRequestFailed) ||
    matches(action, actions.reconciliationCompleted)
  ) {
    if (
      !state.operation ||
      action.operationId !== state.operation.snapshot.operationId ||
      state.operation.status === 'complete'
    )
      return state;
    if (matches(action, actions.batchDeleteCompleted)) {
      const next = removeConfirmed(state, confirmedRemovedIds(action.result));
      return {
        ...invalidateSelection(next),
        operation: {
          ...state.operation,
          result: action.result,
          status: action.result.results.some((item) => item.outcome === 'unknown') ? 'reconciling' : 'complete',
        },
      };
    }
    if (matches(action, actions.batchDeleteRequestFailed)) {
      const rejected = [400, 401, 403].includes(action.status);
      return {
        ...invalidateSelection(state),
        operation: {
          ...state.operation,
          transportStatus: action.status,
          status: rejected ? 'complete' : 'reconciling',
          result: {
            phase: rejected ? 'rejected' : 'executed',
            results: state.operation.snapshot.items.map(({ id }) => ({
              id,
              outcome: action.status === 403 ? 'forbidden' : rejected ? 'not_attempted' : 'unknown',
              reasonCode:
                action.status === 403
                  ? DeletionReasonCode.MISSING_PERMISSION
                  : rejected
                  ? DeletionReasonCode.DELETE_FAILED
                  : DeletionReasonCode.OUTCOME_UNKNOWN,
            })),
          },
        },
      };
    }
    const absent =
      action.result?.items.filter((item) => item.availability === 'not_found').map((item) => item.id) || [];
    return {
      ...removeConfirmed(state, absent),
      operation: {
        ...state.operation,
        status: 'complete',
        reconciledAbsentIds: absent.filter((id) => !confirmedRemovedIds(state.operation.result).includes(id)),
        reconciliationFailed: !action.result,
      },
    };
  }
  return state;
}
