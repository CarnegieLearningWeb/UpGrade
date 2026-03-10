import { AuditLogTimelineConfig } from '../common-audit-log-timeline-config.model';
import { LOG_TYPE, EXPERIMENT_LIST_OPERATION } from 'upgrade_types';

/**
 * Experiment-specific configuration for the audit log timeline component.
 * Contains message maps and behavior functions for displaying experiment logs.
 */
export const EXPERIMENT_TIMELINE_LOG_TYPE_CONFIG: AuditLogTimelineConfig = {
  logTypeMessageMap: {
    [LOG_TYPE.EXPERIMENT_CREATED]: 'logs.audit-log-experiment-created.text',
    [LOG_TYPE.EXPERIMENT_DELETED]: 'logs.audit-log-experiment-deleted.text',
    [LOG_TYPE.EXPERIMENT_STATE_CHANGED]: 'logs.audit-log-experiment-state-changed.text',
    [LOG_TYPE.EXPERIMENT_UPDATED]: 'logs.audit-log-experiment-updated.text',
    [LOG_TYPE.EXPERIMENT_DATA_EXPORTED]: 'logs.audit-log-experiment-data-exported.text',
    [LOG_TYPE.EXPERIMENT_DESIGN_EXPORTED]: 'logs.audit-log-experiment-design-exported.text',
  },

  listOperationMessageMap: {
    [EXPERIMENT_LIST_OPERATION.CREATED]: 'logs.audit-log-list-created.text',
    [EXPERIMENT_LIST_OPERATION.DELETED]: 'logs.audit-log-list-deleted.text',
    [EXPERIMENT_LIST_OPERATION.UPDATED]: 'logs.audit-log-list-updated.text',
  },

  isSimpleLogType: (type: string): boolean => {
    return [
      LOG_TYPE.EXPERIMENT_DELETED,
      LOG_TYPE.EXPERIMENT_DATA_EXPORTED,
      LOG_TYPE.EXPERIMENT_DESIGN_EXPORTED,
    ].includes(type as LOG_TYPE);
  },

  isStateChangeOrCreated: (type: string): boolean => {
    return type === LOG_TYPE.EXPERIMENT_STATE_CHANGED || type === LOG_TYPE.EXPERIMENT_CREATED;
  },

  hasListOperation: (logData: any): boolean => {
    return !!logData?.list;
  },

  isUpdateLogType: (type: string): boolean => {
    return type === LOG_TYPE.EXPERIMENT_UPDATED;
  },
};
