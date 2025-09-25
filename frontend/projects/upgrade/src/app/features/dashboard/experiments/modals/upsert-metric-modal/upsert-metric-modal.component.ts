import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { BehaviorSubject, Observable, Subscription, combineLatest } from 'rxjs';
import { map, startWith, take } from 'rxjs/operators';
import isEqual from 'lodash.isequal';
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
import { CommonFormHelpersService } from '../../../../../shared/services/common-form-helpers.service';
import {
  MetricFormData,
  UPSERT_EXPERIMENT_ACTION,
  UpsertMetricParams,
  Experiment,
  ExperimentQueryDTO,
} from '../../../../../core/experiments/store/experiments.model';
import { ExperimentService } from '../../../../../core/experiments/experiments.service';
import { MetricHelperService } from '../../../../../core/experiments/metric-helper.service';
import { AnalysisService } from '../../../../../core/analysis/analysis.service';
import { METRICS_JOIN_TEXT } from '../../../../../core/analysis/store/analysis.models';
import { ASSIGNMENT_UNIT, IMetricMetaData, OPERATION_TYPES, REPEATED_MEASURE } from 'upgrade_types';

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
  isGlobalMetricDisabled = false;

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

  // Assignment unit and context for filtering (same as legacy component)
  currentAssignmentUnit: ASSIGNMENT_UNIT | null = null;
  currentContext: string[] | null = null;

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
    { value: OPERATION_TYPES.STDEV, label: 'Standard Deviation' },
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
    private metricHelperService: MetricHelperService,
    private analysisService: AnalysisService,
    private cdr: ChangeDetectorRef,
    public dialogRef: MatDialogRef<UpsertMetricModalComponent>
  ) {}

  ngOnInit(): void {
    this.createMetricForm();
    this.setupFormChangeListeners();
    this.setupAutocomplete();
    this.setupExperimentContext();

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

    // Set initial form visibility states - detect metric data type first if we have a metric ID
    if (initialValues.metricId) {
      this.detectMetricDataType(initialValues.metricId);
      this.updateStatisticOptions();
    }
    this.updateFormVisibility();
    this.updateMetricTypeAvailability();

    // For edit mode, populate form after allMetrics are loaded
    if (action === UPSERT_EXPERIMENT_ACTION.EDIT && sourceQuery) {
      this.populateFormForEditMode(sourceQuery, initialValues);
    }
  }

  deriveInitialFormValues(sourceQuery: any, action: UPSERT_EXPERIMENT_ACTION): MetricFormData {
    if (action === UPSERT_EXPERIMENT_ACTION.EDIT && sourceQuery) {
      const metricKey = sourceQuery.metric?.key || '';

      // The correct way to determine if it's repeatable is by checking if the metric key contains METRICS_JOIN_TEXT
      // NOT by checking if repeatedMeasure exists (global metrics can also have individual statistics)
      const isRepeatable = metricKey.includes(METRICS_JOIN_TEXT);

      let metricClass = '';
      let metricKeyValue = '';
      let metricId = '';

      if (isRepeatable) {
        // Parse combined key for repeatable metrics: "class@__@key@__@id"
        const keyParts = metricKey.split(METRICS_JOIN_TEXT);
        if (keyParts.length === 3) {
          metricClass = keyParts[0];
          metricKeyValue = keyParts[1];
          metricId = keyParts[2];
        } else {
          // Fallback if format is unexpected
          metricId = metricKey;
        }
      } else {
        // Global metric: use the key as-is for metricId
        metricId = metricKey;
      }

      return {
        metricType: (isRepeatable ? 'repeatable' : 'global') as 'repeatable' | 'global',
        metricId,
        displayName: sourceQuery.name || '',
        description: '', // Not available in current structure
        metricClass,
        metricKey: metricKeyValue,
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

  populateFormForEditMode(sourceQuery: any, initialValues: MetricFormData): void {
    // Wait for allMetrics to be loaded, then populate form with proper objects
    this.subscriptions.add(
      this.allMetrics$.pipe(take(1)).subscribe((metrics) => {
        if (!metrics || metrics.length === 0) return;

        const metricType = initialValues.metricType;
        let classObject = null;
        let keyObject = null;
        let idObject = null;

        if (metricType === 'repeatable') {
          // Find the class object
          classObject = metrics.find((m) => m.key === initialValues.metricClass);
          if (classObject && classObject.children) {
            // Find the key object within the class children
            keyObject = classObject.children.find((k) => k.key === initialValues.metricKey);
            if (keyObject && keyObject.children) {
              // Find the ID object within the key children
              idObject = keyObject.children.find((id) => id.key === initialValues.metricId);
            } else if (keyObject) {
              // If no children in keyObject, keyObject itself might be the ID
              idObject = keyObject;
            }
          }
        } else {
          // Global metric: find the metric directly
          idObject = metrics.find((m) => m.key === initialValues.metricId);
        }

        // Update form with found objects (or keep strings if objects not found)
        const formUpdates = {
          metricType: initialValues.metricType, // Ensure metric type is properly set
          metricClass: classObject || initialValues.metricClass,
          metricKey: keyObject || initialValues.metricKey,
          metricId: idObject || initialValues.metricId,
        };

        this.metricForm.patchValue(formUpdates);

        // Update the initial form values to reflect the object values
        const currentInitialValues = this.initialFormValues$.value;
        const newInitialValues = { ...currentInitialValues, ...formUpdates };
        if (!isEqual(currentInitialValues, newInitialValues)) {
          this.initialFormValues$.next(newInitialValues);
        }

        // Update the options and form state
        this.populateOptions();
        if (idObject) {
          this.detectMetricDataType(idObject);
          this.updateStatisticOptions();
          this.updateFormVisibility();
        }

        // Trigger change detection to ensure UI updates
        this.cdr.markForCheck();
      })
    );
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

  setupExperimentContext(): void {
    // Get experiment context and assignment unit for filtering (same as legacy component)
    this.subscriptions.add(
      this.experimentService.selectedExperiment$.subscribe((experiment) => {
        if (experiment) {
          this.currentAssignmentUnit = experiment.assignmentUnit;
          this.currentContext = experiment.context;
          // Update metric type availability based on assignment unit
          this.updateMetricTypeAvailability();
          // Repopulate options when experiment context changes
          this.populateOptions();
        }
      })
    );

    // Also try to get experiment from the experimentId parameter if no selected experiment
    if (this.config.params.experimentId && !this.currentAssignmentUnit) {
      this.subscriptions.add(
        this.experimentService.experiments$.subscribe((experiments) => {
          const experiment = experiments.find((exp) => exp.id === this.config.params.experimentId);
          if (experiment && !this.currentAssignmentUnit) {
            this.currentAssignmentUnit = experiment.assignmentUnit;
            this.currentContext = experiment.context;
            // Update metric type availability based on assignment unit
            this.updateMetricTypeAvailability();
            this.populateOptions();
          }
        })
      );
    }
  }

  populateOptions(): void {
    const metricType = this.metricForm.get('metricType')?.value;

    // Start with all metrics - this ensures dropdowns always have options
    let filteredMetrics = this.allMetrics || [];

    // Apply assignment unit filtering ONLY if we have a valid experiment context
    // This prevents breaking the dropdowns when no experiment is selected
    if (this.currentAssignmentUnit && filteredMetrics.length > 0) {
      if (this.currentAssignmentUnit === ASSIGNMENT_UNIT.WITHIN_SUBJECTS) {
        // Within-subjects: only show metrics with children (repeatable metrics)
        const withinSubjectsMetrics = filteredMetrics.filter((metric) => metric.children && metric.children.length > 0);
        // Only apply filter if we found matching metrics, otherwise keep all metrics
        if (withinSubjectsMetrics.length > 0) {
          filteredMetrics = withinSubjectsMetrics;
        }
      } else if (this.currentContext && this.currentContext.length > 0) {
        // Between-subjects or other: filter by context
        const contextFilteredMetrics = filteredMetrics.filter(
          (metric) => metric.context && this.currentContext?.some((ctx) => metric.context.includes(ctx))
        );
        // Only apply filter if we found matching metrics, otherwise keep all metrics
        if (contextFilteredMetrics.length > 0) {
          filteredMetrics = contextFilteredMetrics;
        }
      }
    }

    if (metricType === 'global') {
      // Global metrics: only show metrics without children from filtered set
      this.metricClassOptions$.next([]);
      this.metricKeyOptions$.next([]);
      const globalMetrics = filteredMetrics.filter((metric) => !metric.children || metric.children.length === 0);
      this.metricIdOptions$.next(globalMetrics);
    } else {
      // Repeatable metrics: show hierarchical structure from filtered set
      const repeatableMetrics = filteredMetrics.filter((metric) => metric.children && metric.children.length > 0);
      this.metricClassOptions$.next(repeatableMetrics);
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
    this.metricDataType = null;

    // Clear form fields
    this.metricForm.get('metricClass')?.setValue('');
    this.metricForm.get('metricKey')?.setValue('');
    this.metricForm.get('metricId')?.setValue('');
    this.metricForm.get('displayName')?.setValue(''); // Clear display name when metric type changes

    // Repopulate options based on new metric type
    // BehaviorSubjects will automatically trigger observable re-emission
    this.populateOptions();

    // Update form state
    this.resetStatisticFields();
    this.updateFormVisibility();
    this.updateFormValidators();
  }

  onMetricIdChange(metricId: any): void {
    if (metricId) {
      this.detectMetricDataType(metricId);
      this.updateStatisticOptions();
      this.updateFormVisibility();
      this.updateFormValidators();
    } else {
      // Clear everything when metric ID is cleared
      this.metricDataType = null;
      this.hideStatisticDropdowns();
      this.resetStatisticFields();
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
    const hasMetricId = !!this.metricForm.get('metricId')?.value;

    // Base visibility for metric type
    this.showMetricClass = metricType === 'repeatable';
    this.showMetricKey = metricType === 'repeatable';

    // Statistics only show when metric ID is selected
    if (hasMetricId && this.metricDataType) {
      this.showAggregateStatistic = true;
      this.showIndividualStatistic = metricType === 'repeatable';
      this.showComparison = this.metricDataType === IMetricMetaData.CATEGORICAL;
    } else {
      this.showAggregateStatistic = false;
      this.showIndividualStatistic = false;
      this.showComparison = false;
    }

    // Trigger change detection with OnPush strategy
    this.cdr.markForCheck();
  }

  updateMetricTypeAvailability(): void {
    // Disable global metrics for within-subjects experiments (same as legacy component)
    this.isGlobalMetricDisabled = this.currentAssignmentUnit === ASSIGNMENT_UNIT.WITHIN_SUBJECTS;

    // If global metrics are disabled and global is currently selected, switch to repeatable
    if (this.isGlobalMetricDisabled && this.metricForm.get('metricType')?.value === 'global') {
      this.metricForm.get('metricType')?.setValue('repeatable');
    }

    this.cdr.markForCheck();
  }

  updateStatisticOptions(): void {
    if (this.metricDataType === IMetricMetaData.CONTINUOUS) {
      this.aggregateStatisticOptions = this.continuousAggregateOptions;
      this.individualStatisticOptions = this.continuousIndividualOptions;
    } else if (this.metricDataType === IMetricMetaData.CATEGORICAL) {
      this.aggregateStatisticOptions = this.categoricalAggregateOptions;
      this.individualStatisticOptions = this.categoricalIndividualOptions;
    }
    // Note: showComparison is handled in updateFormVisibility()
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
      comparison: '=',
      compareValue: '',
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
    } else {
      CommonFormHelpersService.triggerTouchedToDisplayErrors(this.metricForm);
    }
  }

  sendUpsertMetricRequest(): void {
    const formValue = this.metricForm.value;
    const metricData = this.prepareMetricDataForBackend(formValue);

    // Get current experiment and call helper service
    this.experimentService.selectedExperiment$.pipe(take(1)).subscribe((experiment: Experiment) => {
      if (!experiment) {
        console.error('No experiment selected');
        return;
      }

      if (this.config.params.action === UPSERT_EXPERIMENT_ACTION.ADD) {
        this.metricHelperService.addMetric(experiment, metricData);
      } else {
        const sourceQuery = this.config.params.sourceQuery;
        if (!sourceQuery) {
          console.error('No source query for edit action');
          return;
        }

        this.metricHelperService.updateMetric(experiment, sourceQuery, metricData);
      }

      this.closeModal();
    });
  }

  private prepareMetricDataForBackend(formValue: any): ExperimentQueryDTO {
    const metricType = formValue.metricType;

    // Prepare metric key based on type
    let metricKey: string;
    if (metricType === 'global') {
      // Global metrics use just the metric ID
      metricKey = typeof formValue.metricId === 'object' ? formValue.metricId.key : formValue.metricId;
    } else {
      // Repeatable metrics use class@__@key@__@id format
      const metricClass = typeof formValue.metricClass === 'object' ? formValue.metricClass.key : formValue.metricClass;
      const metricKeyValue = typeof formValue.metricKey === 'object' ? formValue.metricKey.key : formValue.metricKey;
      const metricId = typeof formValue.metricId === 'object' ? formValue.metricId.key : formValue.metricId;
      metricKey = `${metricClass}${METRICS_JOIN_TEXT}${metricKeyValue}${METRICS_JOIN_TEXT}${metricId}`;
    }

    // Prepare query object in the same format as legacy component
    const queryObj: ExperimentQueryDTO = {
      name: formValue.displayName,
      query: {
        operationType: formValue.aggregateStatistic,
      },
      metric: {
        key: metricKey,
      },
      repeatedMeasure: metricType === 'repeatable' ? formValue.individualStatistic : REPEATED_MEASURE.mostRecent,
    };

    // Add comparison function and value for categorical metrics
    if (this.metricDataType === IMetricMetaData.CATEGORICAL && formValue.comparison && formValue.compareValue) {
      queryObj.query = {
        ...queryObj.query,
        compareFn: formValue.comparison,
        compareValue: formValue.compareValue,
      };
    }

    return queryObj;
  }

  get UPSERT_EXPERIMENT_ACTION() {
    return UPSERT_EXPERIMENT_ACTION;
  }

  closeModal(): void {
    this.dialogRef.close();
  }
}
