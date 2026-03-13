import { AuditLogTimelineConfig } from '../common-audit-log-timeline-config.model';
import { LOG_TYPE, FEATURE_FLAG_LIST_OPERATION } from 'upgrade_types';

/**
 * Feature flag-specific configuration for the audit log timeline component.
 */
export const FEATURE_FLAG_TIMELINE_LOG_TYPE_CONFIG: AuditLogTimelineConfig = {
  logTypeMessageMap: {
    [LOG_TYPE.FEATURE_FLAG_CREATED]: 'logs.audit-log-feature-flag-created.text',
    [LOG_TYPE.FEATURE_FLAG_DELETED]: 'logs.audit-log-feature-flag-deleted.text',
    [LOG_TYPE.FEATURE_FLAG_STATUS_CHANGED]: 'logs.audit-log-feature-flag-state-changed.text',
    [LOG_TYPE.FEATURE_FLAG_UPDATED]: 'logs.audit-log-feature-flag-updated.text',
    [LOG_TYPE.FEATURE_FLAG_DATA_EXPORTED]: 'logs.audit-log-feature-flag-data-exported.text',
    [LOG_TYPE.FEATURE_FLAG_DESIGN_EXPORTED]: 'logs.audit-log-feature-flag-design-exported.text',
  },

  listOperationMessageMap: {
    [FEATURE_FLAG_LIST_OPERATION.CREATED]: 'logs.audit-log-list-created.text',
    [FEATURE_FLAG_LIST_OPERATION.DELETED]: 'logs.audit-log-list-deleted.text',
    [FEATURE_FLAG_LIST_OPERATION.UPDATED]: 'logs.audit-log-list-updated.text',
  },

  isSimpleLogType: (type: string): boolean => {
    return [
      LOG_TYPE.FEATURE_FLAG_DELETED,
      LOG_TYPE.FEATURE_FLAG_DATA_EXPORTED,
      LOG_TYPE.FEATURE_FLAG_DESIGN_EXPORTED,
    ].includes(type as LOG_TYPE);
  },

  isStateChangeOrCreated: (type: string): boolean => {
    return type === LOG_TYPE.FEATURE_FLAG_STATUS_CHANGED || type === LOG_TYPE.FEATURE_FLAG_CREATED;
  },

  hasListOperation: (logData: any): boolean => {
    return !!logData?.list;
  },

  isUpdateLogType: (type: string): boolean => {
    return type === LOG_TYPE.FEATURE_FLAG_UPDATED;
  },
};
