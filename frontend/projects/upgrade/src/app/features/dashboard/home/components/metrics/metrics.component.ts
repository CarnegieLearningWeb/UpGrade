import {
  ChangeDetectionStrategy,
  ViewChild,
  ElementRef,
  OnChanges,
  SimpleChanges
} from '@angular/core';

import { AbstractControl } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { NewExperimentDialogEvents, NewExperimentDialogData, NewExperimentPaths } from '../../../../../core/experiments/store/experiments.model';
import { Component, OnInit, OnDestroy, Input, EventEmitter, Output } from '@angular/core';
import { Subscription, Observable } from 'rxjs';
import { OPERATION_TYPES, Query, METRICS_JOIN_TEXT, IMetricMetaData, REPEATED_MEASURE } from '../../../../../core/analysis/store/analysis.models';
import { AnalysisService } from '../../../../../core/analysis/analysis.service';
import { ExperimentVM } from '../../../../../core/experiments/store/experiments.model';
import { ExperimentService } from '../../../../../core/experiments/experiments.service';
import { FormGroup, FormBuilder, Validators, FormArray } from '@angular/forms';
import { startWith, map } from 'rxjs/operators';

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
  controlTitles = ['Type', 'Key', 'Metric']; // Used to show different titles in grouped metrics

  metricsDataSource = new BehaviorSubject<AbstractControl[]>([]);

  metricsDisplayedColumns = ['keys', 'operationType', 'queryName', 'removeMetric'];
  queryIndex = 0;

  constructor(
    private analysisService: AnalysisService,
    private experimentService: ExperimentService,
    private _formBuilder: FormBuilder,
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
        compareFn: [null],
        compareValue: [null],
        // repeatedMeasure: [REPEATED_MEASURE.mostRecent]
        repeatedMeasure: [null]

        })
      ])
    });

    // Bind predefined values of experiment points and ids from backend
    const metricsFormControl = this.queries as FormArray;
    metricsFormControl.controls.forEach((_, index) => {
      this.ManageKeysControl(index)
    });
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

    // populate values in form to update experiment if experiment data is available
    if (this.experimentInfo) {
      // Remove previously added group of queries
      this.queries.removeAt(0);
      this.experimentInfo.queries.forEach(query => {
        this.queries.push(this.addMetric(query.queryName, query.operationType, query.compareFn, query.compareValue, query.repeatedMeasure));
      });
    }
    this.updateView();
  }

  get queries(): FormArray {
    return this.queryForm.get('queries') as FormArray;
  }

  get metricKeys() { 
    const keysArray = this.queries.at(this.queryIndex).get('keys') as FormArray;
    console.log(keysArray);
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
    const temp = Object.values(REPEATED_MEASURE)
    return temp;
  }

  setQueryIndex(index) {
    this.queryIndex = index;
  }

  addKey() {
    return this._formBuilder.group({
      metricKey: [null, Validators.required]
    });
  }

  ManageKeysControl(index: number) {
    const keysArray = this.queries.at(this.queryIndex).get('keys') as FormArray;
    this.filteredMetrics$[index] = keysArray.at(index).get('metricKey').valueChanges
      .pipe(
      startWith<string>(''),
      map(key => {
        for (let i = index - 1; i >= 0; i--) {
           keysArray.at(i).disable();
        }
        if (index - 1 >= 0) {
          const { metricKey } = keysArray.at(index - 1).value;
          this.options = metricKey.children;
        }
        // const temp1 = this._filter(key, index);
        // const temp2 = this.options;
        // const temp3 = this.options.slice();
        // const result = key ? this._filter(key, index) : this.options ? this.options.slice() : [];
        return key ? this._filter(key, index) : this.options ? this.options.slice() : [];
      })
      );
  }

  displayFn(node?: any): string | undefined {
    return node ? node.key : undefined;
  }

  private _filter(key: any, index): any[] {
    let filterValue;
    if (typeof key === 'string') {
      filterValue = key.toLowerCase();
    } else {
      filterValue = key.key.toLowerCase();
    }
    return this.options.filter(option => option.key.toLowerCase().indexOf(filterValue) === 0);
  }

  addMoreSelectKey() {
    this.metricKeys.push(this.addKey());
    this.ManageKeysControl(this.metricKeys.length - 1);
  }

  selectedOption(event) {
    if (event.option.value) {
      if (event.option.value.children.length) {
        this.addMoreSelectKey();
      } else {
        this.metricKeys.at(this.metricKeys.length - 1).disable();
        const keys = this.metricKeys.getRawValue();
        this.selectedNode[this.queryIndex] = keys[keys.length - 1].metricKey;
        const { metadata: { type } } = this.selectedNode[this.queryIndex];
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
        this.filteredStatistic$[this.queryIndex] = this.queryOperations;
        // reset options for metric keys:
        this.optionsSub();
        this.filteredMetrics$ = [];
      }
    }
  }

  addMetric(queryName = null, operationType = null, compareFn = null, compareValue = null, repeatedMeasure = null) {
    return  this._formBuilder.group({
      keys: this._formBuilder.array([this.addKey()]),
      queryName: [queryName, Validators.required],
      operationType: [operationType, Validators.required],
      compareFn: [compareFn],
      compareValue: [compareValue],
      repeatedMeasure: [repeatedMeasure]
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
    // const metricKey = this.queries.controls[groupIndex].get('keys').value;
    // console.log("metricKey:  ", metricKey);
    // if (this.experimentInfo) {
    //   const deletedMetric = this.experimentInfo.queries.find(metric => metric.key === metricKey);
    //   if (deletedMetric) {
    //     delete this.experimentInfo.queries[groupIndex];
    //   }
    // }
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

  metricType(selectedNode) {
    if ( selectedNode.children.length ) {
      return false;
    } else {
      return true;
    }
  }

  removeMetricName(metric) {
    delete metric.metricKey;
    return metric;
  }

  emitEvent(eventType: NewExperimentDialogEvents) {
    switch (eventType) {
      case NewExperimentDialogEvents.CLOSE_DIALOG:
        this.emitExperimentDialogEvent.emit({ type: eventType });
        break;
      case NewExperimentDialogEvents.SEND_FORM_DATA:
      case NewExperimentDialogEvents.SAVE_DATA:
        const monitoredMetricsFormData = this.queryForm.getRawValue();
        monitoredMetricsFormData.queries = monitoredMetricsFormData.queries.map(
          (query, index) => {
            let { keys, operationType, queryName, compareFn, compareValue, repeatedMeasure } = query;
            keys = keys.map(key => key.metricKey.key);
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
          }
        );
        this.emitExperimentDialogEvent.emit({
          type: eventType,
          formData: monitoredMetricsFormData,
          path: NewExperimentPaths.MONITORED_METRIC
        });
        break;
    }
  }

  ngOnChanges(changes: SimpleChanges) {

    if (this.isContextChanged) {
      this.isContextChanged = false;
      // this.queries.clear();
      // this.queries.push(this.addMetric());
      this.metricsDataSource.next(this.queries.controls);
    }
  }

  ngOnDestroy() {
    this.allMetricsSub.unsubscribe();
  }
}
