import { BatchDeleteResult, EXPERIMENT_STATE, FEATURE_FLAG_STATUS, SEGMENT_STATUS } from 'upgrade_types';

export enum BatchSelectionReasonCode {
  EXPERIMENT_ACTIVE = 'experiment_active',
  FEATURE_FLAG_ENABLED = 'feature_flag_enabled',
  SEGMENT_USED = 'segment_used',
}

export interface RootSelectionItem {
  id: string;
  name?: string;
  stateOrStatus?: EXPERIMENT_STATE | FEATURE_FLAG_STATUS | SEGMENT_STATUS;
}

export interface BatchDeleteSnapshot {
  operationId: string;
  items: RootSelectionItem[];
}

export interface RootBatchState {
  selectedById: Record<string, RootSelectionItem>;
  userEmail: string | null;
  loadedIds: string[];
  listRequestId: string | null;
  listLoading: boolean;
  removedIds: string[];
  confirmation: BatchDeleteSnapshot | null;
  operation: {
    snapshot: BatchDeleteSnapshot;
    status: 'submitting' | 'complete';
    result?: BatchDeleteResult;
    transportStatus?: number;
  } | null;
}

export const initialRootBatchState: RootBatchState = {
  selectedById: {},
  userEmail: null,
  loadedIds: [],
  listRequestId: null,
  listLoading: false,
  removedIds: [],
  confirmation: null,
  operation: null,
};

let requestSequence = 0;
export const newBatchRequestId = () => `batch-${++requestSequence}`;
export const isBatchBusy = (state: RootBatchState) => state.operation?.status === 'submitting';
