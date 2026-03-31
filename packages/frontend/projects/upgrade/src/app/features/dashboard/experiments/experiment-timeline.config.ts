import { LOG_TYPE } from 'upgrade_types';
import { SHARED_LIST_OPERATION_MESSAGE_MAP } from '../global-logs/shared-logs.config';
import { AuditLogTimelineConfig } from '../../../shared-standalone-component-lib/components/common-audit-log-timeline/common-audit-log-timeline-config.model';

/** CREATED/UPDATED/DELETED messages for the experiment-level view (entity name implicit from context). */
export const EXPERIMENT_ENTITY_LOG_TYPE_MESSAGE_MAP: Record<string, string> = {
  [LOG_TYPE.EXPERIMENT_CREATED]: 'logs.experiment-level.audit-log-experiment-created.text',
  [LOG_TYPE.EXPERIMENT_UPDATED]: 'logs.experiment-level.audit-log-experiment-updated.text',
  [LOG_TYPE.EXPERIMENT_DELETED]: 'logs.experiment-level.audit-log-experiment-deleted.text',
};

/** Log type messages shared between global and entity-level views (same i18n key in both). */
export const EXPERIMENT_SHARED_LOG_TYPE_MESSAGE_MAP: Record<string, string> = {
  [LOG_TYPE.EXPERIMENT_DATA_EXPORTED]: 'logs.experiment-level.audit-log-experiment-data-exported.text',
  [LOG_TYPE.EXPERIMENT_DESIGN_EXPORTED]: 'logs.experiment-level.audit-log-experiment-design-exported.text',
  [LOG_TYPE.EXPERIMENT_STATE_CHANGED]: 'logs.experiment-level.audit-log-experiment-state-changed.text',
};

export const EXPERIMENT_LOG_TYPE_DISPLAY_LABEL_MAP: Record<string, string> = {
  [LOG_TYPE.EXPERIMENT_CREATED]: 'Experiment Created',
  [LOG_TYPE.EXPERIMENT_UPDATED]: 'Experiment Updated',
  [LOG_TYPE.EXPERIMENT_DELETED]: 'Experiment Deleted',
  [LOG_TYPE.EXPERIMENT_STATE_CHANGED]: 'Experiment State Changed',
  [LOG_TYPE.EXPERIMENT_DATA_EXPORTED]: 'Experiment Data Exported',
  [LOG_TYPE.EXPERIMENT_DESIGN_EXPORTED]: 'Experiment Design Exported',
};

export const EXPERIMENT_SIMPLE_LOG_TYPES: LOG_TYPE[] = [
  LOG_TYPE.EXPERIMENT_DELETED,
  LOG_TYPE.EXPERIMENT_DATA_EXPORTED,
  LOG_TYPE.EXPERIMENT_DESIGN_EXPORTED,
];

export const EXPERIMENT_STATE_CHANGE_OR_CREATED_TYPES: LOG_TYPE[] = [
  LOG_TYPE.EXPERIMENT_STATE_CHANGED,
  LOG_TYPE.EXPERIMENT_CREATED,
];

export const EXPERIMENT_UPDATE_LOG_TYPES: LOG_TYPE[] = [LOG_TYPE.EXPERIMENT_UPDATED];

export const EXPERIMENT_TIMELINE_LOG_TYPE_CONFIG: AuditLogTimelineConfig = {
  logTypeMessageMap: {
    ...EXPERIMENT_ENTITY_LOG_TYPE_MESSAGE_MAP,
    ...EXPERIMENT_SHARED_LOG_TYPE_MESSAGE_MAP,
  },

  logTypeDisplayLabelMap: { ...EXPERIMENT_LOG_TYPE_DISPLAY_LABEL_MAP },

  listOperationMessageMap: { ...SHARED_LIST_OPERATION_MESSAGE_MAP },

  isSimpleLogType: (type) => EXPERIMENT_SIMPLE_LOG_TYPES.includes(type as LOG_TYPE),

  isStateChangeOrCreated: (type) => EXPERIMENT_STATE_CHANGE_OR_CREATED_TYPES.includes(type as LOG_TYPE),

  hasListOperation: (logData) => !!logData?.list,

  isUpdateLogType: (type) => EXPERIMENT_UPDATE_LOG_TYPES.includes(type as LOG_TYPE),
};
