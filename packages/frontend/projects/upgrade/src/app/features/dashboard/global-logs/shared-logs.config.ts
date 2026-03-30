import { EXPERIMENT_LIST_OPERATION } from 'upgrade_types';

/**
 * List operation messages for CREATED/UPDATED/DELETED.
 * Both EXPERIMENT_LIST_OPERATION and FEATURE_FLAG_LIST_OPERATION share the same string values
 * for these three operations, so this map covers both entity types.
 */
export const SHARED_LIST_OPERATION_MESSAGE_MAP: Record<string, string> = {
  [EXPERIMENT_LIST_OPERATION.CREATED]: 'logs.audit-log-list-created.text',
  [EXPERIMENT_LIST_OPERATION.DELETED]: 'logs.audit-log-list-deleted.text',
  [EXPERIMENT_LIST_OPERATION.UPDATED]: 'logs.audit-log-list-updated.text',
};
