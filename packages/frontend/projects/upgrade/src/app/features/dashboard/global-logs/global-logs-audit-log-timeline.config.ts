import { LOG_TYPE } from 'upgrade_types';
import { AuditLogTimelineConfig } from '../../../shared-standalone-component-lib/components/common-audit-log-timeline/common-audit-log-timeline-config.model';
import {
  EXPERIMENT_LOG_TYPE_DISPLAY_LABEL_MAP,
  EXPERIMENT_SHARED_LOG_TYPE_MESSAGE_MAP,
  EXPERIMENT_SIMPLE_LOG_TYPES,
  EXPERIMENT_STATE_CHANGE_OR_CREATED_TYPES,
  EXPERIMENT_UPDATE_LOG_TYPES,
} from '../experiments/experiment-timeline.config';
import {
  FEATURE_FLAG_LOG_TYPE_DISPLAY_LABEL_MAP,
  FEATURE_FLAG_SHARED_LOG_TYPE_MESSAGE_MAP,
  FEATURE_FLAG_SIMPLE_LOG_TYPES,
  FEATURE_FLAG_STATE_CHANGE_OR_CREATED_TYPES,
  FEATURE_FLAG_STATUS_CHANGED_LIST_OPERATION_MESSAGE_MAP,
  FEATURE_FLAG_UPDATE_LOG_TYPES,
} from '../feature-flags/feature-flag-timeline.config';
import { SHARED_LIST_OPERATION_MESSAGE_MAP } from './shared-logs.config';

const EXPERIMENT_GLOBAL_LOG_TYPE_MESSAGE_MAP: Record<string, string> = {
  [LOG_TYPE.EXPERIMENT_CREATED]: 'logs.audit-log-experiment-created.text',
  [LOG_TYPE.EXPERIMENT_UPDATED]: 'logs.audit-log-experiment-updated.text',
  [LOG_TYPE.EXPERIMENT_DELETED]: 'logs.audit-log-experiment-deleted.text',
};

const FEATURE_FLAG_GLOBAL_LOG_TYPE_MESSAGE_MAP: Record<string, string> = {
  [LOG_TYPE.FEATURE_FLAG_CREATED]: 'logs.audit-log-feature-flag-created.text',
  [LOG_TYPE.FEATURE_FLAG_UPDATED]: 'logs.audit-log-feature-flag-updated.text',
  [LOG_TYPE.FEATURE_FLAG_DELETED]: 'logs.audit-log-feature-flag-deleted.text',
};

/**
 * Global audit log timeline configuration covering all entity types.
 * Uses global-level i18n keys for CREATED/UPDATED/DELETED (include entity type in message),
 * and shared entity-level keys for STATE_CHANGED/DATA_EXPORTED/DESIGN_EXPORTED.
 */
export const GLOBAL_AUDIT_LOG_TIMELINE_CONFIG: AuditLogTimelineConfig = {
  logTypeMessageMap: {
    ...EXPERIMENT_GLOBAL_LOG_TYPE_MESSAGE_MAP,
    ...EXPERIMENT_SHARED_LOG_TYPE_MESSAGE_MAP,
    ...FEATURE_FLAG_GLOBAL_LOG_TYPE_MESSAGE_MAP,
    ...FEATURE_FLAG_SHARED_LOG_TYPE_MESSAGE_MAP,
  },

  logTypeDisplayLabelMap: {
    ...EXPERIMENT_LOG_TYPE_DISPLAY_LABEL_MAP,
    ...FEATURE_FLAG_LOG_TYPE_DISPLAY_LABEL_MAP,
  },

  listOperationMessageMap: {
    ...SHARED_LIST_OPERATION_MESSAGE_MAP,
    ...FEATURE_FLAG_STATUS_CHANGED_LIST_OPERATION_MESSAGE_MAP,
  },

  isSimpleLogType: (type) =>
    [...EXPERIMENT_SIMPLE_LOG_TYPES, ...FEATURE_FLAG_SIMPLE_LOG_TYPES].includes(type as LOG_TYPE),

  isStateChangeOrCreated: (type) =>
    [...EXPERIMENT_STATE_CHANGE_OR_CREATED_TYPES, ...FEATURE_FLAG_STATE_CHANGE_OR_CREATED_TYPES].includes(
      type as LOG_TYPE
    ),

  hasListOperation: (logData) => !!logData?.list,

  isFilterModeUpdate: (logData) => !logData?.diff && !logData?.list && !!logData?.filterMode,

  isUpdateLogType: (type) =>
    [...EXPERIMENT_UPDATE_LOG_TYPES, ...FEATURE_FLAG_UPDATE_LOG_TYPES].includes(type as LOG_TYPE),

  getEntityName: (logData) => logData?.experimentName || logData?.flagName || null,

  getEntityLink: (logData) => {
    if (logData?.experimentId && logData?.isExperimentExist) {
      return ['/home', 'detail', logData.experimentId];
    }
    if (logData?.flagId && logData?.isFlagExist) {
      return ['/featureflags', 'detail', logData.flagId];
    }
    return null;
  },
};
