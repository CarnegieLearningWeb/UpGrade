import { createAction, props } from '@ngrx/store';
import { BatchDeleteResult } from 'upgrade_types';
import { BatchDeleteSnapshot, RootSelectionItem } from './batch-actions.models';

export function createBatchActions(source: string) {
  const prefix = `[${source} Batch]`;
  return {
    toggleRow: createAction(`${prefix} Toggle Row`, props<{ item: RootSelectionItem }>()),
    toggleHeader: createAction(`${prefix} Toggle Header`, props<{ items: RootSelectionItem[] }>()),
    rootPageLeft: createAction(`${prefix} Root Page Left`),
    confirmedRemoved: createAction(`${prefix} Confirmed Removed`, props<{ ids: string[] }>()),
    prepareConfirmation: createAction(`${prefix} Prepare Confirmation`, props<{ operationId: string }>()),
    dismissConfirmation: createAction(`${prefix} Dismiss Confirmation`),
    batchDeleteRequested: createAction(`${prefix} Delete Requested`, props<{ snapshot: BatchDeleteSnapshot }>()),
    batchDeleteCompleted: createAction(
      `${prefix} Delete Completed`,
      props<{ operationId: string; result: BatchDeleteResult }>()
    ),
    batchDeleteRequestFailed: createAction(
      `${prefix} Delete Request Failed`,
      props<{ operationId: string; status: number }>()
    ),
    listRequested: createAction(`${prefix} List Requested`, props<{ requestId: string }>()),
    listFailed: createAction(`${prefix} List Failed`, props<{ requestId: string }>()),
  };
}

export type RootBatchActions = ReturnType<typeof createBatchActions>;
