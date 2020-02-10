import { Pipe, PipeTransform } from '@angular/core';
import { EXPERIMENT_LOG_TYPE } from 'ees_types';

@Pipe({
  name: 'experimentActionMessage'
})
export class ExperimentActionMessage implements PipeTransform {
  transform(actionType: EXPERIMENT_LOG_TYPE): string {
    switch (actionType) {
      case EXPERIMENT_LOG_TYPE.EXPERIMENT_CREATED:
        return 'audit.log-experiment-created.text';
      case EXPERIMENT_LOG_TYPE.EXPERIMENT_DELETED:
        return 'audit.log-experiment-deleted.text';
      case EXPERIMENT_LOG_TYPE.EXPERIMENT_STATE_CHANGED:
        return 'audit.log-experiment-state-changed.text';
      case EXPERIMENT_LOG_TYPE.EXPERIMENT_UPDATED:
        return 'audit.log-experiment-updated.text';
    }
  }
}
