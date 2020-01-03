import { Component, ChangeDetectionStrategy, OnChanges, Input, SimpleChanges } from '@angular/core';
import { Experiment, EnrollmentByConditionData } from '../../../../core/experiments/store/experiments.model';

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

  @Input() experiment: Experiment;
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
      this.experiment.segments.forEach(segment => {

        // TODO: Replace by actual data
        // Creating random values for dummy data
        this.enrollmentPointSegmentData.push({
          experimentPoint: segment.point,
          experimentSegment: segment.name,
          condition: 'A',
          weight: (Math.random() * 40 + 10).toFixed(5) as any,
          userEnrolled: parseInt((Math.random() * 40 + 10).toFixed(5), 10),
          userExcluded: parseInt((Math.random() * 40 + 10).toFixed(5), 10),
          classesEnrolled: parseInt((Math.random() * 40 + 10).toFixed(5), 10),
          classesExcluded: parseInt((Math.random() * 40 + 10).toFixed(5), 10)
        });
      });
    }
  }

}
