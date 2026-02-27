import { Pipe, PipeTransform } from '@angular/core';
import { EXPERIMENT_LIST_OPERATION, FEATURE_FLAG_LIST_OPERATION } from 'upgrade_types';

/**
 * Pipe to transform list operation types into human-readable messages.
 * Standalone version adapted from the logs module.
 */
@Pipe({
  name: 'listOperationMessage',
  standalone: true,
})
export class ListOperationMessagePipe implements PipeTransform {
  transform(actionType: FEATURE_FLAG_LIST_OPERATION | EXPERIMENT_LIST_OPERATION): string {
    switch (actionType) {
      case EXPERIMENT_LIST_OPERATION.CREATED:
      case FEATURE_FLAG_LIST_OPERATION.CREATED:
        return 'logs.audit-log-list-created.text';
      case EXPERIMENT_LIST_OPERATION.DELETED:
      case FEATURE_FLAG_LIST_OPERATION.DELETED:
        return 'logs.audit-log-list-deleted.text';
      case FEATURE_FLAG_LIST_OPERATION.STATUS_CHANGED:
        return 'logs.audit-log-feature-flag-updated-list-state-changed.text';
      case EXPERIMENT_LIST_OPERATION.UPDATED:
      case FEATURE_FLAG_LIST_OPERATION.UPDATED:
        return 'logs.audit-log-list-updated.text';
      default:
        return actionType;
    }
  }
}
