import {
  EXPERIMENT_STATE,
  EXPERIMENT_STATE_DISPLAY_NAME_OVERRIDES,
  FEATURE_FLAG_STATUS,
  UserRole,
} from '../Experiment/enums';

export interface BatchEntityIdsRequest {
  ids: string[];
}

export enum DeletionReasonCode {
  NOT_FOUND = 'not_found',
  MISSING_PERMISSION = 'missing_permission',
  EXPERIMENT_STATE_UNSUPPORTED = 'experiment_state_unsupported',
  FEATURE_FLAG_ENABLED = 'feature_flag_enabled',
  FEATURE_FLAG_STATUS_UNSUPPORTED = 'feature_flag_status_unsupported',
  SEGMENT_IN_USE = 'segment_in_use',
  PROTECTED_SEGMENT_TYPE = 'protected_segment_type',
  ELIGIBILITY_UNAVAILABLE = 'eligibility_unavailable',
  DELETE_FAILED = 'delete_failed',
  LOCK_TIMEOUT = 'lock_timeout',
  EXTERNAL_SYNC_FAILED = 'external_sync_failed',
  OUTCOME_UNKNOWN = 'outcome_unknown',
  POST_DELETE_FAILED = 'post_delete_failed',
  BATCH_BUDGET_EXCEEDED = 'batch_budget_exceeded',
}

export type BatchDeleteEntity = 'experiments' | 'flags' | 'segments';

export type BatchDeleteRequest = BatchEntityIdsRequest;

export type BatchDeleteItemOutcome =
  | 'deleted'
  | 'not_found'
  | 'ineligible'
  | 'forbidden'
  | 'failed'
  | 'unknown'
  | 'not_attempted';

export interface BatchDeleteItemResult {
  id: string;
  outcome: BatchDeleteItemOutcome;
  reasonCode?: DeletionReasonCode;
}

export interface BatchDeleteResult {
  phase: 'rejected' | 'executed';
  results: BatchDeleteItemResult[];
}

export function hasBatchDeletePermission(role: UserRole, entity: BatchDeleteEntity): boolean {
  return (
    role === UserRole.ADMIN || role === UserRole.CREATOR || (entity === 'segments' && role === UserRole.USER_MANAGER)
  );
}

function getExperimentDeletionState(state: EXPERIMENT_STATE): EXPERIMENT_STATE {
  return EXPERIMENT_STATE_DISPLAY_NAME_OVERRIDES[state] || state;
}

export function getExperimentDeletionReason(state: EXPERIMENT_STATE): DeletionReasonCode | undefined {
  return [
    EXPERIMENT_STATE.INACTIVE,
    EXPERIMENT_STATE.RUNNING,
    EXPERIMENT_STATE.PAUSED,
    EXPERIMENT_STATE.COMPLETED,
    EXPERIMENT_STATE.ARCHIVED,
  ].includes(getExperimentDeletionState(state))
    ? undefined
    : DeletionReasonCode.EXPERIMENT_STATE_UNSUPPORTED;
}

export function getFlagDeletionReason(status: FEATURE_FLAG_STATUS): DeletionReasonCode | undefined {
  return status === FEATURE_FLAG_STATUS.ENABLED
    ? DeletionReasonCode.FEATURE_FLAG_ENABLED
    : [FEATURE_FLAG_STATUS.DISABLED, FEATURE_FLAG_STATUS.ARCHIVED].includes(status)
    ? undefined
    : DeletionReasonCode.FEATURE_FLAG_STATUS_UNSUPPORTED;
}
