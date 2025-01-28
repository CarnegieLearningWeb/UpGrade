import { Pipe, PipeTransform } from '@angular/core';
import { LOG_TYPE } from 'upgrade_types';

@Pipe({
    name: 'experimentActionMessage',
    standalone: false
})
export class ExperimentActionMessage implements PipeTransform {
  transform(actionType: LOG_TYPE): string {
    switch (actionType) {
      case LOG_TYPE.EXPERIMENT_CREATED:
        return 'logs.audit-log-experiment-created.text';
      case LOG_TYPE.EXPERIMENT_DELETED:
        return 'logs.audit-log-experiment-deleted.text';
      case LOG_TYPE.EXPERIMENT_STATE_CHANGED:
        return 'logs.audit-log-experiment-state-changed.text';
      case LOG_TYPE.EXPERIMENT_UPDATED:
        return 'logs.audit-log-experiment-updated.text';
      case LOG_TYPE.EXPERIMENT_DATA_EXPORTED:
        return 'logs.audit-log-experiment-data-exported.text';
      case LOG_TYPE.EXPERIMENT_DESIGN_EXPORTED:
        return 'logs.audit-log-experiment-design-exported.text';
      case LOG_TYPE.FEATURE_FLAG_CREATED:
        return 'logs.audit-log-feature-flag-created.text';
      case LOG_TYPE.FEATURE_FLAG_DELETED:
        return 'logs.audit-log-feature-flag-deleted.text';
      case LOG_TYPE.FEATURE_FLAG_STATUS_CHANGED:
        return 'logs.audit-log-feature-flag-state-changed.text';
      case LOG_TYPE.FEATURE_FLAG_UPDATED:
        return 'logs.audit-log-feature-flag-updated.text';
      case LOG_TYPE.FEATURE_FLAG_DATA_EXPORTED:
        return 'logs.audit-log-feature-flag-data-exported.text';
      case LOG_TYPE.FEATURE_FLAG_DESIGN_EXPORTED:
        return 'logs.audit-log-feature-flag-design-exported.text';
    }
  }
}
