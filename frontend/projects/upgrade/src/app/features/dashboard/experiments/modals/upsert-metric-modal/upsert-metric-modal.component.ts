import { ChangeDetectionStrategy, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { BehaviorSubject, Observable, Subscription, combineLatest } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { TranslateModule } from '@ngx-translate/core';

import { CommonModalComponent } from '../../../../../shared-standalone-component-lib/components';
import { CommonModalConfig } from '../../../../../shared-standalone-component-lib/components/common-modal/common-modal.types';
import {
  MetricFormData,
  UPSERT_EXPERIMENT_ACTION,
  UpsertMetricParams,
} from '../../../../../core/experiments/store/experiments.model';
import { ExperimentService } from '../../../../../core/experiments/experiments.service';
import { AnalysisService } from '../../../../../core/analysis/analysis.service';
import { IMetricMetaData, OPERATION_TYPES, REPEATED_MEASURE } from 'upgrade_types';

interface StatisticOption {
  value: string;
  label: string;
}

@Component({
  selector: 'upsert-metric-modal',
  imports: [
    CommonModalComponent,
    MatFormFieldModule,
    MatInputModule,
    MatRadioModule,
    MatSelectModule,
    MatChipsModule,
    MatIconModule,
    MatAutocompleteModule,
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
  ],
  templateUrl: './upsert-metric-modal.component.html',
  styleUrl: './upsert-metric-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpsertMetricModalComponent implements OnInit, OnDestroy {
  isLoadingUpsertMetric$ = this.experimentService.isLoadingExperiment$;

  subscriptions = new Subscription();
  isPrimaryButtonDisabled$: Observable<boolean>;
  isInitialFormValueChanged$: Observable<boolean>;

  initialFormValues$ = new BehaviorSubject<MetricFormData>(null);

  metricForm: FormGroup;
  showMetricClass = false;
  showMetricKey = false;
  showAggregateStatistic = false;
  showIndividualStatistic = false;
  showComparison = false;
  metricDataType: IMetricMetaData | null = null;

  // Dropdown options
  aggregateStatisticOptions: StatisticOption[] = [];
  individualStatisticOptions: StatisticOption[] = [];

  // Autocomplete - Professional solution with BehaviorSubjects for source data
  allMetrics$ = this.analysisService.allMetrics$;
  allMetrics: any[] = [];

  // BehaviorSubjects for source data - this is the professional way
  private metricClassOptions$ = new BehaviorSubject<any[]>([]);
  private metricKeyOptions$ = new BehaviorSubject<any[]>([]);
  private metricIdOptions$ = new BehaviorSubject<any[]>([]);

  // Filtered observables that combine user input with reactive source data
  filteredMetricClasses$: Observable<any[]>;
  filteredMetricKeys$: Observable<any[]>;
  filteredMetricIds$: Observable<any[]>;

  // Current selections
  currentSelectedClass: any = null;
  currentSelectedKey: any = null;

  // For categorical metrics comparison
  allowableDataKeys: string[] = [];
  comparisonOptions = [
    { value: '=', label: 'Equal' },
    { value: '<>', label: 'Not equal' },
  ];

  // Continuous statistic options
  continuousAggregateOptions: StatisticOption[] = [
    { value: OPERATION_TYPES.SUM, label: 'Sum' },
    { value: OPERATION_TYPES.MIN, label: 'Min' },
    { value: OPERATION_TYPES.MAX, label: 'Max' },
    { value: OPERATION_TYPES.COUNT, label: 'Count' },
    { value: OPERATION_TYPES.AVERAGE, label: 'Mean' },
    { value: OPERATION_TYPES.MODE, label: 'Mode' },
    { value: OPERATION_TYPES.MEDIAN, label: 'Median' },
    { value: 'STDEV', label: 'Standard Deviation' },
  ];

  continuousIndividualOptions: StatisticOption[] = [
    { value: REPEATED_MEASURE.mean, label: 'Mean' },
    { value: REPEATED_MEASURE.earliest, label: 'Earliest' },
    { value: REPEATED_MEASURE.mostRecent, label: 'Most Recent' },
  ];

  // Categorical statistic options
  categoricalAggregateOptions: StatisticOption[] = [
    { value: OPERATION_TYPES.COUNT, label: 'Count' },
    { value: OPERATION_TYPES.PERCENTAGE, label: 'Percentage' },
  ];

  categoricalIndividualOptions: StatisticOption[] = [
    { value: REPEATED_MEASURE.earliest, label: 'Earliest' },
    { value: REPEATED_MEASURE.mostRecent, label: 'Most Recent' },
  ];

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public config: CommonModalConfig<UpsertMetricParams>,
    private formBuilder: FormBuilder,
    private experimentService: ExperimentService,
    private analysisService: AnalysisService,
    public dialogRef: MatDialogRef<UpsertMetricModalComponent>
  ) {}

  ngOnInit(): void {
    this.createMetricForm();
    this.setupFormChangeListeners();
    this.setupAutocomplete();

    // Add listeners AFTER form is fully set up
    this.listenForIsInitialFormValueChanged();
    this.listenForPrimaryButtonDisabled();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  createMetricForm(): void {
    const { sourceQuery, action } = this.config.params;
    const initialValues = this.deriveInitialFormValues(sourceQuery, action);

    this.metricForm = this.formBuilder.group({
      metricType: [initialValues.metricType, Validators.required],
      metricId: [initialValues.metricId, Validators.required],
      displayName: [initialValues.displayName, Validators.required],
      description: [initialValues.description],
      metricClass: [initialValues.metricClass],
      metricKey: [initialValues.metricKey],
      aggregateStatistic: [initialValues.aggregateStatistic],
      individualStatistic: [initialValues.individualStatistic],
      comparison: [initialValues.comparison || '='],
      compareValue: [initialValues.compareValue],
    });

    this.allowableDataKeys = initialValues.allowableDataKeys || [];
    this.initialFormValues$.next(initialValues);

    // Set initial form visibility states
    this.updateFormVisibility();
    this.detectMetricDataType(initialValues.metricId);
  }

  deriveInitialFormValues(sourceQuery: any, action: UPSERT_EXPERIMENT_ACTION): MetricFormData {
    if (action === UPSERT_EXPERIMENT_ACTION.EDIT && sourceQuery) {
      // Extract values from existing query for edit mode
      return {
        metricType: sourceQuery.repeatedMeasure ? 'repeatable' : 'global',
        metricId: sourceQuery.metric?.key || '',
        displayName: sourceQuery.name || '',
        description: '', // Not available in current structure
        metricClass: '', // Not available in current structure
        metricKey: '', // Not available in current structure
        aggregateStatistic: sourceQuery.query?.operationType || '',
        individualStatistic: sourceQuery.repeatedMeasure || '',
        comparison: sourceQuery.query?.compareFn || '=',
        compareValue: sourceQuery.query?.compareValue || '',
        allowableDataKeys: [],
      };
    }

    // Default values for add mode
    return {
      metricType: 'global',
      metricId: '',
      displayName: '',
      description: '',
      metricClass: '',
      metricKey: '',
      aggregateStatistic: '',
      individualStatistic: '',
      comparison: '=',
      compareValue: '',
      allowableDataKeys: [],
    };
  }

  setupFormChangeListeners(): void {
    // Listen for metric type changes
    this.subscriptions.add(
      this.metricForm.get('metricType')?.valueChanges.subscribe(() => {
        this.onMetricTypeChange();
      })
    );

    // Listen for metric class changes
    this.subscriptions.add(
      this.metricForm.get('metricClass')?.valueChanges.subscribe((selectedClass) => {
        this.onMetricClassChange(selectedClass);
      })
    );

    // Listen for metric key changes
    this.subscriptions.add(
      this.metricForm.get('metricKey')?.valueChanges.subscribe((selectedKey) => {
        this.onMetricKeyChange(selectedKey);
      })
    );

    // Listen for metric ID changes
    this.subscriptions.add(
      this.metricForm.get('metricId')?.valueChanges.subscribe((metricId) => {
        this.onMetricIdChange(metricId);
      })
    );
  }

  setupAutocomplete(): void {
    // Load all metrics data - EXACTLY like legacy component
    this.subscriptions.add(
      this.allMetrics$.subscribe((metrics) => {
        this.allMetrics = metrics || [];
        this.populateOptions();
        this.createFilteredObservables();
      })
    );
  }

  populateOptions(): void {
    const metricType = this.metricForm.get('metricType')?.value;

    if (metricType === 'global') {
      // Global metrics: only show metrics without children
      this.metricClassOptions$.next([]);
      this.metricKeyOptions$.next([]);
      this.metricIdOptions$.next(
        this.allMetrics.filter((metric) => !metric.children || metric.children.length === 0)
      );
    } else {
      // Repeatable metrics: show hierarchical structure
      this.metricClassOptions$.next(
        this.allMetrics.filter((metric) => metric.children && metric.children.length > 0)
      );
      this.metricKeyOptions$.next([]);
      this.metricIdOptions$.next([]);
    }
  }

  createFilteredObservables(): void {
    // Professional solution: combine user input with reactive source data
    this.filteredMetricClasses$ = combineLatest([
      this.metricForm.get('metricClass')?.valueChanges.pipe(startWith('')) || new BehaviorSubject(''),
      this.metricClassOptions$,
    ]).pipe(map(([searchValue, options]) => this._filter(searchValue || '', options)));

    this.filteredMetricKeys$ = combineLatest([
      this.metricForm.get('metricKey')?.valueChanges.pipe(startWith('')) || new BehaviorSubject(''),
      this.metricKeyOptions$,
    ]).pipe(map(([searchValue, options]) => this._filter(searchValue || '', options)));

    this.filteredMetricIds$ = combineLatest([
      this.metricForm.get('metricId')?.valueChanges.pipe(startWith('')) || new BehaviorSubject(''),
      this.metricIdOptions$,
    ]).pipe(map(([searchValue, options]) => this._filter(searchValue || '', options)));
  }

  onMetricClassChange(selectedClass: any): void {
    if (selectedClass && typeof selectedClass === 'object' && selectedClass.children) {
      this.currentSelectedClass = selectedClass;
      this.metricKeyOptions$.next(selectedClass.children);

      // Reset dependent fields - no forced refresh
      this.metricForm.get('metricKey')?.setValue('');
      this.metricForm.get('metricId')?.setValue('');
      this.currentSelectedKey = null;
      this.metricIdOptions$.next([]);
    } else if (selectedClass === '' || selectedClass === null) {
      // Clear everything if class is cleared
      this.currentSelectedClass = null;
      this.metricKeyOptions$.next([]);
      this.metricIdOptions$.next([]);
      this.metricForm.get('metricKey')?.setValue('');
      this.metricForm.get('metricId')?.setValue('');
    }
    // Don't do anything for string values - user is typing
  }

  onMetricKeyChange(selectedKey: any): void {
    if (selectedKey && typeof selectedKey === 'object') {
      this.currentSelectedKey = selectedKey;

      // Set metric IDs based on selected key's children
      if (selectedKey.children && selectedKey.children.length > 0) {
        this.metricIdOptions$.next(selectedKey.children);
      } else {
        this.metricIdOptions$.next([selectedKey]);
      }

      // Reset ID field - no forced refresh
      this.metricForm.get('metricId')?.setValue('');
    } else if (selectedKey === '' || selectedKey === null) {
      // Clear IDs if key is cleared
      this.metricIdOptions$.next([]);
      this.metricForm.get('metricId')?.setValue('');
    }
    // Don't do anything for string values - user is typing
  }

  displayFn(option?: any): string | undefined {
    if (option && option.key) {
      return option.key;
    } else if (typeof option === 'string') {
      return option;
    }
    return option ? option : undefined;
  }

  private _filter(value: any, options: any[]): any[] {
    let filterValue: string;
    if (typeof value === 'string') {
      filterValue = value.toLowerCase();
    } else if (value && value.key) {
      filterValue = value.key.toLowerCase();
    } else {
      filterValue = '';
    }
    return options.filter((option) => option.key?.toLowerCase().includes(filterValue));
  }

  onMetricTypeChange(): void {
    // Clear everything and repopulate
    this.currentSelectedClass = null;
    this.currentSelectedKey = null;

    // Clear form fields
    this.metricForm.get('metricClass')?.setValue('');
    this.metricForm.get('metricKey')?.setValue('');
    this.metricForm.get('metricId')?.setValue('');

    // Repopulate options based on new metric type
    // BehaviorSubjects will automatically trigger observable re-emission
    this.populateOptions();

    // Update form state
    this.updateFormVisibility();
    this.resetStatisticFields();
    this.updateFormValidators();
  }

  onMetricIdChange(metricId: any): void {
    if (metricId) {
      this.detectMetricDataType(metricId);
      this.updateStatisticOptions();
      this.updateFormVisibility();
      this.updateFormValidators();
    }
  }

  detectMetricDataType(metricId: any): void {
    let selectedMetric: any = null;

    // Find the selected metric in current metricIdOptions
    if (typeof metricId === 'object' && metricId.metadata) {
      selectedMetric = metricId;
    } else if (typeof metricId === 'string') {
      // Find by string key - get current value from BehaviorSubject
      const currentOptions = this.metricIdOptions$.getValue();
      selectedMetric = currentOptions.find((metric) => metric.key === metricId);
    }

    if (selectedMetric && selectedMetric.metadata && selectedMetric.metadata.type) {
      this.metricDataType = selectedMetric.metadata.type;

      // For categorical metrics, populate allowable data from the metric and set default comparison
      if (this.metricDataType === IMetricMetaData.CATEGORICAL) {
        if (selectedMetric.allowedData) {
          this.allowableDataKeys = [...selectedMetric.allowedData];
        }
        // Set default comparison to "=" if not already set
        if (!this.metricForm.get('comparison')?.value) {
          this.metricForm.get('comparison')?.setValue('=');
        }
      } else {
        this.allowableDataKeys = [];
      }
    } else {
      // Fallback to heuristic if metadata is not available
      const metricKey = typeof metricId === 'string' ? metricId : metricId?.key || '';
      const continuousKeywords = ['time', 'count', 'score', 'number', 'seconds', 'minutes', 'duration'];
      const categoricalKeywords = ['status', 'type', 'category', 'level', 'completion'];

      const lowerMetricKey = metricKey.toLowerCase();

      if (continuousKeywords.some((keyword) => lowerMetricKey.includes(keyword))) {
        this.metricDataType = IMetricMetaData.CONTINUOUS;
      } else if (categoricalKeywords.some((keyword) => lowerMetricKey.includes(keyword))) {
        this.metricDataType = IMetricMetaData.CATEGORICAL;
      } else {
        // Default to continuous for unknown types
        this.metricDataType = IMetricMetaData.CONTINUOUS;
      }
    }
  }

  updateFormVisibility(): void {
    const metricType = this.metricForm.get('metricType')?.value;
    this.showMetricClass = metricType === 'repeatable';
    this.showMetricKey = metricType === 'repeatable';
    this.showIndividualStatistic = metricType === 'repeatable';
  }

  updateStatisticOptions(): void {
    if (this.metricDataType === IMetricMetaData.CONTINUOUS) {
      this.aggregateStatisticOptions = this.continuousAggregateOptions;
      this.individualStatisticOptions = this.continuousIndividualOptions;
      this.showComparison = false;
    } else {
      this.aggregateStatisticOptions = this.categoricalAggregateOptions;
      this.individualStatisticOptions = this.categoricalIndividualOptions;
      this.showComparison = true;
    }
  }

  showStatisticDropdowns(): void {
    this.showAggregateStatistic = true;
  }

  hideStatisticDropdowns(): void {
    this.showAggregateStatistic = false;
    this.showIndividualStatistic = false;
    this.showComparison = false;
  }

  resetStatisticFields(): void {
    this.metricForm.patchValue({
      aggregateStatistic: '',
      individualStatistic: '',
    });
    this.allowableDataKeys = [];
  }

  updateFormValidators(): void {
    const metricType = this.metricForm.get('metricType')?.value;

    // Update validators based on metric type
    if (metricType === 'repeatable') {
      this.metricForm.get('metricClass')?.setValidators([Validators.required]);
      this.metricForm.get('metricKey')?.setValidators([Validators.required]);
      this.metricForm.get('individualStatistic')?.setValidators([Validators.required]);
    } else {
      this.metricForm.get('metricClass')?.clearValidators();
      this.metricForm.get('metricKey')?.clearValidators();
      this.metricForm.get('individualStatistic')?.clearValidators();
    }

    // Update aggregate statistic validator
    if (this.showAggregateStatistic) {
      this.metricForm.get('aggregateStatistic')?.setValidators([Validators.required]);
    } else {
      this.metricForm.get('aggregateStatistic')?.clearValidators();
    }

    // Update comparison validators for categorical metrics
    if (this.showComparison) {
      this.metricForm.get('comparison')?.setValidators([Validators.required]);
      this.metricForm.get('compareValue')?.setValidators([Validators.required]);
    } else {
      this.metricForm.get('comparison')?.clearValidators();
      this.metricForm.get('compareValue')?.clearValidators();
    }

    // Update all validators without emitting events to prevent recursion
    Object.keys(this.metricForm.controls).forEach((key) => {
      this.metricForm.get(key)?.updateValueAndValidity({ emitEvent: false });
    });
  }

  listenForIsInitialFormValueChanged(): void {
    this.isInitialFormValueChanged$ = combineLatest([
      this.metricForm.valueChanges.pipe(startWith(this.metricForm.value)),
      this.initialFormValues$,
    ]).pipe(
      map(([currentFormValue, initialFormValue]) => {
        if (!initialFormValue) return false;

        const currentWithKeys = {
          ...currentFormValue,
          allowableDataKeys: this.allowableDataKeys,
        };

        return JSON.stringify(currentWithKeys) !== JSON.stringify(initialFormValue);
      })
    );
  }

  listenForPrimaryButtonDisabled(): void {
    this.isPrimaryButtonDisabled$ = combineLatest([
      this.metricForm.statusChanges.pipe(startWith(this.metricForm.status)),
      this.isLoadingUpsertMetric$,
      this.isInitialFormValueChanged$,
    ]).pipe(
      map(([formStatus, isLoading, isFormChanged]) => {
        const isFormInvalid = formStatus !== 'VALID';
        const isEditModeWithoutChanges = this.config.params.action === UPSERT_EXPERIMENT_ACTION.EDIT && !isFormChanged;

        return isFormInvalid || isLoading || isEditModeWithoutChanges;
      })
    );
  }

  onPrimaryActionBtnClicked(): void {
    if (this.metricForm.valid) {
      this.sendUpsertMetricRequest();
    }
  }

  sendUpsertMetricRequest(): void {
    const formValue = this.metricForm.value;
    const metricData: MetricFormData = {
      ...formValue,
      allowableDataKeys: this.allowableDataKeys,
    };

    // TODO: Implement the actual metric creation/update logic
    // This would typically call a service method to create or update the metric
    console.log('Metric data to be processed:', metricData);
    console.log('Experiment ID:', this.config.params.experimentId);
    console.log('Action:', this.config.params.action);

    // For now, just close the modal
    this.closeModal();
  }

  get UPSERT_EXPERIMENT_ACTION() {
    return UPSERT_EXPERIMENT_ACTION;
  }

  closeModal(): void {
    this.dialogRef.close();
  }
}
