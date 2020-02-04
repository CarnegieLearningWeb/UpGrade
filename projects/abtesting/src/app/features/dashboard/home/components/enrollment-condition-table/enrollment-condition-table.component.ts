import { Component, ChangeDetectionStrategy, Input, OnChanges, SimpleChanges } from '@angular/core';
import { EnrollmentByConditionData } from '../../../../../core/experiments/store/experiments.model';

@Component({
  selector: 'home-enrollment-condition-table',
  templateUrl: './enrollment-condition-table.component.html',
  styleUrls: ['./enrollment-condition-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EnrollmentConditionTableComponent implements OnChanges {

  // TODO: Update interface type any to ExperimentVM
  @Input() experiment: any;
  displayedColumns: string[] = ['condition', 'weight', 'usersEnrolled', 'userExcluded', 'classesEnrolled', 'classesExcluded'];
  enrollmentConditionData: EnrollmentByConditionData[] = [];

  ngOnChanges(changes: SimpleChanges) {
    if (changes.experiment) {
      this.enrollmentConditionData = [];
      this.experiment.stat.conditions.forEach(condition => {

        // TODO: Remained userExcluded and classesExcluded data
        this.enrollmentConditionData.push({
          condition: this.getConditionData(condition.id, 'conditionCode'),
          weight: this.getConditionData(condition.id, 'assignmentWeight'),
          userEnrolled: condition.user,
          userExcluded: 0,
          classesEnrolled: condition.group,
          classesExcluded: 0
        });
      });
    }
  }

  getConditionData(conditionId: string,  key: string) {
    return this.experiment.conditions.reduce((acc, condition) =>
      condition.id === conditionId ? acc = condition[key] : acc
    , null);
  }
}
