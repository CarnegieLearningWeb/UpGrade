import { AbstractControl } from '@angular/forms';
import { GroupTypes } from '../../../../core/experiments/store/experiments.model';
import { EntityTypes } from '../../../../core/experiment-users/store/experiment-users.model';

export class ExperimentUserValidators {
  static validateExcludedEntityForm(controls: AbstractControl): { [key: string]: any } | null {
    const entityValue = controls.get('entityType').value;
    const groupValue = controls.get('groupType').value;
    const customGroupValue = controls.get('customGroupName').value;
    if (groupValue === GroupTypes.OTHER && entityValue === EntityTypes.GROUP_ID) {
      return !!customGroupValue ? null : { customGroupNameError: true };
    }
    return null;
  }

  static validatePreviewUserGroupForm(controls: AbstractControl): { [key: string]: any } | null {
    const groupValue = controls.get('groupType').value;
    const customGroupValue = controls.get('customGroupName').value;
    if (groupValue === GroupTypes.OTHER) {
      return !!customGroupValue ? null : { customGroupNameError: true };
    }
    return null;
  }

  static validatePreviewUserForm(controls: AbstractControl): { [key: string]: any } | null {
    const userGroups = controls.get('userGroups').value;
    if (userGroups.length) {
      const otherGroupTypeList = userGroups.filter(group => group.groupType === GroupTypes.OTHER);
      if (otherGroupTypeList.length) {
        const set = new Set();
        otherGroupTypeList.forEach(group => {
          set.add(group.customGroupName);
        });
        return set.size === otherGroupTypeList.length ? null : { customGroupNameError: true }
      }
    }
    return null;
  }
}
