import { Component, ChangeDetectionStrategy, OnChanges, Input, forwardRef } from '@angular/core';
import { ExperimentVM, ASSIGNMENT_UNIT } from '../../../../../../../../../core/experiments/store/experiments.model';
import { EnrollmentConditionExpandableRowComponent } from '../enrollment-condition-expandable-row/enrollment-condition-expandable-row.component';

@Component({
  selector: 'app-enrollment-point-partition-table',
  templateUrl: './enrollment-point-partition-table.component.html',
  styleUrls: ['./enrollment-point-partition-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [forwardRef(() => EnrollmentConditionExpandableRowComponent)],
})
export class EnrollmentPointPartitionTableComponent implements OnChanges {
  @Input() partitionData: any[];
  @Input() experiment: ExperimentVM;
  commonColumns = ['expandIcon', 'experimentPoint', 'experimentId', 'userEnrolled'];
  displayedColumns: string[] = [];

  ngOnChanges() {
    if (this.experiment.assignmentUnit === ASSIGNMENT_UNIT.INDIVIDUAL) {
      this.displayedColumns = this.commonColumns;
    } else {
      this.displayedColumns = [...this.commonColumns, 'groupEnrolled'];
    }
  }
}
