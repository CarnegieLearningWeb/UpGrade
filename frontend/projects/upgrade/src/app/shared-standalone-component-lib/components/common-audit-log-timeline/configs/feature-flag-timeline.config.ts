import { AuditLogTimelineConfig } from '../common-audit-log-timeline-config.model';
import { LOG_TYPE } from 'upgrade_types';

/**
 * Feature flag-specific configuration for the audit log timeline component.
 *
 * NOTE: This is a placeholder configuration for when feature flag logs are implemented.
 * To use this config, integrate it with a FeatureFlagLogSectionCardComponent that:
 * 1. Fetches feature flag logs from the backend
 * 2. Groups logs by date
 * 3. Passes this config to CommonAuditLogTimelineComponent
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

  // Feature flags use segment lists instead of experiment lists
  // Adjust this if/when feature flag list operations are supported
  listOperationMessageMap: undefined,

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
    // Feature flags may have segment list operations - adjust based on actual data structure
    return !!logData?.list;
  },

  isUpdateLogType: (type: string): boolean => {
    return type === LOG_TYPE.FEATURE_FLAG_UPDATED;
  },
};
