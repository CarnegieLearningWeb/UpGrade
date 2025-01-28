import { Pipe, PipeTransform } from '@angular/core';
import { FEATURE_FLAG_LIST_OPERATION } from 'upgrade_types';

@Pipe({
    name: 'featureFlagListOperationsMessage',
    standalone: false
})
export class FeatureFlagListOperationsMessage implements PipeTransform {
  transform(actionType: FEATURE_FLAG_LIST_OPERATION): string {
    switch (actionType) {
      case FEATURE_FLAG_LIST_OPERATION.CREATED:
        return 'logs.audit-log-feature-flag-updated-list-created.text';
      case FEATURE_FLAG_LIST_OPERATION.DELETED:
        return 'logs.audit-log-feature-flag-updated-list-deleted.text';
      case FEATURE_FLAG_LIST_OPERATION.STATUS_CHANGED:
        return 'logs.audit-log-feature-flag-updated-list-state-changed.text';
      case FEATURE_FLAG_LIST_OPERATION.UPDATED:
        return 'logs.audit-log-feature-flag-updated-list-updated.text';
    }
  }
}
