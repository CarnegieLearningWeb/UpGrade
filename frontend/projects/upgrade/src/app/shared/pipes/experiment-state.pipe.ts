import { Pipe, PipeTransform } from '@angular/core';
import { EXPERIMENT_STATE } from '../../core/experiments/store/experiments.model';
import { FEATURE_FLAG_STATUS } from 'upgrade_types';

export enum ExperimentStatePipeType {
  TEXT = 'text',
  COLOR = 'color',
}

@Pipe({
  name: 'experimentState',
})
export class ExperimentStatePipe implements PipeTransform {
  transform(
    experimentState: EXPERIMENT_STATE | FEATURE_FLAG_STATUS,
    type: ExperimentStatePipeType = ExperimentStatePipeType.TEXT
  ): any {
    switch (experimentState) {
      case EXPERIMENT_STATE.PREVIEW:
        return type === ExperimentStatePipeType.TEXT ? 'Preview' : '#000';
      case EXPERIMENT_STATE.SCHEDULED:
        return type === ExperimentStatePipeType.TEXT ? 'Scheduled' : '#000';
      case EXPERIMENT_STATE.INACTIVE:
        return type === ExperimentStatePipeType.TEXT ? 'Inactive' : '#d8d8d8';
      case EXPERIMENT_STATE.ENROLLMENT_COMPLETE:
        return type === ExperimentStatePipeType.TEXT ? 'Enrollment Complete' : '#0cdda5';
      case EXPERIMENT_STATE.ENROLLING:
        return type === ExperimentStatePipeType.TEXT ? 'Enrolling' : '#7b9cff';
      case EXPERIMENT_STATE.CANCELLED:
        return type === ExperimentStatePipeType.TEXT ? 'Cancelled' : '#ff0000';
      case EXPERIMENT_STATE.ARCHIVED:
        return type === ExperimentStatePipeType.TEXT ? 'Archived' : '#fd9099';
      case FEATURE_FLAG_STATUS.ENABLED:
        return type === ExperimentStatePipeType.TEXT ? 'Enabled' : '#7b9cff';
      case FEATURE_FLAG_STATUS.DISABLED:
        return type === ExperimentStatePipeType.TEXT ? 'Disabled' : '#fd9099';
    }
  }
}
