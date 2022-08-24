import { Component, OnInit, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { filter, Observable } from 'rxjs';
import { ExperimentAliasTableRow, ExperimentCondition, ExperimentPartition } from '../../../../../../core/experiments/store/experiments.model';


@Component({
  selector: 'app-aliases-table',
  templateUrl: './aliases-table.component.html',
  styleUrls: ['./aliases-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AliasesTableComponent implements OnInit {
  @Output() aliasTableData$: EventEmitter<ExperimentAliasTableRow[]> = new EventEmitter();
  @Output() hideAliasTable: EventEmitter<boolean> = new EventEmitter();
  @Input() designData$: Observable<[ExperimentPartition[], ExperimentCondition[]]>;

  aliasTableData: ExperimentAliasTableRow[] = [];

  aliasesDisplayedColumns = [
    'site',
    'target',
    'condition',
    'alias',
    'actions'
  ]

  constructor() { }

  ngOnInit(): void {
    this.designData$.pipe(
      filter((designData) => this.validDesignDataFilter(designData))
    )
    .subscribe((designData: [ExperimentPartition[], ExperimentCondition[]]) => {
      // TODO: will this work with edit?
      this.aliasTableData = this.createAliasTableData(designData);
      this.aliasTableData$.emit(this.aliasTableData)
    })
  }

  handleHideClick() {
    this.hideAliasTable.emit(true);
  }

  handleEditClick(rowData: ExperimentAliasTableRow) {
    // if user clears out alias field or just leaves spaces and they click OK, revert alias to default
    if (rowData.isEditing && !this.isValidString(rowData.alias)) {
      rowData.alias = rowData.condition;
    }

    rowData.isEditing = !rowData.isEditing;

    this.aliasTableData$.emit(this.aliasTableData);
  }

  isValidString(value: any) {
    return typeof value === 'string' && value.trim()
  }

  validDesignDataFilter(designData: [ExperimentPartition[], ExperimentCondition[]]) {
    const [ partitions, conditions ] = designData;
    const hasValidDecisionPointStrings = partitions.every(({ site, target }) => {
      return this.isValidString(site) && this.isValidString(target)
    })
    const hasValidConditionStrings = conditions.every(({ conditionCode }) => {
      return this.isValidString(conditionCode)
    })
    return hasValidDecisionPointStrings && hasValidConditionStrings;
  }

  createAliasTableData(designData: [ExperimentPartition[], ExperimentCondition[]]): ExperimentAliasTableRow[] {
    const [ decisionPoints, conditions ] = designData;
    const aliasTableData: ExperimentAliasTableRow[] = []; 

    decisionPoints.forEach(({ site, target }) => {
      conditions.forEach(({ conditionCode }) => {
        aliasTableData.push({
          site,
          target,
          condition: conditionCode,
          alias: conditionCode,
          isEditing: false
        })
      })
    })

    return aliasTableData;
  }
}
