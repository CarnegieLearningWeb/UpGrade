import { AbstractControl } from '@angular/forms';
import { GroupTypes } from '../../../../core/experiments/store/experiments.model';

export class ExperimentUserValidators {

  static validateExcludedEntityForm(controls: AbstractControl): { [key: string]: any } | null {
    const groupValue = controls.get('groupType').value;
    const customGroupValue = controls.get('customGroupName').value;
    if (groupValue === GroupTypes.OTHER) {
      return !!customGroupValue ? null : { customGroupNameError: true };
    }
    return null;
  }
}
