export interface BatchEntityIdsRequest {
  ids: string[];
}

export enum DeletionReasonCode {
  NOT_FOUND = 'not_found',
  DELETE_FAILED = 'delete_failed',
  LOCK_TIMEOUT = 'lock_timeout',
  EXTERNAL_SYNC_FAILED = 'external_sync_failed',
  OUTCOME_UNKNOWN = 'outcome_unknown',
  POST_DELETE_FAILED = 'post_delete_failed',
}

export type BatchDeleteEntity = 'experiments' | 'flags' | 'segments';

export type BatchDeleteItemOutcome = 'deleted' | 'not_found' | 'failed' | 'unknown' | 'not_attempted';

export interface BatchDeleteItemResult {
  id: string;
  outcome: BatchDeleteItemOutcome;
  reasonCode?: DeletionReasonCode;
}

export interface BatchDeleteResult {
  phase: 'rejected' | 'executed';
  results: BatchDeleteItemResult[];
}
