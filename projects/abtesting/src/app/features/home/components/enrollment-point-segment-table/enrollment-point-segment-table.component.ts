import { Component, ChangeDetectionStrategy, OnChanges, Input, SimpleChanges } from '@angular/core';
import { EnrollmentByConditionData, ExperimentVM } from '../../../../core/experiments/store/experiments.model';

// Used in EnrollmentPointSegmentTableComponent only
interface EnrollmentByPointSegmentData extends EnrollmentByConditionData {
  experimentPoint: string;
  experimentSegment: string;
}


@Component({
  selector: 'home-enrollment-point-segment-table',
  templateUrl: './enrollment-point-segment-table.component.html',
  styleUrls: ['./enrollment-point-segment-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EnrollmentPointSegmentTableComponent implements OnChanges {

  @Input() experiment: ExperimentVM;
  displayedColumns: string[] = [
    'experimentPoint',
    'experimentSegment',
    'condition',
    'weight',
    'usersEnrolled',
    'userExcluded',
    'classesEnrolled',
    'classesExcluded'
  ];
  enrollmentPointSegmentData: EnrollmentByPointSegmentData[] = [];

  ngOnChanges(changes: SimpleChanges) {
    if (changes.experiment) {
      this.enrollmentPointSegmentData = [];
      this.experiment.stat.segments.forEach(segment => {

        segment.conditions.forEach(condition => {

          // TODO: Remained userExcluded and classesExcluded data
          this.enrollmentPointSegmentData.push({
            experimentPoint: this.getSegmentData(segment.id, 'point'),
            experimentSegment: this.getSegmentData(segment.id, 'name'),
            condition: this.getConditionData(condition.id, 'conditionCode'),
            weight: this.getConditionData(condition.id, 'assignmentWeight'),
            userEnrolled: condition.user,
            userExcluded: 0,
            classesEnrolled: condition.group,
            classesExcluded: 0
          });
        });
        });
    }
  }

  getConditionData(conditionId: string,  key: string) {
    return this.experiment.conditions.reduce((acc, condition) =>
      condition.id === conditionId ? acc = condition[key] : acc
    , null);
  }

  getSegmentData(segmentId: string,  key: string) {
    return this.experiment.segments.reduce((acc, segment) =>
      segment.id === segmentId ? acc = segment[key] : acc
    , null);
  }
}
