import { ChangeDetectionStrategy, ViewChild, ElementRef, OnChanges } from '@angular/core';
import { ASSIGNMENT_UNIT } from 'upgrade_types';
import { AbstractControl } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import {
  NewExperimentDialogEvents,
  NewExperimentDialogData,
  NewExperimentPaths,
} from '../../../../../core/experiments/store/experiments.model';
import { Component, OnInit, OnDestroy, Input, EventEmitter, Output } from '@angular/core';
import { Subscription, Observable } from 'rxjs';
import {
  OPERATION_TYPES,
  Query,
  METRICS_JOIN_TEXT,
  IMetricMetaData,
  REPEATED_MEASURE,
} from '../../../../../core/analysis/store/analysis.models';
import { AnalysisService } from '../../../../../core/analysis/analysis.service';
import { ExperimentVM } from '../../../../../core/experiments/store/experiments.model';
import { UntypedFormGroup, UntypedFormBuilder, Validators, UntypedFormArray } from '@angular/forms';
import { startWith, map } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { DialogService } from '../../../../../shared/services/dialog.service';
import { ExperimentDesignStepperService } from '../../../../../core/experiment-design-stepper/experiment-design-stepper.service';
@Component({
  selector: 'home-monitored-metrics',
  templateUrl: './metrics.component.html',
  styleUrls: ['./metrics.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonitoredMetricsComponent implements OnInit, OnChanges, OnDestroy {
  @Input() experimentInfo: ExperimentVM;
  @Input() currentContext: string;
  @Input() isContextChanged: boolean;
  @Input() isExperimentTypeChanged: boolean;
  @Input() animationCompleteStepperIndex: number;
  @Output() emitExperimentDialogEvent = new EventEmitter<NewExperimentDialogData>();
  @ViewChild('metricTable', { static: false, read: ElementRef }) metricTable: ElementRef;

  queryForm: UntypedFormGroup;

  // Used for displaying metrics
  allMetricsSub: Subscription;
  allMetrics = [];
  private repeatedMeasureSubscriptions: Subscription[] = [];

  queryOperations = [];
  comparisonFns = [
    { value: '=', viewValue: 'equal' },
    { value: '<>', viewValue: 'not equal' },
  ];

  // Used for metrics auto complete dropdown
  filteredMetrics1$: Observable<any[]>[] = [];
  filteredMetrics2$: Observable<any[]>[] = [];
  filteredMetrics3$: Observable<any[]>[] = [];
  filteredStatistic$ = [];

  options: any[] = [];
  selectedNode: any[] = [];
  firstSelectedNode: any[] = [];
  controlTitles = ['Type', 'Key', 'Metric']; // Used to show different titles in grouped metrics

  metricsDataSource = new BehaviorSubject<AbstractControl[]>([]);

  metricsDisplayedColumns = ['keys', 'operationType', 'queryName', 'removeMetric'];
  queryIndex = 0;
  editMode = false;

  queryMetricKeyError = [];
  queryNameError = [];
  queryStatisticError = [];
  queryComparisonStatisticError = [];
  queryMetricDropDownError = [];

  currentAssignmentUnit: ASSIGNMENT_UNIT;

  constructor(
    private analysisService: AnalysisService,
    private _formBuilder: UntypedFormBuilder,
    private translate: TranslateService,
    private dialogService: DialogService,
    private experimentDesignStepperService: ExperimentDesignStepperService
  ) {}

  optionsSub() {
    this.allMetricsSub = this.analysisService.allMetrics$.subscribe((metrics) => {
      this.allMetrics = metrics;
      // Hide global metrics options if Within-subjects is selected
      this.options =
        this.currentAssignmentUnit === ASSIGNMENT_UNIT.WITHIN_SUBJECTS
          ? this.allMetrics.filter((metric) => metric.children.length > 0)
          : this.allMetrics;
    });
  }

  ngOnInit() {
    // TODO: Invalidate the global metric rows whenever the unit of assignment updates to Within-subjects
    this.experimentDesignStepperService.currentAssignmentUnit$.subscribe((unit) => {
      if (unit === ASSIGNMENT_UNIT.WITHIN_SUBJECTS) {
        // console.log('this.queries:', this.queries);
      }
      this.currentAssignmentUnit = unit;
    });
    this.optionsSub();
    this.queryForm = this._formBuilder.group({
      queries: this._formBuilder.array([
        this._formBuilder.group({
          keys: this._formBuilder.array([this.addKey()]),
          queryName: [null, Validators.required],
          operationType: [null, Validators.required],
          compareFn: [null, Validators.required],
          compareValue: [null, Validators.required],
          repeatedMeasure: [null, Validators.required],
        }),
      ]),
    });

    // Bind predefined values of metrics from backend env file for auto complete:
    const metricsFormControl = this.queries;
    metricsFormControl.controls.forEach((_, keyIndex) => {
      this.ManageKeysControl(this.queryIndex, keyIndex);
      this.setQueryIndex(this.queryIndex + 1);
    });
    this.queryIndex = 0;

    // populate values in form to update experiment if experiment data is available in edit mode
    if (this.experimentInfo) {
      // Remove the default empty row
      this.queries.removeAt(0);
      this.experimentInfo.queries.forEach((query, queryIndex) => {
        const key = query.metric.key ? query.metric.key : query.metric;
        // separating keys from metric
        const rootKey = key.split(METRICS_JOIN_TEXT);
        // set selectedNode for first key of simple/repeated metrics
        let metricObj = this.allMetrics.find((metric) => metric.key === rootKey[0]);
        this.firstSelectedNode[queryIndex] = metricObj;
        this.selectedNode[queryIndex] = metricObj;
        const type = query.metric.type;
        this.filteredStatistic$[queryIndex] = this.setFilteredStatistic(type);
        // push first key in query form:
        if (query.query.compareFn && !!query.query.compareValue) {
          this.queries.push(
            this.addMetric(
              metricObj,
              query.name,
              query.query.operationType,
              query.query.compareFn,
              query.query.compareValue,
              query.repeatedMeasure
            )
          );
        } else {
          this.queries.push(
            this.addMetric(metricObj, query.name, query.query.operationType, null, null, query.repeatedMeasure)
          );
        }
        // push remaining keys in query form in case of repeated metrics
        if (rootKey.length > 1) {
          rootKey.map((key, keyindex) => {
            if (keyindex !== 0) {
              this.selectedNode[queryIndex] = metricObj;
              // call select option for first key of grouped metrics:
              this.selectedOption(null, metricObj, key, queryIndex, keyindex);
              this.optionsSub();
              metricObj = metricObj.children;
              metricObj = metricObj.find((metric) => metric.key === key);
              this.selectedNode[queryIndex] = metricObj;
            }
          });
        }
        this.setQueryIndex(this.queryIndex + 1);
        this.ManageKeysControl(queryIndex, 0);
      });
    }

    if (this.queryForm.get('queries').get('operationType')) {
      this.queryForm
        .get('queries')
        .get('operationType')
        .valueChanges.subscribe((operation) => {
          if (operation === OPERATION_TYPES.PERCENTAGE) {
            this.queryForm.get('queries').get('compareFn').setValidators([Validators.required]);
            this.queryForm.get('queries').get('compareValue').setValidators([Validators.required]);
          } else {
            this.queryForm.get('queries').get('compareFn').clearValidators();
            this.queryForm.get('queries').get('compareValue').clearValidators();
          }
          this.queryForm.get('queries').get('compareFn').updateValueAndValidity();
          this.queryForm.get('queries').get('compareValue').updateValueAndValidity();
        });
    }
    if (this.queryForm.get('queries').get('compareFn')) {
      this.queryForm
        .get('queries')
        .get('compareFn')
        .valueChanges.subscribe((compareFn) => {
          if (compareFn) {
            this.queryForm.get('queries').get('compareValue').setValidators([Validators.required]);
          } else {
            this.queryForm.get('queries').get('compareValue').clearValidators();
            this.queryForm.get('queries').get('compareValue').setValue(null);
          }
          this.queryForm.get('queries').get('compareValue').updateValueAndValidity();
        });
    }
    this.updateView();
  }

  // getters
  get queries(): UntypedFormArray {
    return this.queryForm.get('queries') as UntypedFormArray;
  }

  get NewExperimentDialogEvents() {
    return NewExperimentDialogEvents;
  }

  get IMetricMetadata() {
    return IMetricMetaData;
  }

  get ContinuousRepeatedMeasure() {
    const repeatedMeasure = Object.values(REPEATED_MEASURE);
    return repeatedMeasure.slice(0, 3);
  }

  get CategoricalRepeatedMeasure() {
    const repeatedMeasure = Object.values(REPEATED_MEASURE);
    return repeatedMeasure.slice(1, 3); // This should update to "repeatedMeasure.slice(1)" later to return all four options
  }

  get experimentInfoQueriesLength() {
    return this.experimentInfo.queries.length;
  }

  getKeys(queryIndex: number) {
    const keysArray = this.queries.at(queryIndex).get('keys') as UntypedFormArray;
    return keysArray;
  }

  setQueryIndex(queryIndex: number) {
    this.queryIndex = queryIndex;
  }

  addKey(key = null) {
    return this._formBuilder.group({
      metricKey: [key, Validators.required],
    });
  }

  displayFn(node?: any): string | undefined {
    if (node && node.key) {
      return node ? node.key : undefined;
    } else {
      return node ? node : undefined;
    }
  }

  private _filter(key: any): any[] {
    let filterValue;
    if (typeof key === 'string') {
      filterValue = key.toLowerCase();
    } else {
      filterValue = key.key.toLowerCase();
    }
    return this.options.filter((option) => option.key.toLowerCase().indexOf(filterValue) === 0);
  }

  setFilteredStatistic(type: string) {
    if (type === IMetricMetaData.CONTINUOUS) {
      this.queryOperations = [
        { value: OPERATION_TYPES.SUM, viewValue: 'Sum' },
        { value: OPERATION_TYPES.MIN, viewValue: 'Min' },
        { value: OPERATION_TYPES.MAX, viewValue: 'Max' },
        { value: OPERATION_TYPES.COUNT, viewValue: 'Count' },
        { value: OPERATION_TYPES.AVERAGE, viewValue: 'Mean' },
        { value: OPERATION_TYPES.MODE, viewValue: 'Mode' },
        { value: OPERATION_TYPES.MEDIAN, viewValue: 'Median' },
        { value: OPERATION_TYPES.STDEV, viewValue: 'Standard Deviation' },
      ];
    } else if (type === IMetricMetaData.CATEGORICAL) {
      this.queryOperations = [
        { value: OPERATION_TYPES.COUNT, viewValue: 'Count' },
        { value: OPERATION_TYPES.PERCENTAGE, viewValue: 'Percentage' },
      ];
    }
    return this.queryOperations;
  }

  addMoreSelectKey(key = null, queryIndex: number) {
    this.getKeys(queryIndex).push(this.addKey(key));
  }

  addMetric(
    key = null,
    queryName = null,
    operationType = null,
    compareFn = null,
    compareValue = null,
    repeatedMeasure = REPEATED_MEASURE.mostRecent
  ) {
    return this._formBuilder.group({
      keys: this._formBuilder.array([this.addKey(key)]),
      queryName: [queryName, Validators.required],
      operationType: [operationType, Validators.required],
      compareFn: [compareFn, Validators.required],
      compareValue: [compareValue, Validators.required],
      repeatedMeasure: [repeatedMeasure, Validators.required],
    });
  }

  addMetrics() {
    const form = this.addMetric();
    this.queries.push(form);

    // Get the last index
    const lastIndex = this.queries.length - 1;

    // Subscribe to the value changes of the 'repeatedMeasure' form control of the new row
    this.repeatedMeasureSubscriptions[lastIndex] = (<UntypedFormArray>this.queryForm.get('queries'))
      .at(lastIndex)
      .get('repeatedMeasure')
      .valueChanges.subscribe((selectedValue) => {
        // set fileredStats for the repeated metrics:
        let {
          metadata: { type },
        } = this.selectedNode[lastIndex];
        if (
          type === IMetricMetaData.CATEGORICAL &&
          (selectedValue === REPEATED_MEASURE.count || selectedValue === REPEATED_MEASURE.percentage)
        ) {
          type = IMetricMetaData.CONTINUOUS;
        }
        this.filteredStatistic$[lastIndex] = this.setFilteredStatistic(type);
      });
    const scrollTableType = 'metricTable';
    this.updateView(scrollTableType);
    this.setQueryIndex(lastIndex);
    this.ManageKeysControl(this.queryIndex, 0);
  }

  removeMetric(queryIndex: number) {
    // unsubscribe from the 'repeatedMeasure' value changes for the query at this index
    if (this.repeatedMeasureSubscriptions[queryIndex]) {
      this.repeatedMeasureSubscriptions[queryIndex].unsubscribe();
      // remove the subscription from the array
      this.repeatedMeasureSubscriptions.splice(queryIndex, 1);
    }
    this.queries.removeAt(queryIndex);
    if (this.experimentInfo) {
      const deletedQuery = this.experimentInfo.queries[queryIndex];
      if (deletedQuery) {
        this.experimentInfo.queries.splice(queryIndex, 1);
      }
    }
    this.experimentDesignStepperService.experimentStepperDataChanged();
    // reset options for metric keys:
    this.filteredStatistic$[queryIndex] = [];
    this.firstSelectedNode[queryIndex] = null;
    this.optionsSub();
    this.setQueryIndex(this.queryIndex - 1);
    this.updateView();
  }

  getMetricPlaceHolder(keyIndex: number) {
    if (keyIndex === 0 || keyIndex === 2)
      return this.translate.instant('home.new-experiment.metrics.metric.placeholder.text');
    if (keyIndex === 1) return this.translate.instant('home.new-experiment.metrics.key.placeholder.text');
  }

  isMetricRepeated(selectedNode, queryIndex: number, editMode = false) {
    if (this.experimentInfo && queryIndex && queryIndex + 1 <= this.experimentInfoQueriesLength && !editMode) {
      let key;
      if (this.experimentInfo.queries[queryIndex].metric.key != undefined) {
        key = this.experimentInfo.queries[queryIndex].metric.key;
      } else {
        key = this.experimentInfo.queries[queryIndex].metric;
      }
      const rootKey = key.split(METRICS_JOIN_TEXT);
      return rootKey.length > 1 ? true : false;
    } else {
      return selectedNode !== undefined && selectedNode.children.length ? true : false;
    }
  }

  removeMetricName(metric) {
    delete metric.metricKey;
    return metric;
  }

  checkMetricKeyRequiredError(metricKeys: any) {
    for (let i = 0; i < metricKeys.length; i++) {
      if (!metricKeys[i]?.metricKey) {
        this.queryMetricKeyError.push(true);
      }
    }
  }

  checkQueryNameRequiredError(queryName: any) {
    if (!queryName) {
      this.queryNameError.push(true);
    }
  }

  checkStatisticRequiredError(statistic: any) {
    if (!statistic) {
      this.queryStatisticError.push(true);
    }
  }

  checkComparisonStatisticRequiredError(compareFn: any, compareValue: any) {
    if (!compareFn || !compareValue) {
      this.queryComparisonStatisticError.push(true);
    }
  }

  checkMetricFromDropDownError(type: any) {
    if (!type) {
      this.queryMetricDropDownError.push(true);
    }
  }

  filteredMetricKeys(queryIndex: number, keyIndex: number) {
    // Prepare filteredMetrics for each query and its keys for new experiment and for experimentInfo while in edit Mode
    const keysArray = this.queries.at(queryIndex).get('keys') as UntypedFormArray;
    const filteredMetric = keysArray
      .at(keyIndex)
      .get('metricKey')
      .valueChanges.pipe(
        startWith<string>(''),
        map((key) => {
          if (keyIndex - 1 >= 0) {
            const { metricKey } = keysArray.at(keyIndex - 1).value;
            if (metricKey) {
              this.options = metricKey.children;
            }
          }
          if (keyIndex === 0) {
            this.optionsSub();
          }
          return key ? this._filter(key) : this.options ? this.options.slice() : [];
        })
      );
    return filteredMetric;
  }

  ManageKeysControl(queryIndex: number, keyIndex: number) {
    if (keyIndex === 0) {
      this.optionsSub();
      const filteredMetric = this.filteredMetricKeys(queryIndex, keyIndex);
      this.filteredMetrics1$[queryIndex] = filteredMetric;
    } else if (keyIndex === 1) {
      const filteredMetric = this.filteredMetricKeys(queryIndex, keyIndex);
      this.filteredMetrics2$[queryIndex] = filteredMetric;
    } else {
      const filteredMetric = this.filteredMetricKeys(queryIndex, keyIndex);
      this.filteredMetrics3$[queryIndex] = filteredMetric;
    }
  }

  selectExistingMetricNode(prevMetricObj = null, nextKey = null, queryIndex: number, keyIndex: number) {
    if (prevMetricObj) {
      let nextMetricObj;
      if (keyIndex === 0) {
        nextMetricObj = this.allMetrics.find((metric) => metric.key === nextKey);
      } else {
        nextMetricObj = prevMetricObj.children.find((metric) => metric.key === nextKey);
      }
      if (prevMetricObj.children.length) {
        this.addMoreSelectKey(nextMetricObj, queryIndex);
        this.ManageKeysControl(queryIndex, keyIndex);
      } else {
        this.selectedNode[queryIndex] = nextMetricObj;
        // reset options for metric keys:
        this.optionsSub();
      }
    }
  }

  handleFirstRepeatMetricNode(queryIndex: number, keyIndex: number) {
    this.ManageKeysControl(queryIndex, 0);
    // if we don't have repeat metrics
    if (this.getKeys(queryIndex).length !== 3) {
      // push middle node from addMoreSelectKey
      this.addMoreSelectKey(null, queryIndex);
      this.ManageKeysControl(queryIndex, keyIndex + 1);
      // push leaf node of the repeated metric
      this.getKeys(queryIndex).push(this.addKey(null));
    } else {
      // if its already repeat metric earlier just prepare filtered list of metrics for leaf node
      this.ManageKeysControl(queryIndex, keyIndex + 1);
    }
  }

  handleBackBtnClick() {
    return this.queryForm.dirty && this.experimentDesignStepperService.experimentStepperDataChanged();
  }

  selectRepeatMetricNode(event = null, queryIndex: number, keyIndex: number) {
    // if it is the first Node of the repeated metric, add two new nodes for the first time selection
    if (keyIndex === 0) {
      this.handleFirstRepeatMetricNode(queryIndex, keyIndex);
    } else if (keyIndex === 1) {
      // if it's the middle node of repeated metric, prepare filtered list of metrics for leaf node
      this.ManageKeysControl(queryIndex, keyIndex + 1);
    } else if (keyIndex === 2) {
      // if it's the leaf node of repeated metric, prepare filtered list of metrics for the first node
      this.ManageKeysControl(queryIndex, 0);
    }
    // set selectedNode for first key of repeated metrics:
    if (event.option.value.metricKey !== undefined) {
      this.firstSelectedNode[queryIndex] = event.option.value.metricKey;
    } else {
      this.firstSelectedNode[queryIndex] = event.option.value;
      this.selectedNode[queryIndex] = event.option.value;
    }
    // set fileredStats for the repeated metrics:
    const {
      metadata: { type },
    } = this.selectedNode[queryIndex];
    this.filteredStatistic$[queryIndex] = this.setFilteredStatistic(type);
  }

  switchRepeatToSimpleMetric(event = null, queryIndex: number, keyIndex: number) {
    this.getKeys(queryIndex).clear();
    this.addMoreSelectKey(event.option.value.key, queryIndex);
    this.ManageKeysControl(queryIndex, keyIndex);
    const metric = this.allMetrics.find((metric) => metric.key === event.option.value.key);
    this.firstSelectedNode[queryIndex] = metric;
    this.selectedNode[queryIndex] = metric;
    const {
      metadata: { type },
    } = this.selectedNode[queryIndex];
    this.filteredStatistic$[queryIndex] = this.setFilteredStatistic(type);
    // set editMode to true to avoid isMetricRepeated() function to take experimentInfo instead of current form changes
    this.editMode = true;
  }

  selectSimpleMetricNode(queryIndex: number, keyIndex: number) {
    this.ManageKeysControl(queryIndex, keyIndex);
    // if the selected option is a simple metric and it was earlier not a repeated metrics, set selectedNode
    const keys = this.getKeys(queryIndex).getRawValue();
    this.selectedNode[queryIndex] = keys[keys.length - 1].metricKey;
    const {
      metadata: { type },
    } = this.selectedNode[queryIndex];
    this.filteredStatistic$[queryIndex] = this.setFilteredStatistic(type);
  }

  selectNewMetricNode(event = null, queryIndex: number, keyIndex: number) {
    // If the selected option is a repeated metric, add two new nodes for first time selection
    if (event.option.value.children.length) {
      this.selectRepeatMetricNode(event, queryIndex, keyIndex);
    } else {
      // if the selected option is not a repeated metric or it is the leaf node of repeated metric, set selectedNode
      // if the selected option is a simple metric and it was earlier a repeated metrics, we will clear the keys and set selectedNode
      if (keyIndex === 0 && this.getKeys(queryIndex).length > 1) {
        this.switchRepeatToSimpleMetric(event, queryIndex, keyIndex);
      } else {
        this.selectSimpleMetricNode(queryIndex, keyIndex);
      }
      // handling leaf node of repeated metrics
      const metric = this.allMetrics.find((metric) => metric.key === event.option.value.key);
      this.selectedNode[queryIndex] = metric;
      if (!this.selectedNode[queryIndex]) {
        this.selectedNode[queryIndex] = event.option.value;
      }
      // reset options for metric keys:
      this.optionsSub();
    }
  }

  selectedOption(
    event = null,
    prevMetricObj = null,
    nextKey = null,
    queryIndex: number = null,
    keyIndex: number = null
  ) {
    // for setting up the metric key in the form from experimentInfo
    if (event === null) {
      this.selectExistingMetricNode(prevMetricObj, nextKey, queryIndex, keyIndex);
    } else {
      // for selectedOption event fired from UI
      this.selectNewMetricNode(event, queryIndex, keyIndex);
    }
  }

  updateView(type?: string) {
    this.metricsDataSource.next(this.queries.controls);
    if (type) {
      this[type].nativeElement.scroll({
        top: this[type].nativeElement.scrollHeight - 96,
        behavior: 'smooth',
      });
    }
  }

  emitEvent(eventType: NewExperimentDialogEvents) {
    switch (eventType) {
      case NewExperimentDialogEvents.CLOSE_DIALOG:
        if (this.queryForm.dirty || this.experimentDesignStepperService.getHasExperimentDesignStepperDataChanged()) {
          this.dialogService
            .openConfirmDialog()
            .afterClosed()
            .subscribe((res) => {
              if (res) {
                this.emitExperimentDialogEvent.emit({ type: eventType });
              }
            });
        } else {
          this.emitExperimentDialogEvent.emit({ type: eventType });
        }
        break;
      case NewExperimentDialogEvents.SEND_FORM_DATA:
        if (this.queryForm.dirty) {
          this.experimentDesignStepperService.experimentStepperDataChanged();
        }
        this.saveData(eventType);
        break;
      case NewExperimentDialogEvents.SAVE_DATA:
        this.saveData(eventType);
        break;
    }
  }

  saveData(eventType) {
    this.queryMetricKeyError = [];
    this.queryStatisticError = [];
    this.queryComparisonStatisticError = [];
    this.queryMetricDropDownError = [];
    this.queryNameError = [];
    const monitoredMetricsFormData = this.queryForm.getRawValue();
    monitoredMetricsFormData.queries = monitoredMetricsFormData.queries.map((query, index) => {
      let { keys } = query;
      const { operationType, queryName, compareFn, compareValue, repeatedMeasure } = query;

      if (keys) {
        // check for metric key required except default row:
        if (keys[0].metricKey || operationType || queryName || compareFn || compareValue) {
          this.checkMetricKeyRequiredError(keys);
        }
        const metrics = [...keys];
        keys = keys
          .filter((key) => key.metricKey !== null)
          .map((key) => (key.metricKey.key ? key.metricKey.key : key.metricKey));
        if (keys.length) {
          this.checkQueryNameRequiredError(queryName);
          this.checkStatisticRequiredError(operationType);
          this.checkMetricFromDropDownError(metrics[keys.length - 1].metricKey['metadata']);

          if (metrics[keys.length - 1].metricKey['metadata']) {
            const {
              metadata: { type },
            } = metrics[keys.length - 1].metricKey;

            if (type === IMetricMetaData.CATEGORICAL) {
              this.checkComparisonStatisticRequiredError(compareFn, compareValue);
            }
          }
          let queryObj: Query = {
            name: queryName,
            query: {
              operationType,
            },
            metric: {
              key: keys.join(METRICS_JOIN_TEXT),
            },
            repeatedMeasure,
          };
          if (compareFn && !!compareValue) {
            queryObj = {
              ...queryObj,
              query: {
                ...queryObj.query,
                compareFn,
                compareValue,
              },
            };
          }
          return this.experimentInfo
            ? { ...this.experimentInfo.queries[index], ...queryObj }
            : queryObj.metric.key
            ? { ...queryObj }
            : { ...this.removeMetricName(queryObj) };
        }
      }
    });

    if (
      this.queryMetricKeyError.length === 0 &&
      this.queryStatisticError.length === 0 &&
      this.queryComparisonStatisticError.length === 0 &&
      this.queryMetricDropDownError.length === 0 &&
      this.queryNameError.length === 0
    ) {
      this.emitExperimentDialogEvent.emit({
        type: eventType,
        formData: monitoredMetricsFormData,
        path: NewExperimentPaths.MONITORED_METRIC,
      });

      if (eventType == NewExperimentDialogEvents.SAVE_DATA) {
        this.experimentDesignStepperService.experimentStepperDataReset();
        this.queryForm.markAsPristine();
      }
    }
  }

  ngOnChanges() {
    if (this.isContextChanged || this.isExperimentTypeChanged) {
      this.isContextChanged = false;
      this.isExperimentTypeChanged = false;
      this.queries.clear();
      this.metricsDataSource.next(this.queries.controls);
    }
  }

  ngOnDestroy() {
    this.allMetricsSub.unsubscribe();
  }
}
