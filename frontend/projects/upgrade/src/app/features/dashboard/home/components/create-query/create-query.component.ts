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
import { ExperimentService } from '../../../../../core/experiments/experiments.service';
import { UntypedFormGroup, UntypedFormBuilder, Validators, UntypedFormArray } from '@angular/forms';
import { startWith, map } from 'rxjs/operators';

@Component({
  selector: 'app-create-query',
  templateUrl: './create-query.component.html',
  styleUrls: ['./create-query.component.scss'],
})
export class CreateQueryComponent implements OnInit, OnDestroy {
  @Input() experimentInfo: ExperimentVM;
  @Output() createdQueryEvent = new EventEmitter<boolean>();

  // Used for displaying metrics
  allMetricsSub: Subscription;
  allMetrics = [];
  isAnalysisMetricsLoading$ = this.analysisService.isMetricsLoading$;

  queryOperations = [];
  comparisonFns = [
    { value: '=', viewValue: 'equal' },
    { value: '<>', viewValue: 'not equal' },
  ];
  queryForm: UntypedFormGroup;
  filteredOptions: Observable<any[]>[] = [];
  options: any[] = [];
  selectedNode = null;

  controlTitles = ['Type', 'ID', 'Metric']; // Used to show different titles in grouped metrics

  constructor(
    private analysisService: AnalysisService,
    private experimentService: ExperimentService,
    private fb: UntypedFormBuilder
  ) {}

  ngOnInit() {
    this.allMetricsSub = this.analysisService.allMetrics$.subscribe((metrics) => {
      this.allMetrics = metrics;
      this.options[0] = this.allMetrics.filter((metric) => metric.children.length === 0);
    });

    this.queryForm = this.fb.group({
      keys: this.fb.array([this.addKey()]),
      queryName: [null, Validators.required],
      operationType: [null, Validators.required],
      compareFn: [null],
      compareValue: [null],
      repeatedMeasure: [REPEATED_MEASURE.mostRecent],
    });
    this.ManageKeysControl(0);

    // TODO: Move to separate validator file
    this.queryForm.get('operationType').valueChanges.subscribe((operation) => {
      if (operation === OPERATION_TYPES.PERCENTAGE) {
        this.queryForm.get('compareFn').setValidators([Validators.required]);
        this.queryForm.get('compareValue').setValidators([Validators.required]);
      } else {
        this.queryForm.get('compareFn').clearValidators();
        this.queryForm.get('compareValue').clearValidators();
      }
      this.queryForm.get('compareFn').updateValueAndValidity();
      this.queryForm.get('compareValue').updateValueAndValidity();
    });

    this.queryForm.get('compareFn').valueChanges.subscribe((compareFn) => {
      if (compareFn) {
        this.queryForm.get('compareValue').setValidators([Validators.required]);
      } else {
        this.queryForm.get('compareValue').clearValidators();
        this.queryForm.get('compareValue').setValue(null);
      }
      this.queryForm.get('compareValue').updateValueAndValidity();
    });
  }

  get keys() {
    return this.queryForm.get('keys') as UntypedFormArray;
  }

  addKey() {
    return this.fb.group({
      metricKey: [null, Validators.required],
    });
  }

  removeKey(index) {
    this.keys.removeAt(index);
  }

  ManageKeysControl(index: number) {
    const arrayControl = this.queryForm.get('keys') as UntypedFormArray;
    this.filteredOptions[index] = arrayControl
      .at(index)
      .get('metricKey')
      .valueChanges.pipe(
        startWith<string>(''),
        map((key) => {
          for (let i = index - 1; i >= 0; i--) {
            arrayControl.at(i).disable();
          }
          if (index - 1 >= 0) {
            const { metricKey } = arrayControl.at(index - 1).value;
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
      this.options[0] = this.allMetrics.filter((metric) => metric.children.length === 0);
    } else {
      // Show only grouped metrics
      this.queryForm.get('repeatedMeasure').setValue(REPEATED_MEASURE.mostRecent);
      this.options[0] = this.allMetrics.filter((metric) => metric.children.length !== 0);
    }
  }

  resetForm() {
    this.keys.clear();
    this.queryForm.reset();
    this.queryForm.get('repeatedMeasure').setValue(REPEATED_MEASURE.mostRecent);
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
    return this.options[index].filter((option) => option.key.toLowerCase().indexOf(filterValue) === 0);
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
        const {
          metadata: { type },
        } = this.selectedNode;
        if (type && type === IMetricMetaData.CONTINUOUS) {
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
        } else if (type && type === IMetricMetaData.CATEGORICAL) {
          this.queryOperations = [
            { value: OPERATION_TYPES.COUNT, viewValue: 'Count' },
            { value: OPERATION_TYPES.PERCENTAGE, viewValue: 'Percentage' },
          ];
        }
      }
    }
  }

  saveQuery() {
    const { operationType, queryName, compareFn, compareValue, repeatedMeasure } = this.queryForm.getRawValue();
    let { keys } = this.queryForm.getRawValue();
    keys = keys.map((key) => key.metricKey.key);
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
    this.experimentInfo.queries = [...this.experimentInfo.queries, queryObj];
    this.experimentService.updateExperiment(this.experimentInfo);
    this.resetForm();
    this.createdQueryEvent.emit(true);
  }

  ngOnDestroy() {
    this.allMetricsSub.unsubscribe();
  }

  get IMetricMetadata() {
    return IMetricMetaData;
  }

  get RepeatedMeasure() {
    return REPEATED_MEASURE;
  }
}
