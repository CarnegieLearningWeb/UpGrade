import { Component, ChangeDetectionStrategy, Input, OnChanges, SimpleChanges } from '@angular/core';
import { EnrollmentByConditionData, ASSIGNMENT_UNIT } from '../../../../../core/experiments/store/experiments.model';

@Component({
  selector: 'home-enrollment-condition-table',
  templateUrl: './enrollment-condition-table.component.html',
  styleUrls: ['./enrollment-condition-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EnrollmentConditionTableComponent implements OnChanges {

  // TODO: Update interface type any to ExperimentVM
  @Input() experiment: any;
  // displayedColumns: string[] = ['condition', 'weight', 'usersEnrolled', 'userExcluded', 'classesEnrolled', 'classesExcluded'];
  columns = [];
  enrollmentConditionData: EnrollmentByConditionData[] = [];
  displayedColumns = [];
  commonColumns = [
    { name: 'condition', header: 'CONDITION' },
    { name: 'weight', header: 'WEIGHT' },
    { name: 'userEnrolled', header: 'USERS ENROLLED' },
    { name: 'userExcluded', header: 'USERS EXCLUDED' },
  ];

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
      this.enrollmentConditionData = [];
      this.experiment.stat.conditions.forEach(condition => {

        // TODO: Remained userExcluded and classesExcluded data
        this.enrollmentConditionData.push({
          condition: this.getConditionData(condition.id, 'conditionCode'),
          weight: this.getConditionData(condition.id, 'assignmentWeight'),
          userEnrolled: condition.user,
          userExcluded: this.experiment.stat.userExcluded,
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

  get assignmentUnit() {
    return ASSIGNMENT_UNIT;
  }
}
