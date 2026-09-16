import {
  BatchDeleteEntity,
  BatchDeleteResult,
  DeletionReasonCode,
  EXPERIMENT_STATE,
  EXPERIMENT_STATE_DISPLAY_NAME_OVERRIDES,
  FEATURE_FLAG_STATUS,
  SEGMENT_STATUS,
} from 'upgrade_types';
import { BatchSelectionReasonCode, RootBatchState, RootSelectionItem, isBatchBusy } from './batch-actions.models';

export function selectionItem(row: {
  id?: string;
  name?: string;
  state?: EXPERIMENT_STATE;
  status?: FEATURE_FLAG_STATUS | SEGMENT_STATUS;
}): RootSelectionItem {
  return { id: row.id, name: row.name, stateOrStatus: row.state || row.status };
}

export function getExperimentDeletionReason(state?: EXPERIMENT_STATE): BatchSelectionReasonCode | undefined {
  const displayState = EXPERIMENT_STATE_DISPLAY_NAME_OVERRIDES[state] || state;
  return [
    EXPERIMENT_STATE.DRAFT,
    EXPERIMENT_STATE.INACTIVE,
    EXPERIMENT_STATE.COMPLETED,
    EXPERIMENT_STATE.ARCHIVED,
  ].includes(displayState)
    ? undefined
    : BatchSelectionReasonCode.EXPERIMENT_ACTIVE;
}

export function localDeletionReason(
  entity: BatchDeleteEntity,
  item: RootSelectionItem
): BatchSelectionReasonCode | undefined {
  if (entity === 'experiments') return getExperimentDeletionReason(item.stateOrStatus as EXPERIMENT_STATE);
  if (entity === 'flags')
    return item.stateOrStatus === FEATURE_FLAG_STATUS.ENABLED
      ? BatchSelectionReasonCode.FEATURE_FLAG_ENABLED
      : undefined;
  return item.stateOrStatus === SEGMENT_STATUS.USED ? BatchSelectionReasonCode.SEGMENT_USED : undefined;
}

export function selectionView(state: RootBatchState, entity: BatchDeleteEntity) {
  const items = Object.values(state.selectedById);
  const loaded = new Set(state.loadedIds);
  const checked = loaded.size > 0 && [...loaded].every((id) => !!state.selectedById[id]);
  const reasons = items.map((item) => localDeletionReason(entity, item)).filter(Boolean);
  return {
    items,
    selectedCount: items.length,
    checked,
    indeterminate: items.length > 0 && !checked,
    canToggleHeader: !isBatchBusy(state) && (items.length > 0 || loaded.size > 0),
    canRequestConfirmation: items.length > 0 && !reasons.length && !isBatchBusy(state),
    reasonCode: reasons[0],
    busy: isBatchBusy(state),
  };
}

export const confirmedRemovedIds = (result?: BatchDeleteResult) =>
  result?.results.filter((item) => item.outcome === 'deleted' || item.outcome === 'not_found').map((item) => item.id) ||
  [];

export function validateBatchResponse(result: BatchDeleteResult, ids: string[]): BatchDeleteResult {
  const outcomes = ['deleted', 'not_found', 'failed', 'unknown', 'not_attempted'];
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
  return {
    deleted: results.filter((item) => item.outcome === 'deleted').length,
    absent: results.filter((item) => item.outcome === 'not_found').length,
    uncertain: results.some((item) => item.outcome === 'unknown'),
    failed: results.filter((item) => item.outcome === 'failed').length,
    notAttempted: results.filter((item) => item.outcome === 'not_attempted').length,
    hasErrors: results.some((item) => item.outcome !== 'deleted' || item.reasonCode),
    postDeleteFailed: results.some((item) => item.reasonCode === DeletionReasonCode.POST_DELETE_FAILED),
  };
}

/** One existing snackbar, with only the counts that apply to this result. */
export function batchResultMessage(
  entity: BatchDeleteEntity,
  counts: ReturnType<typeof batchResultCounts>,
  translate: (key: string, params?: Record<string, number>) => string
): string {
  const parts: string[] = [];
  if (counts.deleted || !counts.hasErrors)
    parts.push(
      translate(`batch-delete.success.${entity}.${counts.deleted === 1 ? 'one' : 'other'}`, { deleted: counts.deleted })
    );
  for (const key of ['absent', 'failed', 'notAttempted'] as const) {
    if (counts[key])
      parts.push(
        translate(`batch-delete.result.${key}.${counts[key] === 1 ? 'one' : 'other'}`, { count: counts[key] })
      );
  }
  if (counts.postDeleteFailed) parts.push(translate('batch-delete.result.post-delete-failed'));
  if (counts.uncertain) parts.push(translate('batch-delete.result.uncertain'));
  return parts.join(' ');
}
