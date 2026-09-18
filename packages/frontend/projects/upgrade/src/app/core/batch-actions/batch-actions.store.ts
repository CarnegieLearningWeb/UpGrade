import { Action, ActionReducer } from '@ngrx/store';
import { BatchDeleteEntity } from 'upgrade_types';
import { RootBatchActions } from './batch-actions.actions';
import { RootBatchState, isBatchBusy } from './batch-actions.models';
import { receiveListRows, reduceRootBatch } from './batch-actions.reducer';
import { selectionItem } from './batch-actions.helpers';

interface RootListConfig {
  entity: BatchDeleteEntity;
  actions: RootBatchActions;
  rowsKey: string;
  loadingKey: string;
  skipKey: string;
  totalKey: string;
  queryTypes: string[];
  listSuccessType: string;
  responseRowsKey: string;
  deletedId: (action: Action) => string | undefined;
}

/** Attach the shared selection lifecycle while preserving each entity's existing detail reducers. */
export function withRootBatch<S extends { rootBatch: RootBatchState }>(
  reducer: ActionReducer<S>,
  initialState: S,
  config: RootListConfig
): ActionReducer<S> {
  return (input, action: Action & { batchListRequestId?: string; fromStarting?: boolean }) => {
    const state = input || initialState;
    if (action.batchListRequestId && action.batchListRequestId !== state.rootBatch.listRequestId) return state;
    let rootBatch = reduceRootBatch(state.rootBatch, action, config.actions, config.entity);
    const deletedId = config.deletedId(action);
    if (deletedId)
      rootBatch = reduceRootBatch(
        rootBatch,
        config.actions.confirmedRemoved({ ids: [deletedId] }),
        config.actions,
        config.entity
      );
    if (config.queryTypes.includes(action.type))
      rootBatch = { ...rootBatch, loadedIds: [], listRequestId: null, listLoading: false };
    const next = reducer(state, action);
    if (action.type === config.listSuccessType) {
      rootBatch = receiveListRows(rootBatch, action[config.responseRowsKey].map(selectionItem), !!action.fromStarting);
    }
    let result = next;
    // A cancelled tracked read cannot dispatch its usual success/failure action to clear loading.
    if (state.rootBatch.listLoading && state.rootBatch.listRequestId && !rootBatch.listRequestId)
      result = { ...result, [config.loadingKey]: false };
    if (action.type === config.listSuccessType) {
      const rows = result[config.rowsKey];
      const distinct = new Map(rows.map((row) => [row.id, row]));
      if (distinct.size !== rows.length) result = { ...result, [config.rowsKey]: [...distinct.values()] };
    }
    // Tombstones also protect against late detail/stat responses, whose IDs are not tied to a root query.
    if (rootBatch.removedIds.length) {
      const removed = new Set(rootBatch.removedIds);
      const prune = (key: string) => {
        const rows = result[key];
        if (Array.isArray(rows) && rows.some((row) => removed.has(row.id)))
          result = { ...result, [key]: rows.filter((row) => !removed.has(row.id)) };
      };
      prune(config.rowsKey);
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
    }
    if (
      (action.type === config.actions.listFailed.type || action.type === config.actions.batchDeleteRequested.type) &&
      rootBatch !== state.rootBatch
    ) {
      // Failed reads and reads cancelled by submission leave the displayed rows available for selection.
      rootBatch = { ...rootBatch, loadedIds: result[config.rowsKey].map((row) => row.id) };
    }
    if (
      rootBatch.removedIds.length > state.rootBatch.removedIds.length ||
      (isBatchBusy(state.rootBatch) &&
        rootBatch.operation?.status === 'complete' &&
        rootBatch.operation.transportStatus === undefined)
    ) {
      result = { ...result, [config.skipKey]: 0, [config.totalKey]: null };
    }
    return rootBatch === state.rootBatch && result === state ? state : { ...result, rootBatch };
  };
}
