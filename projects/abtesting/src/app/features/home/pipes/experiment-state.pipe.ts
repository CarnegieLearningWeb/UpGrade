import { Pipe, PipeTransform } from '@angular/core';
import { EXPERIMENT_STATE } from '../../../core/experiments/store/experiments.model';

export enum ExperimentStatePipeType {
  TEXT = 'text',
  COLOR = 'color'
}

@Pipe({
  name: 'experimentState'
})
export class ExperimentStatePipe implements PipeTransform {
  transform(experimentState: EXPERIMENT_STATE, type: ExperimentStatePipeType = ExperimentStatePipeType.TEXT): any {
    switch (experimentState) {
      case EXPERIMENT_STATE.PREVIEW:
        return type === ExperimentStatePipeType.TEXT ? 'Preview' : '#000';
      case EXPERIMENT_STATE.SCHEDULED:
        return type === ExperimentStatePipeType.TEXT ? 'Scheduled' : '#000';
      case EXPERIMENT_STATE.INACTIVE:
        return type === ExperimentStatePipeType.TEXT ? 'Inactive' : '#8F9BB3';
      case EXPERIMENT_STATE.ENROLLMENT_COMPLETE:
        return type === ExperimentStatePipeType.TEXT ? 'Enrollment Complete' : '#00B383';
      case EXPERIMENT_STATE.ENROLLING:
        return type === ExperimentStatePipeType.TEXT ? 'Enrolling' : '#3366FF';
      case EXPERIMENT_STATE.CANCELLED:
        return type === ExperimentStatePipeType.TEXT ? 'Cancelled' : '#ff0000';
    }
  }
}
