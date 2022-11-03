import { Pipe, PipeTransform } from '@angular/core';
import { EXPERIMENT_LOG_TYPE } from 'upgrade_types';

@Pipe({
  name: 'experimentActionMessage',
})
export class ExperimentActionMessage implements PipeTransform {
  transform(actionType: EXPERIMENT_LOG_TYPE): string {
    switch (actionType) {
      case EXPERIMENT_LOG_TYPE.EXPERIMENT_CREATED:
        return 'logs.audit-log-experiment-created.text';
      case EXPERIMENT_LOG_TYPE.EXPERIMENT_DELETED:
        return 'logs.audit-log-experiment-deleted.text';
      case EXPERIMENT_LOG_TYPE.EXPERIMENT_STATE_CHANGED:
        return 'logs.audit-log-experiment-state-changed.text';
      case EXPERIMENT_LOG_TYPE.EXPERIMENT_UPDATED:
        return 'logs.audit-log-experiment-updated.text';
      case EXPERIMENT_LOG_TYPE.EXPERIMENT_DATA_EXPORTED:
        return 'logs.audit-log-experiment-data-exported.text';
      case EXPERIMENT_LOG_TYPE.EXPERIMENT_DATA_REQUESTED:
        return 'logs.audit-log-experiment-data-requested.text';
      case EXPERIMENT_LOG_TYPE.EXPERIMENT_DESIGN_EXPORTED:
        return 'logs.audit-log-experiment-design-exported.text';
    }
  }
}
