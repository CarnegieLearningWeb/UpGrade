import { Pipe, PipeTransform } from '@angular/core';
import { LOG_TYPE } from 'upgrade_types';

/**
 * Pipe to transform log types into human-readable messages for experiment-specific logs.
 * Simplified version that removes redundant experiment name references since we're already viewing that experiment.
 */
@Pipe({
  name: 'experimentLogMessage',
  standalone: true,
})
export class ExperimentLogMessagePipe implements PipeTransform {
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
      default:
        return actionType;
    }
  }
}
