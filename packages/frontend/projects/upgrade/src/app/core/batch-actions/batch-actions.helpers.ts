import {
  BatchDeleteEntity,
  BatchDeleteResult,
  DeletionEligibilityResult,
  DeletionReasonCode,
  EXPERIMENT_STATE,
  FEATURE_FLAG_STATUS,
  SEGMENT_STATUS,
  SEGMENT_TYPE,
  getExperimentDeletionReason,
  getFlagDeletionReason,
  hasBatchDeletePermission,
} from 'upgrade_types';
import { RootBatchState, RootSelectionItem, isBatchBusy } from './batch-actions.models';

export function selectionItem(row: {
  id?: string;
  name?: string;
  state?: EXPERIMENT_STATE;
  status?: FEATURE_FLAG_STATUS | SEGMENT_STATUS;
  type?: SEGMENT_TYPE;
}): RootSelectionItem {
  return { id: row.id, name: row.name, stateOrStatus: row.state || row.status, segmentType: row.type };
}

export function localDeletionReason(
  entity: BatchDeleteEntity,
  item: RootSelectionItem,
  role: RootBatchState['role']
): DeletionReasonCode | undefined {
  if (!hasBatchDeletePermission(role, entity)) return DeletionReasonCode.MISSING_PERMISSION;
  if (item.availability === 'not_found') return DeletionReasonCode.NOT_FOUND;
  if (item.availability === 'unavailable') return item.reasonCode || DeletionReasonCode.ELIGIBILITY_UNAVAILABLE;
  if (item.reasonCode) return item.reasonCode;
  if (entity === 'experiments') return getExperimentDeletionReason(item.stateOrStatus as EXPERIMENT_STATE);
  if (entity === 'flags') return getFlagDeletionReason(item.stateOrStatus as FEATURE_FLAG_STATUS);
  if (item.segmentType !== SEGMENT_TYPE.PUBLIC) return DeletionReasonCode.PROTECTED_SEGMENT_TYPE;
  return item.stateOrStatus === SEGMENT_STATUS.UNUSED
    ? undefined
    : item.stateOrStatus === SEGMENT_STATUS.USED
    ? DeletionReasonCode.SEGMENT_IN_USE
    : DeletionReasonCode.ELIGIBILITY_UNAVAILABLE;
}

export function selectionView(state: RootBatchState, entity: BatchDeleteEntity) {
  const items = Object.values(state.selectedById);
  const loaded = new Set(state.loadedIds);
  const checked = loaded.size > 0 && [...loaded].every((id) => !!state.selectedById[id]);
  const reasons = items.map((item) => localDeletionReason(entity, item, state.role)).filter(Boolean);
  return {
    items,
    selectedCount: items.length,
    checked,
    indeterminate: items.length > 0 && !checked,
    notShownCount: items.filter((item) => !loaded.has(item.id)).length,
    canToggleHeader: !isBatchBusy(state) && (items.length > 0 || (!state.listLoading && loaded.size > 0)),
    canRequestConfirmation: items.length > 0 && !reasons.length && !isBatchBusy(state),
    reasonCode: reasons[0],
    checking: state.eligibility.status === 'checking',
    busy: isBatchBusy(state),
  };
}

export const confirmedRemovedIds = (result?: BatchDeleteResult) =>
  result?.results.filter((item) => item.outcome === 'deleted' || item.outcome === 'not_found').map((item) => item.id) ||
  [];

export function validateEligibilityResponse(
  result: DeletionEligibilityResult,
  ids: string[]
): DeletionEligibilityResult {
  if (
    !result ||
    !Array.isArray(result.items) ||
    result.items.length !== ids.length ||
    new Set(result.items.map((item) => item.id)).size !== ids.length ||
    ids.some((id) => !result.items.some((item) => item.id === id)) ||
    result.items.some(
      (item) =>
        !['present', 'not_found', 'unavailable'].includes(item.availability) || typeof item.canDelete !== 'boolean'
    )
  ) {
    throw new Error('Incomplete deletion eligibility response');
  }
  return {
    ...result,
    allDeletable:
      result.items.length > 0 && result.items.every((item) => item.availability === 'present' && item.canDelete),
  };
}

export function validateBatchResponse(result: BatchDeleteResult, ids: string[]): BatchDeleteResult {
  const outcomes = ['deleted', 'not_found', 'ineligible', 'forbidden', 'failed', 'unknown', 'not_attempted'];
  if (
    !result ||
    !['rejected', 'executed'].includes(result.phase) ||
    !Array.isArray(result.results) ||
    result.results.length !== ids.length ||
    new Set(result.results.map((item) => item.id)).size !== ids.length ||
    ids.some((id) => !result.results.some((item) => item.id === id)) ||
    result.results.some((item) => !outcomes.includes(item.outcome))
  ) {
    throw new Error('Incomplete batch deletion response');
  }
  return result;
}

export function batchResultCounts(state: RootBatchState) {
  const results = state.operation?.result?.results || [];
  const absent = new Set([
    ...results.filter((item) => item.outcome === 'not_found').map((item) => item.id),
    ...(state.operation?.reconciledAbsentIds || []),
  ]);
  return {
    deleted: results.filter((item) => item.outcome === 'deleted').length,
    absent: absent.size,
    remaining: Object.keys(state.selectedById).length,
    uncertain: results.some((item) => item.outcome === 'unknown') || !!state.operation?.reconciliationFailed,
    failed: results.filter((item) => ['failed', 'ineligible', 'forbidden'].includes(item.outcome)).length,
    notAttempted: results.filter((item) => item.outcome === 'not_attempted').length,
    hasErrors: results.some((item) => item.outcome !== 'deleted' || item.reasonCode),
  };
}
