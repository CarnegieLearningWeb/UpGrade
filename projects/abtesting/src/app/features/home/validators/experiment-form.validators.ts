import { AbstractControl } from '@angular/forms';
import { EndExperimentCondition, GroupTypes } from '../../../core/experiments/store/experiments.model';

export class ExperimentFormValidators {

  static validateExperimentOverviewForm(controls: AbstractControl): { [key: string]: any } | null {
    const groupValue = controls.get('groupType').value;
    const customGroupValue = controls.get('customGroupName').value;
    if (groupValue === GroupTypes.OTHER) {
      return !!customGroupValue ? { customGroupNameError: false } : { customGroupNameError: true };
    }
    return null;
  }

  static validateExperimentDesignForm(controls: AbstractControl): { [key: string]: any } | null {
    const conditions = controls.get('conditions').value;
    const segments = controls.get('segments').value;
    if (conditions.length < 2) {
      return { conditionCountError: true }
    } else if (segments.length < 1) {
      return { segmentCountError: true }
    }
    return null;
  }

  static validateScheduleForm(controls: AbstractControl): { [key: string]: any } | null {
    const endExperimentAutomatically = controls.get('endExperimentAutomatically').value;
    const endCondition = controls.get('endCondition').value;
    const dateOfExperimentEnd = controls.get('dateOfExperimentEnd').value;
    const userCount = controls.get('userCount').value;
    const groupCount = controls.get('groupCount').value;
    if (endExperimentAutomatically && !!endCondition) {
      if ((endCondition === EndExperimentCondition.END_ON_DATE && !!dateOfExperimentEnd) ||
        (endCondition === EndExperimentCondition.END_CRITERIA && (!!userCount || !!groupCount))) {
        return null;
      } else {
        return { formValidationError: true };
      }
    }
    return null;
  }
}
