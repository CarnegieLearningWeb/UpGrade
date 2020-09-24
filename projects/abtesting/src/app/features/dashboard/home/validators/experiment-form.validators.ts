import { AbstractControl } from '@angular/forms';
import {
  POST_EXPERIMENT_RULE,
  EXPERIMENT_STATE
} from '../../../../core/experiments/store/experiments.model';

export class ExperimentFormValidators {

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

  static validatePostExperimentRuleForm(controls: AbstractControl): { [key: string]: any } | null {
    const postExperimentRule = controls.get('postExperimentRule').value;
    const revertTo = controls.get('revertTo').value;
    if (postExperimentRule === POST_EXPERIMENT_RULE.ASSIGN && !revertTo) {
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
