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

function invalidateSelection(state: RootBatchState): RootBatchState {
  return { ...state, confirmation: null };
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
  rows.forEach((item) => {
    if (selectedById[item.id]) {
      selectedById[item.id] = item;
    }
  });
  return {
    // A background page refresh must not replace the snapshot already shown in the dialog.
    ...state,
    selectedById,
    loadedIds: [...new Set([...(fromStarting ? [] : state.loadedIds), ...rows.map((item) => item.id)])],
    listLoading: false,
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
    return state.role === role ? state : { ...invalidateSelection(state), role };
  }
  if (matches(action, actions.listRequested))
    return {
      ...state,
      listRequestId: action.requestId,
      // Keep IDs for displayed rows until replacement rows arrive. Query changes clear them separately.
      loadedIds: state.loadedIds,
      listLoading: true,
    };
  if (matches(action, actions.listFailed))
    return action.requestId === state.listRequestId ? { ...state, listLoading: false } : state;
  if (matches(action, actions.confirmedRemoved)) return removeConfirmed(state, action.ids);
  // Navigation clears the UI selection, but keeps any submitted operation and its result tracking alive.
  if (matches(action, actions.rootPageLeft)) return { ...invalidateSelection(state), selectedById: {} };
  if (matches(action, actions.toggleHeader) || matches(action, actions.toggleRow)) {
    if (isBatchBusy(state)) return state;
    let selectedById = { ...state.selectedById };
    if (matches(action, actions.toggleHeader) && Object.keys(selectedById).length) {
      selectedById = {};
    } else {
      const items = matches(action, actions.toggleRow)
        ? [action.item]
        : matches(action, actions.toggleHeader)
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
  if (matches(action, actions.prepareConfirmation)) {
    const selection = selectionView(state, entity);
    if (state.confirmation || !selection.canRequestConfirmation) return state;
    // Use retained row metadata, including hidden selections. The delete endpoint validates current eligibility.
    return {
      ...state,
      confirmation: {
        operationId: action.operationId,
        items: selection.items.map((item) => ({ ...item })),
        notShownCount: selection.notShownCount,
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
      !hasBatchDeletePermission(state.role, entity)
    )
      return state;
    return {
      ...state,
      listRequestId: null,
      listLoading: false,
      confirmation: null,
      operation: { snapshot, status: 'submitting' },
    };
  }
  if (matches(action, actions.batchDeleteCompleted) || matches(action, actions.batchDeleteRequestFailed)) {
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
          status: 'complete',
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
          // The shared HTTP interceptor reports request errors. Release controls without follow-up requests.
          status: 'complete',
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
  }
  return state;
}
