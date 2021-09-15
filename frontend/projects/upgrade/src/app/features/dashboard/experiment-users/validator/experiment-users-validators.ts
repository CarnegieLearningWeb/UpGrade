import { AbstractControl } from '@angular/forms';
import { EntityTypes } from '../../../../core/experiment-users/store/experiment-users.model';

export class ExperimentUserValidators {
  static validateExcludedEntityForm(controls: AbstractControl) {
    const entityValue = controls.get('entityType').value;
    const groupValue = controls.get('groupType').value;
  }
}
