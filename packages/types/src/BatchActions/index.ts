import { EXPERIMENT_STATE, FEATURE_FLAG_STATUS, SEGMENT_STATUS, SEGMENT_TYPE } from '../Experiment/enums';

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
}

export interface DeletionEligibilityItem {
  id: string;
  availability: 'present' | 'not_found' | 'unavailable';
  name?: string;
  stateOrStatus?: EXPERIMENT_STATE | FEATURE_FLAG_STATUS | SEGMENT_STATUS;
  segmentType?: SEGMENT_TYPE;
  canDelete: boolean;
  reasonCode?: DeletionReasonCode;
}

export interface DeletionEligibilityResult {
  items: DeletionEligibilityItem[];
  allDeletable: boolean;
}

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
