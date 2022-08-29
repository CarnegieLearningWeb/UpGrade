import { Component, OnInit, ChangeDetectionStrategy, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { ExperimentUtilityService } from '../../../../../../core/experiments/experiment-utility.service';
import { ExperimentService } from '../../../../../../core/experiments/experiments.service';
import { ExperimentAliasTableRow, ExperimentCondition, ExperimentPartition, TableEditModeDetails } from '../../../../../../core/experiments/store/experiments.model';


@Component({
  selector: 'app-aliases-table',
  templateUrl: './aliases-table.component.html',
  styleUrls: ['./aliases-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AliasesTableComponent implements OnInit, OnDestroy {
  @Output() aliasTableData$: EventEmitter<ExperimentAliasTableRow[]> = new EventEmitter();
  @Output() hideAliasTable: EventEmitter<boolean> = new EventEmitter();
  @Input() designData$: Observable<[ExperimentPartition[], ExperimentCondition[]]>;

  subscriptions: Subscription;
  isAliasTableEditMode$: Observable<boolean>;
  aliasTableEditIndex$: Observable<number>;

  aliasTableData: ExperimentAliasTableRow[] = [];
  aliasesDisplayedColumns = [
    'site',
    'target',
    'condition',
    'alias',
    'actions'
  ]

  constructor(
    private experimentService: ExperimentService,
    private experimentUtilityService: ExperimentUtilityService,
  ) {}

  ngOnInit(): void {
    this.subscriptions = this.designData$.subscribe((designData: [ExperimentPartition[], ExperimentCondition[]]) => {
      this.aliasTableData = this.createAliasTableData(designData);
      this.aliasTableData$.emit(this.aliasTableData);
    })
    this.isAliasTableEditMode$ = this.experimentService.isAliasTableEditMode$;
    this.aliasTableEditIndex$ = this.experimentService.aliasTableEditIndex$;
  }

  ngOnDestroy(): void {
    this.experimentService.setUpdateAliasTableEditMode({
      isEditMode: false,
      rowIndex: null
    });
    this.subscriptions.unsubscribe();
  }

  handleHideClick() {
    this.hideAliasTable.emit(true);
  }

  handleEditClick(rowData: ExperimentAliasTableRow, rowIndex: number) {
    if (rowData.isEditing && !this.experimentUtilityService.isValidString(rowData.alias)) {
      rowData.alias = rowData.condition;
    }

    rowData.isEditing = !rowData.isEditing;

    const isEditMode = this.aliasTableData.some(rowData => rowData.isEditing);
    const editModeDetails: TableEditModeDetails = {
      isEditMode,
      rowIndex: isEditMode ? rowIndex : null 
    }
    this.experimentService.setUpdateAliasTableEditMode(editModeDetails);
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
