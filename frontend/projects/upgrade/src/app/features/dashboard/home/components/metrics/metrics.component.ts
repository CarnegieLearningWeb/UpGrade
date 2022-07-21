import {
  ChangeDetectionStrategy,
  ViewChild,
  ElementRef,
  OnChanges
} from '@angular/core';

import { AbstractControl } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { NewExperimentDialogEvents, NewExperimentDialogData, NewExperimentPaths } from '../../../../../core/experiments/store/experiments.model';
import { Component, OnInit, OnDestroy, Input, EventEmitter, Output } from '@angular/core';
import { Subscription, Observable } from 'rxjs';
import { OPERATION_TYPES, Query, METRICS_JOIN_TEXT, IMetricMetaData, REPEATED_MEASURE } from '../../../../../core/analysis/store/analysis.models';
import { AnalysisService } from '../../../../../core/analysis/analysis.service';
import { ExperimentVM } from '../../../../../core/experiments/store/experiments.model';
import { FormGroup, FormBuilder, Validators, FormArray } from '@angular/forms';
import { startWith, map } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';


@Component({
  selector: 'home-monitored-metrics',
  templateUrl: './metrics.component.html',
  styleUrls: ['./metrics.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MonitoredMetricsComponent implements OnInit, OnChanges, OnDestroy {

  @Input() experimentInfo: ExperimentVM;
  @Input() currentContext: string;
  @Input() isContextChanged: boolean;
  @Input() animationCompleteStepperIndex: Number;
  @Output() emitExperimentDialogEvent = new EventEmitter<NewExperimentDialogData>();
  @ViewChild('metricTable', { static: false, read: ElementRef }) metricTable: ElementRef;

  queryForm: FormGroup;

  // Used for displaying metrics
  allMetricsSub: Subscription;
  allMetrics = [];

  queryOperations = [];
  comparisonFns = [
    { value: '=', viewValue: 'equal' },
    { value: '<>', viewValue: 'not equal' }
  ];
  
  // Used for metrics auto complete dropdown
  filteredMetrics$: Observable<any[]>[] = [];
  filteredStatistic$ = [];

  options: any[] = [];
  selectedNode: any[] = [];
  firstSelectedNode: any[] = [];
  controlTitles = ['Type', 'Key', 'Metric']; // Used to show different titles in grouped metrics

  metricsDataSource = new BehaviorSubject<AbstractControl[]>([]);

  metricsDisplayedColumns = ['keys', 'operationType', 'queryName', 'removeMetric'];
  queryIndex: number = 0;
  editMode: Boolean = false;

  queryNameError = [];
  queryStatisticError = [];
  queryComparisonStatisticError = [];

  constructor(
    private analysisService: AnalysisService,
    private _formBuilder: FormBuilder,
    private translate: TranslateService,
  ) { }

  optionsSub() {
    this.allMetricsSub = this.analysisService.allMetrics$.subscribe(metrics => {
      this.allMetrics = metrics;
      this.options = this.allMetrics;
    });
  }

  ngOnInit() {
    this.optionsSub();

    this.queryForm = this._formBuilder.group({
      queries: this._formBuilder.array([ this._formBuilder.group({
        keys: this._formBuilder.array([this.addKey()]),
        queryName: [null, Validators.required],
        operationType: [null, Validators.required],
        compareFn: [null, Validators.required],
        compareValue: [null, Validators.required],
        repeatedMeasure: [REPEATED_MEASURE.mostRecent, Validators.required]
        })
      ])
    });

    // populate values in form to update experiment if experiment data is available in edit mode
    if (this.experimentInfo) {
      // Remove the default empty row
      this.queries.removeAt(0);
      this.experimentInfo.queries.forEach((query, queryIndex) => {
        let key;
        if (query.metric.key) {
          key = query.metric.key;
        } else {
          key = query.metric;
        }

        // separating keys from metric
        const rootKey = key.split(METRICS_JOIN_TEXT);

        // set selectedNode for first key of simple/repeated metrics
        let metricObj = this.allMetrics.find(metric => metric.key === rootKey[0]);
        this.firstSelectedNode[queryIndex] = metricObj;
        this.selectedNode[queryIndex] = metricObj;
        const { metadata: { type } } = this.selectedNode[queryIndex];
        this.filteredStatistic$[queryIndex] = this.setFilteredStatistic(type);

        // push first key in query form:
        if (query.query.compareFn && !!query.query.compareValue) {
          this.queries.push(this.addMetric(rootKey[0], query.name, query.query.operationType, query.query.compareFn, query.query.compareValue, query.repeatedMeasure));
        } else {
          this.queries.push(this.addMetric(rootKey[0], query.name, query.query.operationType, null, null, query.repeatedMeasure));
        }

        // push remaining keys in query form in case of repeated metrics
        let childKey;
        if (rootKey.length > 1) {
          rootKey.map( (key, keyindex) => {
            if (keyindex != 0) {
              this.selectedNode[this.queryIndex] = metricObj
              // call select option for first key of grouped metrics:
              this.selectedOption(null, metricObj, key, queryIndex, keyindex);
              this.optionsSub();
              metricObj = metricObj.children;
              metricObj = metricObj.find(metric => metric.key == key);
              childKey = key;
            }
          });
          this.selectedOption(null, metricObj, childKey, queryIndex, rootKey.length-1);
        }
        this.selectedOption(null, metricObj, null, queryIndex, rootKey.length - 1);
        this.setQueryIndex(this.queryIndex+1);
        this.ManageKeysControl(queryIndex, 0);
      });
    }

    if (this.queryForm.get('queries').get('operationType')) {
      this.queryForm.get('queries').get('operationType').valueChanges.subscribe(operation => {
        if (operation === OPERATION_TYPES.PERCENTAGE) {
          this.queryForm.get('queries').get('compareFn').setValidators([Validators.required]);
          this.queryForm.get('queries').get('compareValue').setValidators([Validators.required]);
        } else {
          this.queryForm.get('queries').get('compareFn').clearValidators();
          this.queryForm.get('queries').get('compareValue').clearValidators();
        }
        this.queryForm.get('queries').get('compareFn').updateValueAndValidity()
        this.queryForm.get('queries').get('compareValue').updateValueAndValidity()
      });
    }
    if (this.queryForm.get('queries').get('compareFn')) {
      this.queryForm.get('queries').get('compareFn').valueChanges.subscribe(compareFn => {
        if (compareFn) {
          this.queryForm.get('queries').get('compareValue').setValidators([Validators.required]);
        } else {
          this.queryForm.get('queries').get('compareValue').clearValidators();
          this.queryForm.get('queries').get('compareValue').setValue(null);
        }
        this.queryForm.get('queries').get('compareValue').updateValueAndValidity()
      });
    }
    this.updateView();

    // Bind predefined values of metrics from backend env file for auto complete:
    // const metricsFormControl = this.queries as FormArray;
    // metricsFormControl.controls.forEach((_, queryIndex) => {
    //   this.ManageKeysControl(queryIndex, null)
    // });
  }

  // getters
  get queries(): FormArray {
    return this.queryForm.get('queries') as FormArray;
  }

  get NewExperimentDialogEvents() {
    return NewExperimentDialogEvents;
  }

  get IMetricMetadata() {
    return IMetricMetaData;
  }

  get RepeatedMeasure() {
    const repeatedMeasure = Object.values(REPEATED_MEASURE);
    return repeatedMeasure;
  }

  get experimentInfoQueriesLength() {
    return this.experimentInfo.queries.length;
  }

  getKeys(queryIndex: number) { 
    const keysArray = this.queries.at(queryIndex).get('keys') as FormArray;
    return keysArray;
  }

  setQueryIndex(queryIndex: number) {
    this.queryIndex = queryIndex;
  }

  addKey(key = null) {
    return this._formBuilder.group({
      metricKey: [key, Validators.required]
    });
  }

  displayFn(node?: any): string | undefined {
    if ( node && node.key ) {
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
    return this.options.filter(option => option.key.toLowerCase().indexOf(filterValue) === 0);
  }

  setFilteredStatistic(type: string) {
    if (type && type === IMetricMetaData.CONTINUOUS) {
      this.queryOperations = [
        { value: OPERATION_TYPES.SUM, viewValue: 'Sum' },
        { value: OPERATION_TYPES.MIN, viewValue: 'Min' },
        { value: OPERATION_TYPES.MAX, viewValue: 'Max' },
        { value: OPERATION_TYPES.COUNT, viewValue: 'Count' },
        { value: OPERATION_TYPES.AVERAGE, viewValue: 'Mean' },
        { value: OPERATION_TYPES.MODE, viewValue: 'Mode' },
        { value: OPERATION_TYPES.MEDIAN, viewValue: 'Median' },
        { value: OPERATION_TYPES.STDEV, viewValue: 'Standard Deviation' }
      ];
    } else if (type && type === IMetricMetaData.CATEGORICAL) {
      this.queryOperations = [
        { value: OPERATION_TYPES.COUNT, viewValue: 'Count' },
        { value: OPERATION_TYPES.PERCENTAGE, viewValue: 'Percentage' }
      ];
    }
    return this.queryOperations;
  }

  addMoreSelectKey(key = null, queryIndex: number, keyIndex: number) {
    this.getKeys(queryIndex).push(this.addKey(key));
    this.ManageKeysControl(queryIndex, keyIndex);
  }

  addMetric(key = null, queryName = null, operationType = null, compareFn = null, compareValue = null, repeatedMeasure = REPEATED_MEASURE.mostRecent) {
    return  this._formBuilder.group({
      keys: this._formBuilder.array([this.addKey(key)]),
      queryName: [queryName, Validators.required],
      operationType: [operationType, Validators.required],
      compareFn: [compareFn, Validators.required],
      compareValue: [compareValue, Validators.required],
      repeatedMeasure: [repeatedMeasure, Validators.required]
    });
  }

  addMetrics() {
    const form = this.addMetric();
    this.queries.push(form);
    const scrollTableType = 'metricTable';
    this.updateView(scrollTableType);
    const index = this.queries.length;
    this.setQueryIndex(index-1);
    const metricFormControl = this.queries.at(index-1).get('keys') as FormArray;
    this.ManageKeysControl(this.queryIndex, metricFormControl.controls.length - 1);
  }

  removeMetric(queryIndex: number) {
    this.queries.removeAt(queryIndex);
    if (this.experimentInfo) {
      const deletedQuery = this.experimentInfo.queries[queryIndex];
      if (deletedQuery) {
        delete this.experimentInfo.queries[queryIndex];
      }
    }
    // reset options for metric keys:
    this.optionsSub();
    this.filteredMetrics$ = [];
    this.updateView();
  }

  getMetricPlaceHolder(keyIndex: number) {
    if (keyIndex == 0 || keyIndex == 2) return this.translate.instant('home.new-experiment.metrics.metric.placeholder.text');
    if (keyIndex == 1) return this.translate.instant('home.new-experiment.metrics.key.placeholder.text');
  }

  isMetricRepeated(selectedNode, queryIndex: number, editMode = false) {
    if (this.experimentInfo && queryIndex && queryIndex+1 <= this.experimentInfoQueriesLength && !editMode) {
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

  checkQueryNameError(queryName){
    if (queryName == null || queryName === '') {
      this.queryNameError.push(true);
    }
  }

  checkStatisticError(statistic: any) {
    if (statistic == null || statistic === '') {
      this.queryStatisticError.push(true);
    }
  }

  checkComparisonStatisticError(compareFn: any, compareValue: any) {
    if (compareFn == null || compareFn === '' || compareValue == null || compareValue === '') {
      this.queryComparisonStatisticError.push(true);
    }
  }

  ManageKeysControl(queryIndex: number, keyIndex: number) {
    let keysArray;
    if (queryIndex == null) {
      queryIndex = this.queryIndex;
    }
    // Prepare filteredMetrics for each query and its keys for experimentInfo while in edit Mode
    if (this.experimentInfo) {
      if (this.experimentInfo.queries.length > 0) {
        keysArray = this.queries.at(queryIndex).get('keys') as FormArray;
        this.filteredMetrics$[keyIndex] = keysArray.at(keyIndex).get('metricKey').valueChanges
        .pipe(
          startWith<string>(''),
          map(key => {
            if (keyIndex - 1 >= 0) {
              const { metricKey } = keysArray.at(keyIndex - 1).value;
              this.options = metricKey.children;
            }
            return key ? this._filter(key) : this.options ? this.options.slice() : [];
          })
        );
      }
    } else {
      // Prepare filteredMetrics for each query and its keys for new experiment
      keysArray = this.queries.at(queryIndex).get('keys') as FormArray;
      this.filteredMetrics$[keyIndex] = keysArray.at(keyIndex).get('metricKey').valueChanges
      .pipe(
        startWith<string>(''),
        map(key => {
          if (keyIndex - 1 >= 0) {
            const { metricKey } = keysArray.at(keyIndex - 1).value;
            this.options = metricKey.children;
          }
          return key ? this._filter(key) : this.options ? this.options.slice() : [];
        })
      );
    }
  }

  selectedOption(event = null, metric = null, key = null,  queryIndex: number = null, keyIndex: number = null) {
    // for setting up the metric key in the form from experimentInfo
    if (event == null) {
      if (metric) {
        if (metric.children.length) {
          this.addMoreSelectKey(key, queryIndex, keyIndex);
        } else {
          this.selectedNode[queryIndex] = metric;
          // reset options for metric keys:
          this.optionsSub();
          this.filteredMetrics$ = [];
        }
      }
    } else { // for selectedOption event fired from UI
      
      // If the selected option is a repeated metric, add two new nodes
      if (event.option.value.children.length) {

        // set selectedNode for first key of repeated metrics:
        if (event.option.value.metricKey != undefined ) {
          this.firstSelectedNode[queryIndex] = event.option.value.metricKey;
        } else {
          this.firstSelectedNode[queryIndex] = event.option.value;
        }
        
        // set fileredStats for the repeated metrics:
        const { metadata: { type } } = this.firstSelectedNode[queryIndex];
        this.filteredStatistic$[queryIndex] = this.setFilteredStatistic(type);

        // if it is the first Node of the repeated metric, add two new nodes
        if (keyIndex == 0) {
          // push middle node from addMoreSelectKey
          this.addMoreSelectKey(null, queryIndex, keyIndex+1);
          // push leaf node of the repeated metric
          this.getKeys(queryIndex).push(this.addKey(null));
        } else {
          // if its middle node just prepare filtered list of metrics for leaf node
          this.ManageKeysControl(queryIndex, keyIndex+1);
        }
      } else { // if the selected option is not a repeated metric or it is the leaf node of repeated metric, set selectedNode
        
        // if the selected option is a simple metric and it was earlier a repeated metrics, we will clear the keys and set selectedNode
        if (keyIndex == 0 && this.getKeys(queryIndex).length > 1) {
          this.getKeys(queryIndex).clear();
          this.addMoreSelectKey(event.option.value.key, queryIndex, keyIndex);
          let metric = this.allMetrics.find(metric => metric.key === event.option.value.key);
          this.firstSelectedNode[queryIndex] = metric;
          this.selectedNode[queryIndex] = metric;
          const { metadata: { type } } = this.selectedNode[queryIndex];
          this.filteredStatistic$[queryIndex] = this.setFilteredStatistic(type);
          // set editMode to true to avoid isMetricRepeated() function to take experimentInfo instead of current form changes
          this.editMode = true;
        } else {
          // if the selected option is a simple metric and it was earlier not a repeated metrics, set selectedNode
          const keys = this.getKeys(queryIndex).getRawValue();
          this.selectedNode[queryIndex] = keys[keys.length - 1].metricKey;
          const { metadata: { type } } = this.selectedNode[queryIndex];
          this.filteredStatistic$[queryIndex] = this.setFilteredStatistic(type);
        }
        // handling leaf node of repeated metrics
        let metric = this.allMetrics.find(metric => metric.key === event.option.value.key);
        this.selectedNode[queryIndex] = metric;
        // reset options for metric keys:
        this.optionsSub();
      }
    }
  }

  updateView(type?: string) {
    this.metricsDataSource.next(this.queries.controls);
    if (type) {
      this[type].nativeElement.scroll({
        top: this[type].nativeElement.scrollHeight,
        behavior: 'smooth'
      });
    }
  }

  emitEvent(eventType: NewExperimentDialogEvents) {
    switch (eventType) {
      case NewExperimentDialogEvents.CLOSE_DIALOG:
        this.emitExperimentDialogEvent.emit({ type: eventType });
        break;
      case NewExperimentDialogEvents.SEND_FORM_DATA:
      case NewExperimentDialogEvents.SAVE_DATA:
        this.queryNameError = [];
        this.queryStatisticError = []; 
        this.queryComparisonStatisticError = [];
        const monitoredMetricsFormData = this.queryForm.getRawValue();
        monitoredMetricsFormData.queries = monitoredMetricsFormData.queries.map(
          (query, index) => {
            let { keys, operationType, queryName, compareFn, compareValue, repeatedMeasure } = query;
            if (keys) {
              keys = keys.filter((key) => key.metricKey !== null).map(key => key.metricKey.key ? key.metricKey.key : key.metricKey);
              if (keys.length) {
                this.checkQueryNameError(queryName);
                this.checkStatisticError(operationType);
                if (operationType && (operationType === OPERATION_TYPES.COUNT || operationType === OPERATION_TYPES.PERCENTAGE)) {
                  this.checkComparisonStatisticError(compareFn, compareValue);
                }

                let queryObj: Query = {
                  name: queryName,
                  query: {
                    operationType
                  },
                  metric: {
                    key: keys.join(METRICS_JOIN_TEXT)
                  },
                  repeatedMeasure
                };
                if (compareFn && !!compareValue) {
                  queryObj = {
                    ...queryObj,
                    query: {
                      ...queryObj.query,
                      compareFn,
                      compareValue
                    }
                  }
                }
                return this.experimentInfo
                  ? ({ ...this.experimentInfo.queries[index], ...queryObj })
                  : (queryObj.metric.key 
                    ? ({...queryObj}) 
                    : ({...this.removeMetricName(queryObj)})
                  );
              } else {
                  return;
              }
            } else {
              return;
            }
          });

        if (this.queryNameError.length == 0 && this.queryStatisticError.length == 0 && this.queryComparisonStatisticError.length == 0) {
          this.emitExperimentDialogEvent.emit({
            type: eventType,
            formData: monitoredMetricsFormData,
            path: NewExperimentPaths.MONITORED_METRIC
          });
          break;
        }
    }
  }

  ngOnChanges() {
    if (this.isContextChanged) {
      this.isContextChanged = false;
      this.queries.clear();
      this.queries.push(this.addMetric());
      this.metricsDataSource.next(this.queries.controls);
    }
  }

  ngOnDestroy() {
    this.allMetricsSub.unsubscribe();
  }
}
