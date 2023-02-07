import { Component, OnInit, ChangeDetectionStrategy, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { BehaviorSubject, combineLatest, filter, map, Observable, Subscription } from 'rxjs';
import { ExperimentDesignStepperService } from '../../../../../../core/experiment-design-stepper/experiment-design-stepper.service';
import {
  SimpleExperimentAliasTableRow,
  SimpleExperimentDesignData,
} from '../../../../../../core/experiment-design-stepper/store/experiment-design-stepper.model';
import { ExperimentService } from '../../../../../../core/experiments/experiments.service';
import { ExperimentVM } from '../../../../../../core/experiments/store/experiments.model';
@Component({
  selector: 'app-aliases-table',
  templateUrl: './aliases-table.component.html',
  styleUrls: ['./aliases-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AliasesTableComponent implements OnInit, OnDestroy {
  // @Output() aliasTableData$ = new EventEmitter<SimpleExperimentAliasTableRow[]>();
  @Output() hideAliasTable = new EventEmitter<boolean>();
  // @Input() designData$: Observable<[ExperimentDecisionPoint[], ExperimentCondition[]]>;
  @Input() experimentInfo: ExperimentVM;

  subscriptions: Subscription;
  isSimpleExperimentAliasTableEditMode$: Observable<boolean>;
  simpleExperimentAliasTableEditIndex$: Observable<number>;
  currentContextMetaDataConditions$: Observable<string[]>;
  filteredContextMetaDataConditions$ = new BehaviorSubject<string[]>(['']);
  currentAliasInput$ = new BehaviorSubject<string>('');
  designData$: Observable<SimpleExperimentDesignData>;

  aliasTableData$ = new BehaviorSubject<SimpleExperimentAliasTableRow[]>([]);
  aliasesDisplayedColumns = ['site', 'target', 'condition', 'alias', 'actions'];

  initialLoad = true;

  constructor(
    private experimentService: ExperimentService,
    private experimentDesignStepperService: ExperimentDesignStepperService
  ) {}

  ngOnInit(): void {
    this.isSimpleExperimentAliasTableEditMode$ =
      this.experimentDesignStepperService.isSimpleExperimentAliasTableEditMode$;
    this.simpleExperimentAliasTableEditIndex$ =
      this.experimentDesignStepperService.simpleExperimentAliasTableEditIndex$;
    this.currentContextMetaDataConditions$ = this.experimentService.currentContextMetaDataConditions$;
    this.designData$ = this.experimentDesignStepperService.simpleExperimentDesignData$;
  }

  ngAfterViewInit(): void {
    // must sub after view init to ensure table reference is loaded before emitting table data

    this.subscriptions = this.experimentDesignStepperService.simpleExperimentAliasTableData$.subscribe(
      this.aliasTableData$
    );

    this.subscriptions = this.experimentDesignStepperService.simpleExperimentDesignData$
      .pipe(filter((designData) => this.experimentDesignStepperService.validDesignDataFilter(designData)))
      .subscribe((designData) => {
        this.handleDesignDataChanges(designData);
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
    this.experimentDesignStepperService.setUpdateAliasTableEditModeDetails(null);
    // this.experimentDesignStepperService.resetSimpleExperimentData();
    this.subscriptions.unsubscribe();
  }

  handleDesignDataChanges(designData: SimpleExperimentDesignData) {
    const { decisionPoints, conditions } = designData;
    const conditionAliases = this.experimentInfo?.conditionAliases;
    const useExistingAliasData = !!(conditionAliases && this.initialLoad);

    // if design data is initial load
    if (this.initialLoad) {
      this.handleInitialAliasTableCreation({ decisionPoints, conditions, conditionAliases, useExistingAliasData });
      this.initialLoad = false;
    }
    // if design data is modified
    // if design data has added rows
    // if design data has deleted rows
  }

  handleInitialAliasTableCreation({ decisionPoints, conditions, conditionAliases, useExistingAliasData }) {
    this.experimentDesignStepperService.createAliasTableData(
      decisionPoints,
      conditions,
      conditionAliases,
      useExistingAliasData
    );
  }

  handleHideClick() {
    this.hideAliasTable.emit(true);
  }

  handleEditClick(rowData: SimpleExperimentAliasTableRow, rowIndex: number) {
    const aliasTableData = this.experimentDesignStepperService.getSimpleExperimentAliasTableData();
    const rowDataCopy = { ...rowData };
    aliasTableData[rowIndex] = rowDataCopy;

    this.experimentDesignStepperService.setUpdateAliasTableEditModeDetails(rowIndex);
    this.experimentDesignStepperService.setNewSimpleExperimentAliasTableData(aliasTableData);
    this.currentAliasInput$.next(rowData.alias);
  }

  handleFilterContextMetaDataConditions(value: string) {
    this.currentAliasInput$.next(value);
  }
}
