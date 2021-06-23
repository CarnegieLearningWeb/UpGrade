import { AbstractControl } from '@angular/forms';
import { EntityTypes } from '../../../../core/experiment-users/store/experiment-users.model';

export class ExperimentUserValidators {
  static validateExcludedEntityForm(controls: AbstractControl): { [key: string]: any } | null {
    const entityValue = controls.get('entityType').value;
    const groupValue = controls.get('groupType').value;
    const customGroupValue = controls.get('customGroupName').value;
    const groupTypeOther = 'other';
    if (groupValue === groupTypeOther && entityValue === EntityTypes.GROUP_ID) {
      return !!customGroupValue ? null : { customGroupNameError: true };
    }
    return null;
  }
}
