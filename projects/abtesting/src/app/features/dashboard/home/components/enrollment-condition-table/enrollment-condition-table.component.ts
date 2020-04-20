import { Component, ChangeDetectionStrategy, Input, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { EnrollmentByConditionData, ASSIGNMENT_UNIT, ExperimentVM } from '../../../../../core/experiments/store/experiments.model';
import { Subscription } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'home-enrollment-condition-table',
  templateUrl: './enrollment-condition-table.component.html',
  styleUrls: ['./enrollment-condition-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EnrollmentConditionTableComponent implements OnChanges, OnDestroy {

  @Input() experiment: ExperimentVM;
  columns = []; // Used to create dynamic columns
  enrollmentConditionData: EnrollmentByConditionData[] = [];
  displayedColumns = [];
  commonColumns = [];

  // For translation strings
  translatedStrings = [];
  translateSub: Subscription;

  constructor(
    private translate: TranslateService
  ) {
    this.translateSub = this.translate.get([
      'global.condition.text',
      'home.view-experiment.global.weight.text',
      'home.view-experiment.global.users-enrolled.text',
      'home.view-experiment.global.users-excluded.text',
      'home.view-experiment.global.group-enrolled.text',
      'home.view-experiment.global.group-excluded.text'
    ]).subscribe(arrayValues => {
        this.translatedStrings = [
          arrayValues['global.condition.text'],
          arrayValues['home.view-experiment.global.weight.text'],
          arrayValues['home.view-experiment.global.users-enrolled.text'],
          arrayValues['home.view-experiment.global.users-excluded.text'],
          arrayValues['home.view-experiment.global.group-enrolled.text'],
          arrayValues['home.view-experiment.global.group-excluded.text'],
        ];
        this.commonColumns = [
          { name: 'condition', header: this.translatedStrings[0] },
          { name: 'weight', header: this.translatedStrings[1] },
          { name: 'userEnrolled', header: this.translatedStrings[2] },
          { name: 'userExcluded', header: this.translatedStrings[3] },
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
        { name: 'groupEnrolled', header: this.translatedStrings[4] },
        { name: 'groupExcluded', header: this.translatedStrings[5] },
      ];
      this.setColumns(columns);
    }
    if (changes.experiment) {
      this.enrollmentConditionData = [];
      this.experiment.stat.conditions.forEach(condition => {

        this.enrollmentConditionData.push({
          condition: this.getConditionData(condition.id, 'conditionCode'),
          weight: this.getConditionData(condition.id, 'assignmentWeight'),
          userEnrolled: condition.user,
          userExcluded: this.experiment.stat.userExcluded,
          groupEnrolled: condition.group,
          groupExcluded: this.experiment.stat.groupExcluded
        });
      });
    }
  }

  setColumns(columnNames) {
    this.columns = [];
    columnNames.forEach(column => {
      this.columns.push(
        { columnDef: `${column.name}`, header: `${column.header}`, cell: (element) => `${element[`${column.name}`]}` },
      );
    });
    this.displayedColumns = this.columns.map(x => x.columnDef);
  }

  getConditionData(conditionId: string, key: string) {
    return this.experiment.conditions.reduce((acc, condition) =>
      condition.id === conditionId ? acc = condition[key] : acc
      , null);
  }

  get assignmentUnit() {
    return ASSIGNMENT_UNIT;
  }

  ngOnDestroy() {
    this.translateSub.unsubscribe();
  }
}
