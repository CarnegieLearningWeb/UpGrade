import { Component, ChangeDetectionStrategy, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Experiment } from '../../../../core/experiments/store/experiments.model';

// Used in EnrollmentConditionTableComponent only
interface EnrollmentByConditionData {
  condition: string;
  weight: number;
  userEnrolled: number;
  userExcluded: number;
  classesEnrolled: number;
  classesExcluded: number;
}

@Component({
  selector: 'home-enrollment-condition-table',
  templateUrl: './enrollment-condition-table.component.html',
  styleUrls: ['./enrollment-condition-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EnrollmentConditionTableComponent implements OnChanges {

  @Input() experiment: Experiment;
  displayedColumns: string[] = ['condition', 'weight', 'usersEnrolled', 'userExcluded', 'classesEnrolled', 'classesExcluded'];
  enrollmentConditionData: EnrollmentByConditionData[] = [];

  ngOnChanges(changes: SimpleChanges) {
    if (changes.experiment) {
      this.enrollmentConditionData = [];
      this.experiment.conditions.forEach(condition => {

        // TODO: Replace by actual data
        // Creating random values for dummy data
        this.enrollmentConditionData.push({
          condition: condition.conditionCode,
          weight: condition.assignmentWeight,
          userEnrolled: parseInt((Math.random() * 40 + 10).toFixed(5), 10),
          userExcluded: parseInt((Math.random() * 40 + 10).toFixed(5), 10),
          classesEnrolled: parseInt((Math.random() * 40 + 10).toFixed(5), 10),
          classesExcluded: parseInt((Math.random() * 40 + 10).toFixed(5), 10)
        });
      });
    }
  }
}
