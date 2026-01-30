import { Pipe, PipeTransform } from '@angular/core';
import { EXPERIMENT_LIST_OPERATION, FEATURE_FLAG_LIST_OPERATION } from 'upgrade_types';

@Pipe({
  name: 'listOperationsMessage',
  standalone: false,
})
export class ListOperationsMessage implements PipeTransform {
  transform(actionType: FEATURE_FLAG_LIST_OPERATION | EXPERIMENT_LIST_OPERATION): string {
    switch (actionType) {
      case FEATURE_FLAG_LIST_OPERATION.CREATED:
        return 'logs.audit-log-list-created.text';
      case FEATURE_FLAG_LIST_OPERATION.DELETED:
        return 'logs.audit-log-list-deleted.text';
      case FEATURE_FLAG_LIST_OPERATION.STATUS_CHANGED:
        return 'logs.audit-log-feature-flag-updated-list-state-changed.text';
      case FEATURE_FLAG_LIST_OPERATION.UPDATED:
        return 'logs.audit-log-list-updated.text';
    }
  }
}
