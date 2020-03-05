import { AbstractControl } from '@angular/forms';
import {
  EndExperimentCondition,
  GroupTypes,
  ASSIGNMENT_UNIT,
  POST_EXPERIMENT_RULE,
  EXPERIMENT_STATE
} from '../../../../core/experiments/store/experiments.model';

export class ExperimentFormValidators {
  static validateExperimentOverviewForm(controls: AbstractControl): { [key: string]: any } | null {
    const groupValue = controls.get('groupType').value;
    const customGroupValue = controls.get('customGroupName').value;
    const assignmentUnit = controls.get('unitOfAssignment').value;
    if (groupValue === GroupTypes.OTHER) {
      return !!customGroupValue ? null : { customGroupNameError: true };
    }
    return assignmentUnit === ASSIGNMENT_UNIT.GROUP && !groupValue ? { groupValueError: true } : null;
  }

  static validateExperimentDesignForm(controls: AbstractControl): { [key: string]: any } | null {
    const conditions = controls.get('conditions').value;
    const partitions = controls.get('partitions').value;
    if (conditions.length < 2) {
      return { conditionCountError: true };
    } else if (conditions.length >= 2) {
      let sumOfAssignmentWeights = 0;
      conditions.forEach(condition => (sumOfAssignmentWeights += parseInt(condition.assignmentWeight, 10)));
      return sumOfAssignmentWeights !== 100 ? { assignmentWightsSumError: true } : null;
    }
    if (partitions.length < 1) {
      return { partitionCountError: true };
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
      if (
        (endCondition === EndExperimentCondition.END_ON_DATE && !!dateOfExperimentEnd) ||
        (endCondition === EndExperimentCondition.END_CRITERIA && (!!userCount || !!groupCount))
      ) {
        return null;
      } else {
        return { formValidationError: true };
      }
    }
    return null;
  }

  static validatePostExperimentRuleForm(controls: AbstractControl): { [key: string]: any } | null {
    const postExperimentRule = controls.get('postExperimentRule').value;
    const revertTo = controls.get('revertTo').value;
    if (postExperimentRule === POST_EXPERIMENT_RULE.REVERT && !revertTo) {
      return { conditionSelectionError: true };
    }
    return null;
  }

  static validateExperimentStatusForm(controls: AbstractControl): { [key: string]: any } | null {
    const newStatusValue = controls.get('newStatus').value;
    const scheduleDate = controls.get('scheduleDate').value;
    if (newStatusValue.value === EXPERIMENT_STATE.SCHEDULED && !scheduleDate) {
      return { scheduleDateError: true };
    }
    return null;
  }
}
