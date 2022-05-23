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
  @Output() createdQueryEvent = new EventEmitter<boolean>();
  @Input() currentContext: string;
  @Input() isContextChanged: boolean;
  @Input() animationCompleteStepperIndex: Number;
  @Output() emitExperimentDialogEvent = new EventEmitter<NewExperimentDialogData>();

  // Used for displaying metrics
  allMetricsSub: Subscription;
  allMetrics = [];
  isAnalysisMetricsLoading$ = this.analysisService.isMetricsLoading$;

  queryOperations = [];
  comparisonFns = [
    { value: '=', viewValue: 'equal' },
    { value: '<>', viewValue: 'not equal' }
  ];
  queryForm: FormGroup;
  filteredOptions: Observable<any[]>[] = [];
  options: any[] = [];
  selectedNode = null;

  controlTitles = ['Type', 'Key', 'Metric']; // Used to show different titles in grouped metrics

  @ViewChild('metricTable', { static: false, read: ElementRef }) metricTable: ElementRef;

  metricsDataSource = new BehaviorSubject<AbstractControl[]>([]);

  metricsDisplayedColumns = ['keys', 'operationType', 'queryName', 'removeMetric'];

  // Used for metrics auto complete dropdown
  filteredMetrics$: Observable<string[]>[] = [];
  filteredStatistics$: Observable<string[]>[] = [];
  // filteredRequiredIds$: Observable<string[]>[] = [];
  constructor(
    private analysisService: AnalysisService,
    private experimentService: ExperimentService,
    private _formBuilder: FormBuilder,
  ) { }

  ngOnInit() {
    this.allMetricsSub = this.analysisService.allMetrics$.subscribe(metrics => {
      this.allMetrics = metrics;
      // this.options[0] = this.allMetrics.filter(metric => metric.children.length === 0);
      this.options = this.allMetrics;
    });

    this.queryForm = this._formBuilder.group({
      queries: this._formBuilder.array([ this._formBuilder.group({
        keys: this._formBuilder.array([ this.addKey() ]),
        queryName: [null, Validators.required],
        operationType: [null, Validators.required],
        compareFn: [null],
        compareValue: [null],
        repeatedMeasure: [REPEATED_MEASURE.mostRecent]
        })
      ])
    });

    // Bind predefined values of experiment points and ids from backend
    const metricsFormControl = this.queryForm.get('queries') as FormArray;
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

  get keys() { 
    const queriesArray = this.queryForm.get('queries') as FormArray;
    const keysArray = queriesArray.at(0).get('keys') as FormArray;
    return keysArray;
  }

  addKey() {
    return this._formBuilder.group({
      metricKey: [null, Validators.required]
    });
  }

  removeKey(index) {
    this.queries.removeAt(index);
  }

  ManageKeysControl(index: number) {
    const queriesArray = this.queryForm.get('queries') as FormArray;
    const keysArray = queriesArray.at(index).get('keys') as FormArray;
    this.filteredOptions[index] = keysArray.at(0).get('metricKey').valueChanges
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

  resetForm() {
    this.keys.clear();
    this.queryForm.reset();
    this.queryForm.get('queries').get('repeatedMeasure').setValue(REPEATED_MEASURE.mostRecent);
    this.options = [this.options[0]];
    this.filteredOptions = [];
    this.keys.push(this.addKey());
    this.ManageKeysControl(0);
    this.selectedNode = null;
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
    // const temp = this.options.filter(option => option.key.toLowerCase().indexOf(filterValue) === 0);
    return this.options.filter(option => option.key.toLowerCase().indexOf(filterValue) === 0);
  }

  addMoreSelectKey() {
    this.keys.push(this.addKey());
    this.ManageKeysControl(this.keys.length - 1);
  }

  selectedOption(event) {
    if (event.option.value) {
      if (event.option.value.children.length) {
        this.addMoreSelectKey();
      } else {
        // this.keys.at(this.keys.length - 1).disable();
        // const keys = this.queries.at(0).get('keys') as FormArray;
        // this.selectedNode = keys.at(0).get('metricKey');
        const keys = this.keys.getRawValue();
        this.selectedNode = keys[keys.length - 1].metricKey;
        const { metadata: { type } } = this.selectedNode;
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
      }
    }
  }

  saveQuery() {
    const { operationType, queryName, compareFn, compareValue, repeatedMeasure } = this.queryForm.getRawValue();
    let { queries } = this.queryForm.getRawValue();
    // console.log("keys: ", queries);
    queries = queries.map(query => query.keys.key);
    let queryObj: Query = {
      name: queryName,
      query: {
        operationType
      },
      metric: {
        key: queries.join(METRICS_JOIN_TEXT)
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
    this.experimentInfo.queries = [ ...this.experimentInfo.queries, queryObj];
    this.experimentService.updateExperiment(this.experimentInfo);
    this.resetForm();
    this.createdQueryEvent.emit(true);
  }

  get IMetricMetadata() {
    return IMetricMetaData;
  }

  get RepeatedMeasure() {
    return Object.keys(REPEATED_MEASURE);
  }

  addMetric(keys = null, queryName = null, operationType = null, compareFn = null, compareValue = null, repeatedMeasure = null) {
    return  this._formBuilder.group({
      keys: [keys, Validators.required],
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
      const metricFormControl = this.queryForm.get('queries') as FormArray;
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
        this.saveQuery();
        const monitoredMetricsFormData = this.queryForm.value;
        monitoredMetricsFormData.queries = monitoredMetricsFormData.queries.map(
          (query, index) => {
            return this.experimentInfo
              ? ({ ...this.experimentInfo.queries[index], ...query })
              : (query.metric.key 
                ? ({...query}) 
                : ({...this.removeMetricName(query)})
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

  get NewExperimentDialogEvents() {
    return NewExperimentDialogEvents;
  }

  ngOnChanges(changes: SimpleChanges) {

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

  // selectedIndexChange(tabIndex: number) {
  //   this.resetForm();
  //   if (tabIndex === 0) {
  //     // Show only simple metrics
  //     this.options[0] = this.allMetrics.filter(metric => metric.children.length === 0);
  //   } else {
  //     // Show only grouped metrics
  //     this.queryForm.get('queries').get('repeatedMeasure').setValue(REPEATED_MEASURE.mostRecent);
  //     this.options[0] = this.allMetrics.filter(metric => metric.children.length !== 0);
  //   }
  // }
}
