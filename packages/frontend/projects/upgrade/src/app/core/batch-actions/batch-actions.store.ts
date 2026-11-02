import { Action, ActionReducer } from '@ngrx/store';
import { BatchDeleteEntity } from 'upgrade_types';
import { RootBatchDeleteActions } from './batch-actions.actions';
import { RootBatchDeleteState, isBatchDeleteBusy } from './batch-actions.models';
import { receiveListRows, reduceRootBatchDelete } from './batch-actions.reducer';
import { selectionItem } from './batch-actions.helpers';

interface RootBatchDeleteConfig {
  entity: BatchDeleteEntity;
  actions: RootBatchDeleteActions;
  rowsKey: string;
  loadingKey: string;
  skipKey: string;
  totalKey: string;
  queryTypes: string[];
  listSuccessType: string;
  responseRowsKey: string;
  deletedId: (action: Action) => string | undefined;
}

/**
 * Each entity's existing feature store owns rootBatch; this wrapper composes its deletion lifecycle
 * with that feature's reducer. Shared effects run in the existing entity effect classes, not a separate store.
 */
export function withRootBatchDelete<S extends { rootBatch: RootBatchDeleteState }>(
  reducer: ActionReducer<S>,
  initialState: S,
  config: RootBatchDeleteConfig
): ActionReducer<S> {
  return (input, action: Action & { batchListRequestId?: string; fromStarting?: boolean }) => {
    const state = input || initialState;
    if (action.batchListRequestId && action.batchListRequestId !== state.rootBatch.listRequestId) return state;
    let rootBatch = reduceBatchDeleteAction(state.rootBatch, action, config);
    let result = reducer(state, action);
    if (action.type === config.listSuccessType) {
      rootBatch = receiveListRows(rootBatch, action[config.responseRowsKey].map(selectionItem), !!action.fromStarting);
    }
    // A cancelled tracked read cannot dispatch its usual success/failure action to clear loading.
    if (state.rootBatch.listLoading && state.rootBatch.listRequestId && !rootBatch.listRequestId)
      result = { ...result, [config.loadingKey]: false };
    if (action.type === config.listSuccessType) result = deduplicateRows(result, config.rowsKey);
    result = removeConfirmedData(result, rootBatch.removedIds, config.rowsKey);
    if (
      (action.type === config.actions.listFailed.type || action.type === config.actions.batchDeleteRequested.type) &&
      rootBatch !== state.rootBatch
    ) {
      // Failed reads and reads cancelled by submission leave the displayed rows available for selection.
      rootBatch = { ...rootBatch, loadedIds: result[config.rowsKey].map((row) => row.id) };
    }
    result = resetPaginationAfterDeletion(result, state.rootBatch, rootBatch, config);
    return rootBatch === state.rootBatch && result === state ? state : { ...result, rootBatch };
  };
}

function reduceBatchDeleteAction(
  state: RootBatchDeleteState,
  action: Action,
  config: RootBatchDeleteConfig
): RootBatchDeleteState {
  let result = reduceRootBatchDelete(state, action, config.actions, config.entity);
  const deletedId = config.deletedId(action);
  if (deletedId)
    result = reduceRootBatchDelete(
      result,
      config.actions.confirmedRemoved({ ids: [deletedId] }),
      config.actions,
      config.entity
    );
  if (config.queryTypes.includes(action.type))
    result = { ...result, loadedIds: [], listRequestId: null, listLoading: false };
  return result;
}

function deduplicateRows<S>(state: S, rowsKey: string): S {
  const rows = state[rowsKey];
  const distinct = new Map(rows.map((row) => [row.id, row]));
  return distinct.size === rows.length ? state : { ...state, [rowsKey]: [...distinct.values()] };
}

/** Keep IDs confirmed deleted or absent out of state, including data from late detail/stat responses. */
function removeConfirmedData<S>(state: S, removedIds: string[], rowsKey: string): S {
  if (!removedIds.length) return state;
  let result = state;
  const removed = new Set(removedIds);
  const prune = (key: string) => {
    const rows = result[key];
    if (Array.isArray(rows) && rows.some((row) => removed.has(row.id)))
      result = { ...result, [key]: rows.filter((row) => !removed.has(row.id)) };
  };
  prune(rowsKey);
  prune('allExperimentNames');
  prune('listSegmentOptions');
  if (removed.has(result['selectedFlag']?.id)) result = { ...result, selectedFlag: null };
  for (const key of ['stats', 'rewardsSummaries']) {
    if (result[key] && Object.keys(result[key]).some((id) => removed.has(id))) {
      result = {
        ...result,
        [key]: Object.fromEntries(Object.entries(result[key]).filter(([id]) => !removed.has(id))),
      };
    }
  }
  return result;
}

function resetPaginationAfterDeletion<S>(
  state: S,
  previous: RootBatchDeleteState,
  current: RootBatchDeleteState,
  config: RootBatchDeleteConfig
): S {
  if (
    current.removedIds.length > previous.removedIds.length ||
    (isBatchDeleteBusy(previous) &&
      current.operation?.status === 'complete' &&
      current.operation.transportStatus === undefined)
  ) {
    return { ...state, [config.skipKey]: 0, [config.totalKey]: null };
  }
  return state;
}
