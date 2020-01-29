import { Component, ChangeDetectionStrategy, OnChanges, Input, SimpleChanges } from '@angular/core';
import { EnrollmentByConditionData, ExperimentVM } from '../../../../core/experiments/store/experiments.model';

// Used in EnrollmentPointPartitionTableComponent only
interface EnrollmentByPointPartitionData extends EnrollmentByConditionData {
  experimentPoint: string;
  experimentPartition: string;
}


@Component({
  selector: 'home-enrollment-point-partition-table',
  templateUrl: './enrollment-point-partition-table.component.html',
  styleUrls: ['./enrollment-point-partition-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EnrollmentPointPartitionTableComponent implements OnChanges {

  @Input() experiment: ExperimentVM;
  displayedColumns: string[] = [
    'experimentPoint',
    'experimentPartition',
    'condition',
    'weight',
    'usersEnrolled',
    'userExcluded',
    'classesEnrolled',
    'classesExcluded'
  ];
  enrollmentPointPartitionData: EnrollmentByPointPartitionData[] = [];

  ngOnChanges(changes: SimpleChanges) {
    if (changes.experiment) {
      this.enrollmentPointPartitionData = [];
      this.experiment.stat.partitions.forEach(partition => {

        partition.conditions.forEach(condition => {

          // TODO: Remained userExcluded and classesExcluded data
          this.enrollmentPointPartitionData.push({
            experimentPoint: this.getPartitionData(partition.id, 'point'),
            experimentPartition: this.getPartitionData(partition.id, 'name'),
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

  getPartitionData(partitionId: string,  key: string) {
    return this.experiment.partitions.reduce((acc, partition) =>
      partition.id === partitionId ? acc = partition[key] : acc
    , null);
  }
}
