import { Component, OnInit, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs';
import { ExperimentUtilityService } from '../../../../../../core/experiments/experiment-utility.service';
import { ExperimentService } from '../../../../../../core/experiments/experiments.service';
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

  constructor(
    private experimentUtilityService: ExperimentUtilityService
  ) { }

  ngOnInit(): void {
    this.designData$.subscribe((designData: [ExperimentPartition[], ExperimentCondition[]]) => {
      this.aliasTableData = this.createAliasTableData(designData);
      this.aliasTableData$.emit(this.aliasTableData)
    })
  }

  handleHideClick() {
    this.hideAliasTable.emit(true);
  }

  handleEditClick(rowData: ExperimentAliasTableRow) {
    if (rowData.isEditing && !this.experimentUtilityService.isValidString(rowData.alias)) {
      rowData.alias = rowData.condition;
    }

    rowData.isEditing = !rowData.isEditing;

    this.aliasTableData$.emit(this.aliasTableData);
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
