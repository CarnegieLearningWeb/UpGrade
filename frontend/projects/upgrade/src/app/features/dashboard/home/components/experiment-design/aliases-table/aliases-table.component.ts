import { Component, OnInit, ChangeDetectionStrategy, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { BehaviorSubject, combineLatest, filter, map, Observable, Subscription } from 'rxjs';
import { ExperimentUtilityService } from '../../../../../../core/experiments/experiment-utility.service';
import { ExperimentService } from '../../../../../../core/experiments/experiments.service';
import { ExperimentAliasTableRow, ExperimentCondition, ExperimentConditionAlias, ExperimentPartition, ExperimentVM, TableEditModeDetails } from '../../../../../../core/experiments/store/experiments.model';
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
  @Input() experimentInfo: ExperimentVM;

  subscriptions: Subscription;
  isAliasTableEditMode$: Observable<boolean>;
  aliasTableEditIndex$: Observable<number>;
  currentContextMetaDataConditions$: Observable<string[]>;
  filteredContextMetaDataConditions$: BehaviorSubject<string[]> = new BehaviorSubject(['']);
  currentAliasInput$: BehaviorSubject<string> = new BehaviorSubject('');

  aliasTableData: ExperimentAliasTableRow[] = [];
  aliasesDisplayedColumns = [
    'site',
    'target',
    'condition',
    'alias',
    'actions'
  ];

  initialLoad: boolean = true;

  constructor(
    private experimentService: ExperimentService,
    private experimentUtilityService: ExperimentUtilityService,
  ) {}

  ngOnInit(): void {
    this.isAliasTableEditMode$ = this.experimentService.isAliasTableEditMode$;
    this.aliasTableEditIndex$ = this.experimentService.aliasTableEditIndex$;
    this.currentContextMetaDataConditions$ = this.experimentService.currentContextMetaDataConditions$;
  }

  ngAfterViewInit(): void {
    // must sub after view init to ensure table reference is loaded before emitting table data
    this.subscriptions = this.designData$.subscribe((designData: [ExperimentPartition[], ExperimentCondition[]]) => {
      this.aliasTableData = this.createAliasTableData(designData, this.experimentInfo?.conditionAliases);
      this.aliasTableData$.emit(this.aliasTableData);
    })

    this.subscriptions = combineLatest([
      this.currentContextMetaDataConditions$,
      this.currentAliasInput$
    ]).pipe(
      filter(([ conditions, input ]) => !!conditions && !!this.experimentUtilityService.isValidString(input)),
      map(([ conditions, input ]) => {
        return conditions.filter(condition => condition.toLowerCase().includes(input.toLowerCase()));
      })
    ).subscribe(this.filteredContextMetaDataConditions$);
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
    this.currentAliasInput$.next(rowData.alias);
  }

  handleFilterContextMetaDataConditions(value: string) {
    this.currentAliasInput$.next(value);
  }

  createAliasTableData(designData: [ExperimentPartition[], ExperimentCondition[]], conditionAliases: ExperimentConditionAlias[]): ExperimentAliasTableRow[] {
    const [ decisionPoints, conditions ] = designData;
    const aliasTableData: ExperimentAliasTableRow[] = [];
    const useExistingAliasData: boolean = !!(conditionAliases && this.initialLoad);

    decisionPoints.forEach((decisionPoint) => {
      conditions.forEach((condition) => {
        // check the list of condtionAliases, if exist, to see if this parentCondition has an alias match
        let existingAlias: ExperimentConditionAlias = null;

        if (useExistingAliasData) {
          existingAlias = conditionAliases.find(alias => (alias as any).decisionPointId === decisionPoint.target + '_' + decisionPoint.site);
        }

        aliasTableData.push({
          id: existingAlias?.id,
          site: decisionPoint.site,
          target: decisionPoint.target,
          condition: condition.conditionCode,
          alias: existingAlias?.aliasName || condition.conditionCode,
          isEditing: false
        })
      })
    })

    this.initialLoad = false;

    return aliasTableData;
  }
}
