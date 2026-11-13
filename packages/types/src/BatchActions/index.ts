import { EXPERIMENT_STATE } from '../Experiment/enums';

export interface BatchEntityIdsRequest {
  ids: string[];
}

export enum DeletionReasonCode {
  NOT_FOUND = 'not_found',
  DELETE_FAILED = 'delete_failed',
  LOCK_TIMEOUT = 'lock_timeout',
  OUTCOME_UNKNOWN = 'outcome_unknown',
  POST_DELETE_FAILED = 'post_delete_failed',
  // Policy refusals: the target exists but its current state or usage does not allow deletion.
  STATE_NOT_DELETABLE = 'state_not_deletable',
  SEGMENT_IN_USE = 'segment_in_use',
  GLOBAL_EXCLUDE_PROTECTED = 'global_exclude_protected',
}

export type BatchDeleteEntity = 'experiments' | 'flags' | 'segments';

export type BatchDeleteItemOutcome = 'deleted' | 'not_found' | 'refused' | 'failed' | 'unknown' | 'not_attempted';

/**
 * Stored experiment states that allow deletion: Draft, Inactive, Completed (stored as Cancelled) and Archived.
 * Running, Paused, Preview and Scheduled experiments are not deletable.
 */
export const DELETABLE_EXPERIMENT_STATES: EXPERIMENT_STATE[] = [
  EXPERIMENT_STATE.DRAFT,
  EXPERIMENT_STATE.INACTIVE,
  EXPERIMENT_STATE.COMPLETED,
  EXPERIMENT_STATE.CANCELLED,
  EXPERIMENT_STATE.ARCHIVED,
];

export interface BatchDeleteItemResult {
  id: string;
  outcome: BatchDeleteItemOutcome;
  reasonCode?: DeletionReasonCode;
}

export interface BatchDeleteResult {
  results: BatchDeleteItemResult[];
}
