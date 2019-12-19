import { Pipe, PipeTransform } from '@angular/core';
import { EXPERIMENT_STATE } from '../../../core/experiments/store/experiments.model';

@Pipe({
  name: 'experimentStateColor'
})
export class ExperimentStateColorPipe implements PipeTransform {
  transform(experimentState: EXPERIMENT_STATE): any {
    switch (experimentState) {
      case EXPERIMENT_STATE.INACTIVE:
        return '#8F9BB3';
      case EXPERIMENT_STATE.ENROLLMENT_COMPLETE:
        return '#00B383';
      case EXPERIMENT_STATE.ENROLLING:
        return '#3366FF';
      case EXPERIMENT_STATE.CANCELLED:
        return '#ff0000';
      default:
        return '#000';
    }
  }
}
