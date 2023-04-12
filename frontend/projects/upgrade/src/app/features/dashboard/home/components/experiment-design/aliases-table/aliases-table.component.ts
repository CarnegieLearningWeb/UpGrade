import { Component, OnInit, ChangeDetectionStrategy, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { BehaviorSubject, combineLatest, filter, map, Observable, Subscription } from 'rxjs';
import { ExperimentDesignStepperService } from '../../../../../../core/experiment-design-stepper/experiment-design-stepper.service';
import {
  SimpleExperimentPayloadTableRow,
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
  @Output() hidePayloadTable = new EventEmitter<boolean>();
  @Input() experimentInfo: ExperimentVM;

  subscriptions: Subscription;
  isSimpleExperimentPayloadTableEditMode$: Observable<boolean>;
  simpleExperimentPayloadTableEditIndex$: Observable<number>;
  currentContextMetaDataConditions$: Observable<string[]>;
  filteredContextMetaDataConditions$ = new BehaviorSubject<string[]>(['']);
  currentPayloadInput$ = new BehaviorSubject<string>('');
  designData$: Observable<SimpleExperimentDesignData>;

  payloadTableData$ = new BehaviorSubject<SimpleExperimentPayloadTableRow[]>([]);
  payloadsDisplayedColumns = ['site', 'target', 'condition', 'payload', 'actions'];
  initialLoad = true;

  constructor(
    private experimentService: ExperimentService,
    private experimentDesignStepperService: ExperimentDesignStepperService
  ) {}

  ngOnInit(): void {
    this.isSimpleExperimentPayloadTableEditMode$ =
      this.experimentDesignStepperService.isSimpleExperimentPayloadTableEditMode$;
    this.simpleExperimentPayloadTableEditIndex$ =
      this.experimentDesignStepperService.simpleExperimentPayloadTableEditIndex$;
    this.currentContextMetaDataConditions$ = this.experimentService.currentContextMetaDataConditions$;
    this.designData$ = this.experimentDesignStepperService.simpleExperimentDesignData$;
  }

  ngAfterViewInit(): void {
    this.listenToPayloadTableDataChanges();
    this.listenToContextMetadataAndInputChanges();
    this.listenToDesignDataChanges();
  }

  ngOnDestroy(): void {
    this.experimentDesignStepperService.setUpdatePayloadTableEditModeDetails(null);
    this.subscriptions.unsubscribe();
  }

  listenToPayloadTableDataChanges(): void {
    this.subscriptions = this.experimentDesignStepperService.simpleExperimentPayloadTableData$
      .pipe(
        map((payloadTableData) => {
          // data from ngrx store is immutable
          // this ensures that a mutable clone of payload table data is emitted
          return [
            ...payloadTableData.map((rowData) => {
              return { ...rowData };
            }),
          ];
        })
      )
      .subscribe(this.payloadTableData$);
  }

  listenToDesignDataChanges() {
    this.subscriptions = this.experimentDesignStepperService.simpleExperimentDesignData$
      .pipe(filter((designData) => this.experimentDesignStepperService.validDesignDataFilter(designData)))
      .subscribe((designData) => {
        this.handleDesignDataChanges(designData);
      });
  }

  listenToContextMetadataAndInputChanges() {
    this.subscriptions = combineLatest([this.currentContextMetaDataConditions$, this.currentPayloadInput$])
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
    const preexistingConditionPayloadData =
      this.initialLoad && this.experimentInfo ? this.experimentInfo.conditionPayloads : [];
    const conditionPayloadsRowData: SimpleExperimentPayloadTableRow[] =
      this.experimentDesignStepperService.getExistingConditionPayloadRowData(preexistingConditionPayloadData);

    this.experimentDesignStepperService.updateAndStorePayloadTableData(
      decisionPoints,
      conditions,
      conditionPayloadsRowData
    );
    this.initialLoad = false;
  }

  handleHideClick() {
    this.hidePayloadTable.emit(true);
  }

  handleEditClick(rowData: SimpleExperimentPayloadTableRow, rowIndex: number) {
    const payloadTableData = this.experimentDesignStepperService.getSimpleExperimentPayloadTableData();
    const rowDataCopy = { ...rowData };
    payloadTableData[rowIndex] = rowDataCopy;

    if (this.currentPayloadInput$.value !== rowData.payload.value) {
      payloadTableData[rowIndex].useCustom = true;
    }

    this.currentPayloadInput$.next(rowData.payload.value);
    this.experimentDesignStepperService.setUpdatePayloadTableEditModeDetails(rowIndex);
    this.experimentDesignStepperService.setNewSimpleExperimentPayloadTableData(payloadTableData);
  }

  handleFilterContextMetaDataConditions(value: string) {
    this.currentPayloadInput$.next(value);
  }
}
