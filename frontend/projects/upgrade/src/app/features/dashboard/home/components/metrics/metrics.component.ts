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
  queryIndex = 0;

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

    // Bind predefined values of metrics from backend env file for auto complete:
    const metricsFormControl = this.queries as FormArray;
    metricsFormControl.controls.forEach((_, index) => {
      this.ManageKeysControl(index)
    });

    // populate values in form to update experiment if experiment data is available
    if (this.experimentInfo) {
      // Remove previously added query instance.
      this.queries.removeAt(0);
      this.experimentInfo.queries.forEach(query => { 
        let key;
        if (query.metric.key) {
          key = query.metric.key;
        } else {
          key = query.metric;
        }
        // separating keys in case of grouped metrics:
        const rootKey = key.split(METRICS_JOIN_TEXT);
        // set selectedNode for first key of grouped metrics:
        let metric = this.allMetrics.find(metric => metric.key === rootKey[0]);
        this.firstSelectedNode[this.queryIndex] = metric;
        this.selectedNode[this.queryIndex] = metric;
        const { metadata: { type } } = this.selectedNode[this.queryIndex];
        this.filteredStatistic$[this.queryIndex] = this.setFilteredStatistic(type);
        // push first key in query form:
        if (query.query.compareFn && !!query.query.compareValue) {
          this.queries.push(this.addMetric(rootKey[0], query.name, query.query.operationType, query.query.compareFn, query.query.compareValue, query.repeatedMeasure));
        } else {
          this.queries.push(this.addMetric(rootKey[0], query.name, query.query.operationType, null, null, query.repeatedMeasure));
        }
        // push remaining keys in query form:
        let child_key;
        if (rootKey.length > 1) {
          rootKey.map( (key, index) => {
            if (index != 0) {
              this.selectedNode[this.queryIndex] = metric
              // call select option for first key of grouped metrics:
              this.selectedOption(null, metric, key);
              this.optionsSub();
              metric = metric.children;
              metric = metric.find(metric => metric.key == key);
              child_key = key;
            }
          });
          this.selectedOption(null, metric, child_key);
        }
        this.selectedOption(null, metric, null);
        this.setQueryIndex(this.queryIndex+1);
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
  }

  get queries(): FormArray {
    return this.queryForm.get('queries') as FormArray;
  }

  get metricKeys() { 
    const keysArray = this.queries.at(this.queryIndex).get('keys') as FormArray;
    return keysArray;
  }

  getKeys(index: number) { 
    const keysArray = this.queries.at(index).get('keys') as FormArray;
    return keysArray;
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

  setQueryIndex(index) {
    this.queryIndex = index;
  }

  addKey(key = null) {
    return this._formBuilder.group({
      metricKey: [key, Validators.required]
    });
  }

  ManageKeysControl(index: number) {
    const keysArray = this.queries.at(this.queryIndex).get('keys') as FormArray;
    this.filteredMetrics$[index] = keysArray.at(index).get('metricKey').valueChanges
      .pipe(
      startWith<string>(''),
      map(key => {
        if (index - 1 >= 0) {
          const { metricKey } = keysArray.at(index - 1).value;
          this.options = metricKey.children;
        }
        return key ? this._filter(key) : this.options ? this.options.slice() : [];
      })
      );
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

  addMoreSelectKey(key = null) {
    this.metricKeys.push(this.addKey(key));
    this.ManageKeysControl(this.metricKeys.length - 1);
  }

  selectedOption(event = null, metric = null, key = null, formIndex = null) {
    // for edit mode
    if (event == null) {
      if (metric) {
        if (metric.children.length) {
          // this.metricKeys.at(this.metricKeys.length - 1).disable();
          this.addMoreSelectKey(key);
        } else {
          // this.metricKeys.at(this.metricKeys.length - 1).disable();
          this.selectedNode[this.queryIndex] = metric;
          // reset options for metric keys:
          this.optionsSub();
          this.filteredMetrics$ = [];
        }
      }
    } else {
      if (event.option.value.children.length) {
        // set selectedNode for first key of grouped metrics:
        if (event.option.value.metricKey != undefined ) {
          this.firstSelectedNode[this.queryIndex] = event.option.value.metricKey;
        } else {
          this.firstSelectedNode[this.queryIndex] = event.option.value;
        }
        const { metadata: { type } } = this.firstSelectedNode[this.queryIndex];
        this.filteredStatistic$[this.queryIndex] = this.setFilteredStatistic(type);
        const repeatedMetric = this.isMetricRepeated(this.firstSelectedNode[this.queryIndex], this.queryIndex);
        if (repeatedMetric && formIndex == 0 && this.metricKeys.length != 3) {
          this.addMoreSelectKey();
          this.metricKeys.push(this.addKey(null));
        } else {
          this.ManageKeysControl(this.metricKeys.length - 1);
        }
      } else {
        if (formIndex == 0 && this.metricKeys.length > 1) {
          this.metricKeys.clear();
          this.addMoreSelectKey(event.option.value.key);
          let metric = this.allMetrics.find(metric => metric.key === event.option.value.key);
          this.selectedNode[this.queryIndex] = metric;
        } else {
          const keys = this.metricKeys.getRawValue();
          this.selectedNode[this.queryIndex] = keys[keys.length - 1].metricKey;
        }
        // this.metricKeys.at(this.metricKeys.length - 1).disable();
        const { metadata: { type } } = this.selectedNode[this.queryIndex];
        this.filteredStatistic$[this.queryIndex] = this.setFilteredStatistic(type);
        // reset options for metric keys:
        this.optionsSub();
      }
    }
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
    this.ManageKeysControl(metricFormControl.controls.length - 1);
  }

  removeMetric(groupIndex: number) {
    this.queries.removeAt(groupIndex);
    if (this.experimentInfo) {
      const deletedQuery = this.experimentInfo.queries[groupIndex];
      if (deletedQuery) {
        delete this.experimentInfo.queries[groupIndex];
      }
    }
    // reset options for metric keys:
    this.optionsSub();
    this.filteredMetrics$ = [];
    this.updateView();
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

  getMetricPlaceHolder(formIndex) {
    if (formIndex == 0 || formIndex == 2) return this.translate.instant('home.new-experiment.metrics.metric.placeholder.text');
    if (formIndex == 1) return this.translate.instant('home.new-experiment.metrics.key.placeholder.text');
  }

  isMetricRepeated(selectedNode, queryIndex) {
    if (this.experimentInfo && queryIndex && queryIndex+1 <= this.experimentInfoQueriesLength) {
      let key;
      if (this.experimentInfo.queries[queryIndex].metric.key != undefined) {
        key = this.experimentInfo.queries[queryIndex].metric.key;
      } else {
        key = this.experimentInfo.queries[queryIndex].metric;
      }
      
      const rootKey = key.split(METRICS_JOIN_TEXT);
      if (rootKey.length > 1) {
        return true;
      } else {
        return false;
      }
    } else {
      if ( selectedNode !== undefined && selectedNode.children.length) {
        return true;
      } else {
        return false;
      }
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
