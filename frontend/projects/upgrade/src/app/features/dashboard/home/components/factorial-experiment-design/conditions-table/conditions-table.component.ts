import { Component, OnInit, ChangeDetectionStrategy, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { BehaviorSubject, combineLatest, filter, map, Observable, Subscription } from 'rxjs';
import { ExperimentDesignStepperService } from '../../../../../../core/experiment-design-stepper/experiment-design-stepper.service';
import { ExperimentService } from '../../../../../../core/experiments/experiments.service';
import { ExperimentAliasTableRow } from '../../../../../../core/experiment-design-stepper/store/experiment-design-stepper.model';
import {
  ExperimentCondition,
  ExperimentConditionAlias,
  ExperimentPartition,
  ExperimentVM,
  TableEditModeDetails,
} from '../../../../../../core/experiments/store/experiments.model';

@Component({
  selector: 'app-conditions-table',
  templateUrl: './conditions-table.component.html',
  styleUrls: ['./conditions-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConditionsTableComponent implements OnInit, OnDestroy {
  @Output() aliasTableData$ = new EventEmitter<ExperimentAliasTableRow[]>();
  @Output() hideConditionTable = new EventEmitter<boolean>();
  @Input() designData$: Observable<[ExperimentPartition[], ExperimentCondition[]]>;
  @Input() experimentInfo: ExperimentVM;

  subscriptions: Subscription;
  isAliasTableEditMode$: Observable<boolean>;
  aliasTableEditIndex$: Observable<number>;
  currentContextMetaDataConditions$: Observable<string[]>;
  filteredContextMetaDataConditions$ = new BehaviorSubject<string[]>(['']);
  currentAliasInput$ = new BehaviorSubject<string>('');

  aliasTableData: ExperimentAliasTableRow[] = [];
  factorsDisplayedColumns = ['F1', 'F2'];
  conditionDisplayedColumns = [...this.factorsDisplayedColumns, 'alias', 'weight', 'include', 'actions'];

  initialLoad = true;
  equalWeightFlag = true;
  previousAssignmentWeightValues = [];

  constructor(
    private experimentService: ExperimentService,
    private experimentDesignStepperService: ExperimentDesignStepperService
  ) {}

  ngOnInit(): void {
    this.isAliasTableEditMode$ = this.experimentDesignStepperService.isAliasTableEditMode$;
    this.aliasTableEditIndex$ = this.experimentDesignStepperService.aliasTableEditIndex$;
    this.currentContextMetaDataConditions$ = this.experimentService.currentContextMetaDataConditions$;
  }

  ngAfterViewInit(): void {
    // must sub after view init to ensure table reference is loaded before emitting table data
    this.subscriptions = this.designData$.subscribe((designData: [ExperimentPartition[], ExperimentCondition[]]) => {
      this.aliasTableData = this.createAliasTableData(designData, this.experimentInfo?.conditionAliases);
      this.aliasTableData$.emit(this.aliasTableData);
    });

    this.subscriptions = combineLatest([this.currentContextMetaDataConditions$, this.currentAliasInput$])
      .pipe(
        filter(([conditions, input]) => !!conditions && !!this.experimentDesignStepperService.isValidString(input)),
        map(([conditions, input]) =>
          conditions.filter((condition: string) => condition.toLowerCase().includes(input.toLowerCase()))
        )
      )
      .subscribe(this.filteredContextMetaDataConditions$);
  }

  ngOnDestroy(): void {
    this.experimentDesignStepperService.setUpdateAliasTableEditMode({
      isEditMode: false,
      rowIndex: null,
    });
    this.subscriptions.unsubscribe();
  }

  handleHideClick() {
    this.hideConditionTable.emit(true);
  }

  handleEditClick(rowData: ExperimentAliasTableRow, rowIndex: number) {
    if (rowData.isEditing && !this.experimentDesignStepperService.isValidString(rowData.alias)) {
      rowData.alias = rowData.condition;
    }

    rowData.isEditing = !rowData.isEditing;

    const isEditMode = this.aliasTableData.some((rowData) => rowData.isEditing);
    const editModeDetails: TableEditModeDetails = {
      isEditMode,
      rowIndex: isEditMode ? rowIndex : null,
    };
    this.experimentDesignStepperService.setUpdateAliasTableEditMode(editModeDetails);
    this.currentAliasInput$.next(rowData.alias);
  }

  handleFilterContextMetaDataConditions(value: string) {
    this.currentAliasInput$.next(value);
  }

  createAliasTableData(
    designData: [ExperimentPartition[], ExperimentCondition[]],
    conditionAliases: ExperimentConditionAlias[]
  ): ExperimentAliasTableRow[] {
    const [decisionPoints, conditions] = designData;
    const aliasTableData: ExperimentAliasTableRow[] = [];
    const useExistingAliasData = !!(conditionAliases && this.initialLoad);

    decisionPoints.forEach((decisionPoint) => {
      conditions.forEach((condition) => {
        // check the list of condtionAliases, if exist, to see if this parentCondition has an alias match
        let existingAlias: ExperimentConditionAlias = null;

        if (useExistingAliasData) {
          existingAlias = conditionAliases.find(
            (alias) =>
              alias.decisionPoint.target === decisionPoint.target &&
              alias.decisionPoint.site === decisionPoint.site &&
              alias.parentCondition.conditionCode === condition.conditionCode
          );
        }

        aliasTableData.push({
          id: existingAlias?.id,
          site: decisionPoint.site,
          target: decisionPoint.target,
          condition: condition.conditionCode,
          alias: existingAlias?.aliasName || condition.conditionCode,
          isEditing: false,
        });
      });
    });

    this.initialLoad = false;

    return aliasTableData;
  }

  applyEqualWeight() {
    if (this.equalWeightFlag) {
      const len = this.aliasTableData.length;
      this.previousAssignmentWeightValues = [];
      
    } else{
      
    }
  }

  changeEqualWeightFlag(event) {
    event.checked ? (this.equalWeightFlag = true) : (this.equalWeightFlag = false);
    this.applyEqualWeight();
  }
}
