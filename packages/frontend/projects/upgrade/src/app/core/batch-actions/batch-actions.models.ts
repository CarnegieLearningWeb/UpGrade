import { BatchDeleteResult, DeletionEligibilityItem, UserRole } from 'upgrade_types';

export type RootSelectionItem = Pick<DeletionEligibilityItem, 'id' | 'name' | 'stateOrStatus' | 'segmentType'> & {
  availability?: DeletionEligibilityItem['availability'];
  reasonCode?: DeletionEligibilityItem['reasonCode'];
};

export interface BatchDeleteSnapshot {
  operationId: string;
  revision: number;
  items: RootSelectionItem[];
  notShownCount: number;
}

export interface RootBatchState {
  selectedById: Record<string, RootSelectionItem>;
  revision: number;
  userEmail: string | null;
  role: UserRole | null;
  loadedIds: string[];
  listRequestId: string | null;
  listLoading: boolean;
  listRefreshFailed: boolean;
  removedIds: string[];
  eligibility: {
    status: 'idle' | 'checking' | 'ready' | 'failed';
    requestId?: string;
    revision?: number;
    forConfirmation?: boolean;
    allDeletable?: boolean;
    absentIds?: string[];
  };
  confirmation: BatchDeleteSnapshot | null;
  operation: {
    snapshot: BatchDeleteSnapshot;
    status: 'submitting' | 'reconciling' | 'complete';
    result?: BatchDeleteResult;
    transportStatus?: number;
    reconciledAbsentIds: string[];
    reconciliationFailed?: boolean;
  } | null;
}

export const initialRootBatchState: RootBatchState = {
  selectedById: {},
  revision: 0,
  userEmail: null,
  role: null,
  loadedIds: [],
  listRequestId: null,
  listLoading: false,
  listRefreshFailed: false,
  removedIds: [],
  eligibility: { status: 'idle' },
  confirmation: null,
  operation: null,
};

let requestSequence = 0;
export const newBatchRequestId = () => `batch-${++requestSequence}`;
export const isBatchBusy = (state: RootBatchState) =>
  state.operation?.status === 'submitting' || state.operation?.status === 'reconciling';
