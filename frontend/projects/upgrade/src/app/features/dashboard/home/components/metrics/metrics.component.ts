import {
  ChangeDetectionStrategy,
  ViewChild,
  ElementRef,
  OnChanges,
  SimpleChanges
} from '@angular/core';

import { AbstractControl } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { NewExperimentDialogEvents, NewExperimentDialogData, NewExperimentPaths, IContextMetaData } from '../../../../../core/experiments/store/experiments.model';

// from create query:
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
    this.queryForm = this._formBuilder.group(
      {
        queries: this._formBuilder.array([this.addMetrics()])
      });
    // populate values in form to update experiment if experiment data is available
    if (this.experimentInfo) {
      // Remove previously added group of queries
      this.queries.removeAt(0);
      this.experimentInfo.queries.forEach(query => {
        this.queries.push(this.addMetrics(query.queryName, query.operationType, query.compareFn, query.compareValue, query.repeatedMeasure));
      });
    }
    this.updateView();

    // Bind predefined values of experiment points and ids from backend
    // const partitionFormControl = this.queryForm.get('metrics') as FormArray;
    // partitionFormControl.controls.forEach((_, index) => {
    //   this.manageExpPointAndIdControl(index)
    // });

    // create query
    this.allMetricsSub = this.analysisService.allMetrics$.subscribe(metrics => {
      this.allMetrics = metrics;
      this.options[0] = this.allMetrics.filter(metric => metric.children.length === 0);
    });

    this.ManageKeysControl(0);

    // TODO: Move to separate validator file
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
  }

  get keys() {
    return this.queryForm.get('queries').get('keys') as FormArray;
  }

  addKey() {
    return this._formBuilder.group({
      metricKey: [null, Validators.required]
    });
  }

  removeKey(index) {
    this.keys.removeAt(index);
  }

  ManageKeysControl(index: number) {
    const queriesArray = this.queryForm.get('queries') as FormArray;
    const formControl = queriesArray.at(index) as FormGroup;
    const keysArray = formControl.get('keys') as FormArray;
    this.filteredOptions[index] = keysArray.at(index).get('metricKey').valueChanges
      .pipe(
      startWith<string>(''),
      map(key => {
        for (let i = index - 1; i >= 0; i--) {
          queriesArray.at(i).disable();
        }
        if (index - 1 >= 0) {
          const { metricKey } = queriesArray.at(index - 1).value;
          this.options[index] = metricKey.children;
        }
        return key ? this._filter(key, index) : this.options[index] ? this.options[index].slice() : [];
      })
      );
  }

  selectedIndexChange(tabIndex: number) {
    this.resetForm();
    if (tabIndex === 0) {
      // Show only simple metrics
      this.options[0] = this.allMetrics.filter(metric => metric.children.length === 0);
    } else {
      // Show only grouped metrics
      this.queryForm.get('queries').get('repeatedMeasure').setValue(REPEATED_MEASURE.mostRecent);
      this.options[0] = this.allMetrics.filter(metric => metric.children.length !== 0);
    }
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
    return this.options[index].filter(option => option.key.toLowerCase().indexOf(filterValue) === 0);
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
        this.keys.at(this.keys.length - 1).disable();
        const { keys } = this.queryForm.getRawValue();
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
    let { keys } = this.queryForm.getRawValue();
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
    this.experimentInfo.queries = [ ...this.experimentInfo.queries, queryObj];
    this.experimentService.updateExperiment(this.experimentInfo);
    this.resetForm();
    this.createdQueryEvent.emit(true);
  }

  get IMetricMetadata() {
    return IMetricMetaData;
  }

  get RepeatedMeasure() {
    return REPEATED_MEASURE;
  }

  // manageExpPointAndIdControl(index: number) {
  //   const metricFormControl = this.queryForm.get('metrics') as FormArray;
  //   this.filteredMetrics$[index] = metricFormControl.at(index).get('metric').valueChanges
  //     .pipe(
  //       startWith<string>(''),
  //       map(expPoint => this.filterExpPointsAndIds(expPoint, 'expPoints'))
  //     );
  //   this.filteredStatistics$[index] = metricFormControl.at(index).get('statistic').valueChanges
  //     .pipe(
  //       startWith<string>(''),
  //       map(expId => this.filterExpPointsAndIds(expId, 'expIds'))
  //     );

  //   // this.filteredRequiredIds$[index] = partitionFormControl.at(index).get('requiredId').valueChanges
  //   //   .pipe(
  //   //     startWith<string>(''),
  //   //     map(expId => this.filterExpPointsAndIds(expId, 'requiredIds'))
  //   //   );
  // }

  // private filterExpPointsAndIds(value: string, key: string): string[] {
  //   const filterValue = value ?  value.toLocaleLowerCase() : '';

  //   if (!this.contextMetaData) {
  //     return [];
  //   }

  //   if (key === 'expPoints' && this.currentContext) {
  //     const currentContextExpPoints = (this.contextMetaData['contextMetadata'][this.currentContext].EXP_POINTS || []);
  //     return currentContextExpPoints.filter(option => option.toLowerCase().indexOf(filterValue) === 0);
  //   } else if (key === 'expIds' && this.currentContext) {
  //     const currentContextExpIds = (this.contextMetaData['contextMetadata'][this.currentContext].EXP_IDS || []);
  //     return currentContextExpIds.filter(option => option.toLowerCase().indexOf(filterValue) === 0);
  //   }
  //   return [];
  // }

  addMetrics(queryName = null, operationType = null, compareFn = null, compareValue = null, repeatedMeasure = null) {
    return  this._formBuilder.group({
      keys: this._formBuilder.array([this.addKey()]),
      queryName: [queryName, Validators.required],
      operationType: [operationType, Validators.required],
      compareFn: [compareFn],
      compareValue: [compareValue],
      repeatedMeasure: [repeatedMeasure]
    });
  }

  // addMetric(type: string) {
  //   const isMetric = type === 'metric';
  //   const form = isMetric ? this.addMetrics() : null;
  //   this[type].push(form);
  //   const scrollTableType = 'metricTable';
  //   this.updateView(scrollTableType);
  //   // if (isMetric) {
  //   //   const metricFormControl = this.queryForm.get('metrics') as FormArray;
  //   //   // this.manageExpPointAndIdControl(metricFormControl.controls.length - 1);
  //   // }
  // }

  removeMetric(groupIndex: number) {
    this.queries.removeAt(groupIndex);
    const metricKey = this.queries.controls[groupIndex].get('keys').value;
    if (this.experimentInfo) {
      const deletedMetric = this.experimentInfo.queries.find(metric => metric.key === metricKey);
      if (deletedMetric) {
        delete this.experimentInfo.queries[groupIndex];
      }
    }
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

  get queries(): FormArray {
    return this.queryForm.get('queries') as FormArray;
  }

  get NewExperimentDialogEvents() {
    return NewExperimentDialogEvents;
  }

  ngOnChanges(changes: SimpleChanges) {

    if (this.isContextChanged) {
      this.isContextChanged = false;
      this.queries.clear();
      this.queries.push(this.addMetrics());
      this.metricsDataSource.next(this.queries.controls);
    }
  }

  ngOnDestroy() {
    this.allMetricsSub.unsubscribe();
  }
}
