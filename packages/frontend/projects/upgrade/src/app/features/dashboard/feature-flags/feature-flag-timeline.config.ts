import { LOG_TYPE, FEATURE_FLAG_LIST_OPERATION } from 'upgrade_types';
import { AuditLogTimelineConfig } from '../../../shared-standalone-component-lib/components/common-audit-log-timeline/common-audit-log-timeline-config.model';
import { SHARED_LIST_OPERATION_MESSAGE_MAP } from '../global-logs/shared-logs.config';

/** CREATED/UPDATED/DELETED messages for the feature-flag-level view (entity name implicit from context). */
export const FEATURE_FLAG_ENTITY_LOG_TYPE_MESSAGE_MAP: Record<string, string> = {
  [LOG_TYPE.FEATURE_FLAG_CREATED]: 'logs.feature-flag-level.audit-log-feature-flag-created.text',
  [LOG_TYPE.FEATURE_FLAG_UPDATED]: 'logs.feature-flag-level.audit-log-feature-flag-updated.text',
  [LOG_TYPE.FEATURE_FLAG_DELETED]: 'logs.feature-flag-level.audit-log-feature-flag-deleted.text',
};

/** Log type messages shared between global and entity-level views (same i18n key in both). */
export const FEATURE_FLAG_SHARED_LOG_TYPE_MESSAGE_MAP: Record<string, string> = {
  [LOG_TYPE.FEATURE_FLAG_DATA_EXPORTED]: 'logs.feature-flag-level.audit-log-feature-flag-data-exported.text',
  [LOG_TYPE.FEATURE_FLAG_DESIGN_EXPORTED]: 'logs.feature-flag-level.audit-log-feature-flag-design-exported.text',
  [LOG_TYPE.FEATURE_FLAG_STATUS_CHANGED]: 'logs.feature-flag-level.audit-log-feature-flag-state-changed.text',
};

/** Feature-flag-specific list operation message (STATUS_CHANGED has no experiment equivalent). */
export const FEATURE_FLAG_STATUS_CHANGED_LIST_OPERATION_MESSAGE_MAP: Record<string, string> = {
  [FEATURE_FLAG_LIST_OPERATION.STATUS_CHANGED]: 'logs.audit-log-feature-flag-updated-list-state-changed.text',
};

export const FEATURE_FLAG_LOG_TYPE_DISPLAY_LABEL_MAP: Record<string, string> = {
  [LOG_TYPE.FEATURE_FLAG_CREATED]: 'Feature Flag Created',
  [LOG_TYPE.FEATURE_FLAG_UPDATED]: 'Feature Flag Updated',
  [LOG_TYPE.FEATURE_FLAG_DELETED]: 'Feature Flag Deleted',
  [LOG_TYPE.FEATURE_FLAG_STATUS_CHANGED]: 'Feature Flag Status Changed',
  [LOG_TYPE.FEATURE_FLAG_DATA_EXPORTED]: 'Feature Flag Data Exported',
  [LOG_TYPE.FEATURE_FLAG_DESIGN_EXPORTED]: 'Feature Flag Design Exported',
};

export const FEATURE_FLAG_SIMPLE_LOG_TYPES: LOG_TYPE[] = [
  LOG_TYPE.FEATURE_FLAG_DELETED,
  LOG_TYPE.FEATURE_FLAG_DATA_EXPORTED,
  LOG_TYPE.FEATURE_FLAG_DESIGN_EXPORTED,
];

export const FEATURE_FLAG_STATE_CHANGE_OR_CREATED_TYPES: LOG_TYPE[] = [
  LOG_TYPE.FEATURE_FLAG_STATUS_CHANGED,
  LOG_TYPE.FEATURE_FLAG_CREATED,
];

export const FEATURE_FLAG_UPDATE_LOG_TYPES: LOG_TYPE[] = [LOG_TYPE.FEATURE_FLAG_UPDATED];

export const FEATURE_FLAG_TIMELINE_LOG_TYPE_CONFIG: AuditLogTimelineConfig = {
  logTypeMessageMap: {
    ...FEATURE_FLAG_ENTITY_LOG_TYPE_MESSAGE_MAP,
    ...FEATURE_FLAG_SHARED_LOG_TYPE_MESSAGE_MAP,
  },

  logTypeDisplayLabelMap: { ...FEATURE_FLAG_LOG_TYPE_DISPLAY_LABEL_MAP },

  listOperationMessageMap: {
    ...SHARED_LIST_OPERATION_MESSAGE_MAP,
    ...FEATURE_FLAG_STATUS_CHANGED_LIST_OPERATION_MESSAGE_MAP,
  },

  isSimpleLogType: (type) => FEATURE_FLAG_SIMPLE_LOG_TYPES.includes(type as LOG_TYPE),

  isStateChangeOrCreated: (type) => FEATURE_FLAG_STATE_CHANGE_OR_CREATED_TYPES.includes(type as LOG_TYPE),

  hasListOperation: (logData) => !!logData?.list,

  isFilterModeUpdate: (logData) => !logData?.diff && !logData?.list && !!logData?.filterMode,

  isUpdateLogType: (type) => FEATURE_FLAG_UPDATE_LOG_TYPES.includes(type as LOG_TYPE),
};
