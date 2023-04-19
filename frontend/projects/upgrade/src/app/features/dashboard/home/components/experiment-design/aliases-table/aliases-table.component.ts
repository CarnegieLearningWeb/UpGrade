import { Component, OnInit, ChangeDetectionStrategy, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { BehaviorSubject, combineLatest, filter, map, Observable, Subscription } from 'rxjs';
import { ExperimentDesignStepperService } from '../../../../../../core/experiment-design-stepper/experiment-design-stepper.service';
import {
  SimpleExperimentAliasTableRowData,
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
  @Output() hideAliasTable = new EventEmitter<boolean>();
  @Input() experimentInfo: ExperimentVM;

  subscriptions: Subscription;
  isSimpleExperimentAliasTableEditMode$: Observable<boolean>;
  simpleExperimentAliasTableEditIndex$: Observable<number>;
  currentContextMetaDataConditions$: Observable<string[]>;
  filteredContextMetaDataConditions$ = new BehaviorSubject<string[]>(['']);
  currentAliasInput$ = new BehaviorSubject<string>('');
  designData$: Observable<SimpleExperimentDesignData>;

  aliasTableData$ = new BehaviorSubject<SimpleExperimentAliasTableRowData[]>([]);
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
    this.listenToAliasTableDataChanges();
    this.listenToContextMetadataAndInputChanges();
    this.listenToDesignDataChanges();
  }

  ngOnDestroy(): void {
    this.experimentDesignStepperService.setUpdateAliasTableEditModeDetails(null);
    this.subscriptions.unsubscribe();
  }

  listenToAliasTableDataChanges(): void {
    this.subscriptions = this.experimentDesignStepperService.simpleExperimentAliasTableData$
      .pipe(
        map((aliasTableData) => {
          // data from ngrx store is immutable
          // this ensures that a mutable clone of alias table data is emitted
          return [
            ...aliasTableData.map((rowData) => {
              return { ...rowData };
            }),
          ];
        })
      )
      .subscribe(this.aliasTableData$);
  }

  listenToDesignDataChanges() {
    this.subscriptions = this.experimentDesignStepperService.simpleExperimentDesignData$
      .pipe(filter((designData) => this.experimentDesignStepperService.validDesignDataFilter(designData)))
      .subscribe((designData) => {
        this.handleDesignDataChanges(designData);
      });
  }

  listenToContextMetadataAndInputChanges() {
    this.subscriptions = combineLatest([this.currentContextMetaDataConditions$, this.currentAliasInput$])
      .pipe(
        filter(([conditions, input]) => !!conditions && !!this.experimentDesignStepperService.isValidString(input)),
        map(([conditions, input]) =>
          conditions.filter((condition: string) => condition.toLowerCase().includes(input.toLowerCase()))
        )
      )
      .subscribe(this.filteredContextMetaDataConditions$);
  }

  handleDesignDataChanges(designData: SimpleExperimentDesignData) {
    const { decisionPoints, conditions } = designData;
    const preexistingConditionAliasData =
      this.initialLoad && this.experimentInfo ? this.experimentInfo.conditionAliases : [];
    const conditionAliasesRowData: SimpleExperimentAliasTableRowData[] =
      this.experimentDesignStepperService.getExistingConditionAliasRowData(preexistingConditionAliasData);

    this.experimentDesignStepperService.updateAndStoreAliasTableData(
      decisionPoints,
      conditions,
      conditionAliasesRowData
    );
    this.initialLoad = false;
  }

  handleHideClick() {
    this.hideAliasTable.emit(true);
  }

  handleEditClick(rowData: SimpleExperimentAliasTableRowData, rowIndex: number) {
    const aliasTableData = this.experimentDesignStepperService.getSimpleExperimentAliasTableData();
    const rowDataCopy = { ...rowData };
    aliasTableData[rowIndex] = rowDataCopy;

    if (this.currentAliasInput$.value !== rowData.alias) {
      aliasTableData[rowIndex].useCustom = true;
    }

    this.currentAliasInput$.next(rowData.alias);
    this.experimentDesignStepperService.setUpdateAliasTableEditModeDetails(rowIndex);
    this.experimentDesignStepperService.setNewSimpleExperimentAliasTableData(aliasTableData);
  }

  handleFilterContextMetaDataConditions(value: string) {
    this.currentAliasInput$.next(value);
  }
}
