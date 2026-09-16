import {
  BatchDeleteResult,
  EXPERIMENT_STATE,
  FEATURE_FLAG_STATUS,
  SEGMENT_STATUS,
  SEGMENT_TYPE,
  UserRole,
} from 'upgrade_types';

export enum BatchSelectionReasonCode {
  MISSING_PERMISSION = 'missing_permission',
  FEATURE_FLAG_ENABLED = 'feature_flag_enabled',
  FEATURE_FLAG_STATUS_UNSUPPORTED = 'feature_flag_status_unsupported',
  SEGMENT_IN_USE = 'segment_in_use',
  PROTECTED_SEGMENT_TYPE = 'protected_segment_type',
  ELIGIBILITY_UNAVAILABLE = 'eligibility_unavailable',
}

export interface RootSelectionItem {
  id: string;
  name?: string;
  stateOrStatus?: EXPERIMENT_STATE | FEATURE_FLAG_STATUS | SEGMENT_STATUS;
  segmentType?: SEGMENT_TYPE;
}

export interface BatchDeleteSnapshot {
  operationId: string;
  items: RootSelectionItem[];
}

export interface RootBatchState {
  selectedById: Record<string, RootSelectionItem>;
  userEmail: string | null;
  role: UserRole | null;
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
  role: null,
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
