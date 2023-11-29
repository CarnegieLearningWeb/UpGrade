import { Component, OnInit, ChangeDetectionStrategy, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { BehaviorSubject, combineLatest, filter, map, Observable, Subscription } from 'rxjs';
import { ExperimentDesignStepperService } from '../../../../../../core/experiment-design-stepper/experiment-design-stepper.service';
import {
  SimpleExperimentPayloadTableRowData,
  SimpleExperimentDesignData,
} from '../../../../../../core/experiment-design-stepper/store/experiment-design-stepper.model';
import { ExperimentService } from '../../../../../../core/experiments/experiments.service';
import { ExperimentVM } from '../../../../../../core/experiments/store/experiments.model';
@Component({
  selector: 'app-payloads-table',
  templateUrl: './payloads-table.component.html',
  styleUrls: ['./payloads-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PayloadsTableComponent implements OnInit, OnDestroy {
  @Input() experimentInfo: ExperimentVM;

  subscriptions: Subscription;
  isSimpleExperimentPayloadTableEditMode$: Observable<boolean>;
  simpleExperimentPayloadTableEditIndex$: Observable<number>;
  currentContextMetaDataConditions$: Observable<string[]>;
  filteredContextMetaDataConditions$ = new BehaviorSubject<string[]>(['']);
  currentPayloadInput$ = new BehaviorSubject<string>('');
  designData$: Observable<SimpleExperimentDesignData>;

  payloadTableData$ = new BehaviorSubject<SimpleExperimentPayloadTableRowData[]>([]);
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
    this.experimentDesignStepperService.clearSimpleExperimentDesignStepperData();
    this.experimentDesignStepperService.setUpdatePayloadTableEditModeDetails(null, true);
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
    const conditionPayloadsRowData: SimpleExperimentPayloadTableRowData[] =
      this.experimentDesignStepperService.getExistingConditionPayloadRowData(preexistingConditionPayloadData);

    this.experimentDesignStepperService.updateAndStorePayloadTableData(
      decisionPoints,
      conditions,
      conditionPayloadsRowData
    );
    this.initialLoad = false;
  }

  handleEditClick(rowData: SimpleExperimentPayloadTableRowData, rowIndex: number) {
    const payloadTableData = this.experimentDesignStepperService.getSimpleExperimentPayloadTableData();
    const rowDataCopy = { ...rowData };
    payloadTableData[rowIndex] = rowDataCopy;

    if (this.currentPayloadInput$.value !== rowData.payload) {
      payloadTableData[rowIndex].useCustom = true;
    }

    this.currentPayloadInput$.next(rowData.payload);
    this.experimentDesignStepperService.setUpdatePayloadTableEditModeDetails(rowIndex, false);
    this.experimentDesignStepperService.setNewSimpleExperimentPayloadTableData(payloadTableData);
  }

  handleFilterContextMetaDataConditions(value: string) {
    this.currentPayloadInput$.next(value);
  }
}
