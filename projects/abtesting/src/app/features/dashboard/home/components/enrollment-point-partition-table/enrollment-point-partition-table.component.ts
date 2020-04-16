import { Component, ChangeDetectionStrategy, OnChanges, Input, SimpleChanges } from '@angular/core';
import { EnrollmentByConditionData, ExperimentVM, ASSIGNMENT_UNIT } from '../../../../../core/experiments/store/experiments.model';

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
  // displayedColumns: string[] = [
  //   'experimentPoint',
  //   'experimentPartition',
  //   'condition',
  //   'weight',
  //   'usersEnrolled',
  //   'userExcluded',
  //   'classesEnrolled',
  //   'classesExcluded'
  // ];
  columns = [];
  displayedColumns = [];
  commonColumns = [
    { name: 'experimentPoint', header: 'EXPERIMENT POINT' },
    { name: 'experimentPartition', header: 'ID' },
    { name: 'condition', header: 'CONDITION' },
    { name: 'weight', header: 'WEIGHT' },
    { name: 'userEnrolled', header: 'USERS ENROLLED' },
    { name: 'userExcluded', header: 'USERS EXCLUDED' },
  ];
  enrollmentPointPartitionData: EnrollmentByPointPartitionData[] = [];

  setColumns(columnNames) {
    this.columns = [];
    columnNames.forEach(column => {
      this.columns.push(
        { columnDef: `${column.name}`, header: `${column.header}`,    cell: (element) => `${element[`${column.name}`]}` },
      );
    });
    this.displayedColumns = this.columns.map(x => x.columnDef);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.experiment.assignmentUnit === ASSIGNMENT_UNIT.INDIVIDUAL) {
      const columns = this.commonColumns;
      this.setColumns(columns);
    } else {
      const columns = [
        ...this.commonColumns,
        { name: 'classesEnrolled', header: 'GROUP ENROLLED' },
        { name: 'classesExcluded', header: 'GROUP EXCLUDED' },
      ];
      this.setColumns(columns);
    }
    if (changes.experiment) {
      this.enrollmentPointPartitionData = [];
      this.experiment.stat.partitions.forEach(partition => {

        partition.conditions.forEach(condition => {

          // TODO: Remained userExcluded and classesExcluded data
          this.enrollmentPointPartitionData.push({
            experimentPoint: this.getPartitionData(partition.id, 'point'),
            experimentPartition: this.getPartitionData(partition.id, 'name') || '',
            condition: this.getConditionData(condition.id, 'conditionCode'),
            weight: this.getConditionData(condition.id, 'assignmentWeight'),
            userEnrolled: condition.user,
            userExcluded: this.experiment.stat.userExcluded,
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

  get assignmentUnit() {
    return ASSIGNMENT_UNIT;
  }
}
