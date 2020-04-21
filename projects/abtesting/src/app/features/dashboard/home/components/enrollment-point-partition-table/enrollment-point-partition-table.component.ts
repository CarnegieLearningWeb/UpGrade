import { Component, ChangeDetectionStrategy, OnChanges, Input, SimpleChanges, OnDestroy } from '@angular/core';
import { EnrollmentByConditionData, ExperimentVM, ASSIGNMENT_UNIT } from '../../../../../core/experiments/store/experiments.model';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

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
export class EnrollmentPointPartitionTableComponent implements OnChanges, OnDestroy {

  @Input() experiment: ExperimentVM;
  columns = []; // Used to create dynamic columns
  displayedColumns = [];
  commonColumns = [];
  enrollmentPointPartitionData: EnrollmentByPointPartitionData[] = [];

  // For translation strings
  translatedStrings = [];
  translateSub: Subscription;

  constructor(
    private translate: TranslateService
  ) {
    this.translateSub = this.translate.get([
      'home.view-experiment-global.experiment-point.text',
      'home.view-experiment-global.experiment-partition.text',
      'global.condition.text',
      'home.view-experiment.global.weight.text',
      'home.view-experiment.global.users-enrolled.text',
      'home.view-experiment.global.users-excluded.text',
      'home.view-experiment.global.group-enrolled.text',
      'home.view-experiment.global.group-excluded.text'
    ]).subscribe(arrayValues => {
        this.translatedStrings = [
          arrayValues['home.view-experiment-global.experiment-point.text'],
          arrayValues['home.view-experiment-global.experiment-partition.text'],
          arrayValues['global.condition.text'],
          arrayValues['home.view-experiment.global.weight.text'],
          arrayValues['home.view-experiment.global.users-enrolled.text'],
          arrayValues['home.view-experiment.global.users-excluded.text'],
          arrayValues['home.view-experiment.global.group-enrolled.text'],
          arrayValues['home.view-experiment.global.group-excluded.text'],
        ];
        this.commonColumns = [
          { name: 'experimentPoint', header: this.translatedStrings[0] },
          { name: 'experimentPartition', header: this.translatedStrings[1] },
          { name: 'condition', header: this.translatedStrings[2] },
          { name: 'weight', header: this.translatedStrings[3] },
          { name: 'userEnrolled', header: this.translatedStrings[4] },
          { name: 'userExcluded', header: this.translatedStrings[5] },
        ];
    })
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.experiment.assignmentUnit === ASSIGNMENT_UNIT.INDIVIDUAL) {
      const columns = this.commonColumns;
      this.setColumns(columns);
    } else {
      const columns = [
        ...this.commonColumns,
        { name: 'groupEnrolled', header: this.translatedStrings[6] },
        { name: 'groupExcluded', header: this.translatedStrings[7] },
      ];
      this.setColumns(columns);
    }
    if (changes.experiment) {
      this.enrollmentPointPartitionData = [];
      this.experiment.stat.partitions.forEach(partition => {

        partition.conditions.forEach(condition => {

          this.enrollmentPointPartitionData.push({
            experimentPoint: this.getPartitionData(partition.id, 'expPoint'),
            experimentPartition: this.getPartitionData(partition.id, 'expId') || '',
            condition: this.getConditionData(condition.id, 'conditionCode'),
            weight: this.getConditionData(condition.id, 'assignmentWeight'),
            userEnrolled: condition.user,
            userExcluded: this.experiment.stat.userExcluded,
            groupEnrolled: condition.group,
            groupExcluded: this.experiment.stat.groupExcluded
          });
        });
        });
    }
  }

  setColumns(columnNames) {
    this.columns = [];
    columnNames.forEach(column => {
      this.columns.push(
        { columnDef: `${column.name}`, header: `${column.header}`,    cell: (element) => `${element[`${column.name}`]}` },
      );
    });
    this.displayedColumns = this.columns.map(x => x.columnDef);
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

  ngOnDestroy() {
    this.translateSub.unsubscribe();
  }
}
