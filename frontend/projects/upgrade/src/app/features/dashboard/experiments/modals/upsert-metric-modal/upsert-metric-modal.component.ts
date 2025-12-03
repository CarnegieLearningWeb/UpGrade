import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { BehaviorSubject, Observable, Subscription, combineLatest } from 'rxjs';
import { combineLatestWith, filter, map, startWith, take } from 'rxjs/operators';
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
import { SharedModule } from '../../../../../shared/shared.module';
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
import { ASSIGNMENT_UNIT, IMetricMetaData, METRIC_TYPE, OPERATION_TYPES, REPEATED_MEASURE } from 'upgrade_types';

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
    SharedModule,
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

  // Autocomplete
  allMetrics$ = this.analysisService.allMetrics$;
  allMetrics: any[] = [];

  // Filtered autocomplete observables
  filteredMetricClasses$: Observable<any[]>;
  filteredMetricKeys$: Observable<any[]>;
  filteredMetricIds$: Observable<any[]>;

  // BehaviorSubjects for source data
  private readonly metricClassOptions$ = new BehaviorSubject<any[]>([]);
  private readonly metricKeyOptions$ = new BehaviorSubject<any[]>([]);
  private readonly metricIdOptions$ = new BehaviorSubject<any[]>([]);

  // Track if user has selected a valid option from autocomplete (vs just typing)
  private readonly hasValidMetricClassSelection$ = new BehaviorSubject<boolean>(false);
  private readonly hasValidMetricKeySelection$ = new BehaviorSubject<boolean>(false);
  private readonly hasValidMetricIdSelection$ = new BehaviorSubject<boolean>(false);

  // Assignment unit and context for filtering
  private currentAssignmentUnit: ASSIGNMENT_UNIT | null = null;
  private currentContext: string[] | null = null;

  allowableDataKeys: string[] = [];
  comparisonOptions = [
    { value: '=', label: 'Equal' },
    { value: '<>', label: 'Not equal' },
  ];

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
    private readonly formBuilder: FormBuilder,
    private readonly experimentService: ExperimentService,
    private readonly metricHelperService: MetricHelperService,
    private readonly analysisService: AnalysisService,
    private readonly cdr: ChangeDetectorRef,
    public readonly dialogRef: MatDialogRef<UpsertMetricModalComponent>
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

  // Custom validator to ensure fields are selected from options (object) not typed (string)
  private autocompleteSelectionValidator(control: any): { [key: string]: any } | null {
    const value = control.value;
    if (!value) {
      return null; // Let required validator handle empty values
    }
    // Valid if it's an object (selected from autocomplete)
    if (typeof value === 'object' && value !== null) {
      return null;
    }
    // Invalid if it's a string (typed, not selected)
    return { mustSelectFromOptions: true };
  }

  createMetricForm(): void {
    const { sourceQuery, action } = this.config.params;
    const initialValues = this.deriveInitialFormValues(sourceQuery, action);

    this.metricForm = this.formBuilder.group({
      metricType: [initialValues.metricType, Validators.required],
      metricId: [initialValues.metricId, [Validators.required, this.autocompleteSelectionValidator.bind(this)]],
      displayName: [initialValues.displayName, Validators.required],
      metricClass: [initialValues.metricClass, this.autocompleteSelectionValidator.bind(this)],
      metricKey: [initialValues.metricKey, this.autocompleteSelectionValidator.bind(this)],
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
      this.populateFormForEditMode(initialValues);
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
        metricType: isRepeatable ? METRIC_TYPE.REPEATABLE : METRIC_TYPE.GLOBAL,
        metricId,
        displayName: sourceQuery.name || '',
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
      metricType: METRIC_TYPE.GLOBAL,
      metricId: '',
      displayName: '',
      metricClass: '',
      metricKey: '',
      aggregateStatistic: '',
      individualStatistic: '',
      comparison: '=',
      compareValue: '',
      allowableDataKeys: [],
    };
  }

  populateFormForEditMode(initialValues: MetricFormData): void {
    // Wait for allMetrics to be loaded, then populate form with proper objects
    // Using take(1) ensures subscription auto-completes, no manual cleanup needed
    this.subscriptions.add(
      this.allMetrics$
        .pipe(
          filter((metrics) => Array.isArray(metrics) && metrics.length > 0),
          take(1)
        )
        .subscribe((metrics) => {
          const metricObjects = this.findMetricObjects(metrics, initialValues);
          this.updateFormWithMetricObjects(initialValues, metricObjects);

          // Only update validation state and initialize statistics if idObject exists
          if (metricObjects.idObject) {
            this.updateValidationState(metricObjects);
            this.initializeMetricTypeAndStatistics(metricObjects.idObject);
          }

          this.cdr.markForCheck();
        })
    );
  }

  private findMetricObjects(
    metrics: any[],
    initialValues: MetricFormData
  ): { classObject: any; keyObject: any; idObject: any } {
    const { metricType, metricClass, metricKey, metricId } = initialValues;

    if (metricType === METRIC_TYPE.REPEATABLE) {
      return this.findRepeatableMetricObjects(metrics, metricClass, metricKey, metricId);
    }

    // Global metric: find the metric directly
    return {
      classObject: null,
      keyObject: null,
      idObject: metrics.find((m) => m.key === metricId) ?? null,
    };
  }

  private findRepeatableMetricObjects(
    metrics: any[],
    metricClass: string,
    metricKey: string,
    metricId: string
  ): { classObject: any; keyObject: any; idObject: any } {
    const classObject = metrics.find((m) => m.key === metricClass) ?? null;

    if (!classObject?.children) {
      return { classObject, keyObject: null, idObject: null };
    }

    const keyObject = classObject.children.find((k: any) => k.key === metricKey) ?? null;

    if (!keyObject) {
      return { classObject, keyObject: null, idObject: null };
    }

    // Find ID object in key's children, or use key itself if no children
    const idObject = keyObject.children?.length
      ? keyObject.children.find((id: any) => id.key === metricId) ?? null
      : keyObject;

    return { classObject, keyObject, idObject };
  }

  private updateFormWithMetricObjects(
    initialValues: MetricFormData,
    metricObjects: { classObject: any; keyObject: any; idObject: any }
  ): void {
    const { classObject, keyObject, idObject } = metricObjects;

    // Update form with found objects (fallback to string values if not found)
    const formUpdates = {
      metricClass: classObject ?? initialValues.metricClass,
      metricKey: keyObject ?? initialValues.metricKey,
      metricId: idObject ?? initialValues.metricId,
    };

    this.metricForm.patchValue(formUpdates);
    this.populateOptions();

    // Update initial form values once with all necessary data
    const updatedInitialValues: MetricFormData = {
      ...this.initialFormValues$.value,
      ...formUpdates,
      // Include allowableDataKeys if available (for categorical metrics)
      allowableDataKeys: this.allowableDataKeys.length > 0 ? this.allowableDataKeys : initialValues.allowableDataKeys,
    };

    if (!isEqual(this.initialFormValues$.value, updatedInitialValues)) {
      this.initialFormValues$.next(updatedInitialValues);
    }
  }

  private updateValidationState(metricObjects: { classObject: any; keyObject: any; idObject: any }): void {
    const { classObject, keyObject, idObject } = metricObjects;

    // Mark selections as valid based on found objects
    if (classObject) {
      this.hasValidMetricClassSelection$.next(true);
    }
    if (keyObject) {
      this.hasValidMetricKeySelection$.next(true);
    }
    if (idObject) {
      this.hasValidMetricIdSelection$.next(true);
    }
  }

  private initializeMetricTypeAndStatistics(idObject: any): void {
    this.detectMetricDataType(idObject);
    this.updateStatisticOptions();
    this.clearInvalidStatisticSelections();
    this.updateFormVisibility();

    // Re-sync allowableDataKeys to initial values after detection
    // This prevents false "changed" detection for categorical metrics
    if (this.allowableDataKeys.length > 0) {
      const syncedInitialValues: MetricFormData = {
        ...this.initialFormValues$.value,
        allowableDataKeys: this.allowableDataKeys,
      };
      if (!isEqual(this.initialFormValues$.value, syncedInitialValues)) {
        this.initialFormValues$.next(syncedInitialValues);
      }
    }
  }

  setupFormChangeListeners(): void {
    this.subscriptions.add(
      this.metricForm.get('metricType')?.valueChanges.subscribe(() => {
        this.onMetricTypeChange();
      })
    );

    this.subscriptions.add(
      this.metricForm.get('metricClass')?.valueChanges.subscribe((selectedClass) => {
        this.onMetricClassValueChange(selectedClass);
      })
    );

    this.subscriptions.add(
      this.metricForm.get('metricKey')?.valueChanges.subscribe((selectedKey) => {
        this.onMetricKeyValueChange(selectedKey);
      })
    );

    this.subscriptions.add(
      this.metricForm.get('metricId')?.valueChanges.subscribe((metricId) => {
        this.onMetricIdValueChange(metricId);
      })
    );
  }

  setupAutocomplete(): void {
    this.subscriptions.add(
      this.allMetrics$.subscribe((metrics) => {
        this.allMetrics = metrics || [];
        this.populateOptions();
        this.createFilteredObservables();
      })
    );
  }

  setupExperimentContext(): void {
    this.subscriptions.add(
      this.experimentService.selectedExperiment$.subscribe((experiment) => {
        if (experiment) {
          this.currentAssignmentUnit = experiment.assignmentUnit;
          this.currentContext = experiment.context;
          this.updateMetricTypeAvailability();
          this.populateOptions();
        }
      })
    );

    if (this.config.params.experimentId && !this.currentAssignmentUnit) {
      this.subscriptions.add(
        this.experimentService.experiments$.subscribe((experiments) => {
          const experiment = experiments.find((exp) => exp.id === this.config.params.experimentId);
          if (experiment && !this.currentAssignmentUnit) {
            this.currentAssignmentUnit = experiment.assignmentUnit;
            this.currentContext = experiment.context;
            this.updateMetricTypeAvailability();
            this.populateOptions();
          }
        })
      );
    }
  }

  populateOptions(): void {
    if (!this.metricForm) {
      return;
    }

    const metricType = this.metricForm.get('metricType')?.value;
    const filteredMetrics = this.sanitizeMetricOptions(this.filterMetricsByAssignmentContext(this.allMetrics || []));

    if (metricType === METRIC_TYPE.GLOBAL) {
      this.populateGlobalMetricOptions(filteredMetrics);
      return;
    }

    this.populateRepeatableMetricOptions(filteredMetrics);
  }

  createFilteredObservables(): void {
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

  onMetricClassValueChange(selectedClass: any): void {
    // If user is typing (string value) after selecting an option, invalidate the selection
    if (typeof selectedClass === 'string' && this.hasValidMetricClassSelection$.getValue()) {
      this.hasValidMetricClassSelection$.next(false);
      // Clear dependent fields when parent becomes invalid
      this.metricKeyOptions$.next([]);
      this.metricIdOptions$.next([]);
      this.metricForm.get('metricKey')?.setValue('');
      this.metricForm.get('metricId')?.setValue('');
      this.hasValidMetricKeySelection$.next(false);
      this.hasValidMetricIdSelection$.next(false);
    }

    // If field is cleared completely
    if (!selectedClass) {
      this.hasValidMetricClassSelection$.next(false);
      this.metricKeyOptions$.next([]);
      this.metricIdOptions$.next([]);
      this.metricForm.get('metricKey')?.setValue('');
      this.metricForm.get('metricId')?.setValue('');
      this.hasValidMetricKeySelection$.next(false);
      this.hasValidMetricIdSelection$.next(false);
    }
  }

  onMetricClassOptionSelected(selectedClass: any): void {
    if (selectedClass && typeof selectedClass === 'object' && selectedClass.children) {
      this.hasValidMetricClassSelection$.next(true);
      this.metricKeyOptions$.next(this.sanitizeMetricOptions(selectedClass.children));

      // Reset dependent fields
      this.metricForm.get('metricKey')?.setValue('');
      this.metricForm.get('metricId')?.setValue('');
      this.metricIdOptions$.next([]);
      this.hasValidMetricKeySelection$.next(false);
      this.hasValidMetricIdSelection$.next(false);
    }
  }

  onMetricKeyValueChange(selectedKey: any): void {
    // If user is typing (string value) after selecting an option, invalidate the selection
    if (typeof selectedKey === 'string' && this.hasValidMetricKeySelection$.getValue()) {
      this.hasValidMetricKeySelection$.next(false);
      // Clear dependent fields when parent becomes invalid
      this.metricIdOptions$.next([]);
      this.metricForm.get('metricId')?.setValue('');
      this.hasValidMetricIdSelection$.next(false);
    }

    // If field is cleared completely
    if (!selectedKey) {
      this.hasValidMetricKeySelection$.next(false);
      this.metricIdOptions$.next([]);
      this.metricForm.get('metricId')?.setValue('');
      this.hasValidMetricIdSelection$.next(false);
    }
  }

  onMetricKeyOptionSelected(selectedKey: any): void {
    if (selectedKey && typeof selectedKey === 'object') {
      this.hasValidMetricKeySelection$.next(true);

      // Set metric IDs based on selected key's children
      this.metricIdOptions$.next(this.getMetricIdOptionsFromKey(selectedKey));

      // Reset ID field
      this.metricForm.get('metricId')?.setValue('');
      this.hasValidMetricIdSelection$.next(false);
    }
  }

  displayFn = (option?: any): string => {
    return option?.key || option || '';
  };

  private extractKey(value: any): string {
    return typeof value === 'object' ? value?.key || '' : value || '';
  }

  private _filter(value: any, options: any[]): any[] {
    const filterValue = this.extractKey(value).toLowerCase();
    return options.filter((option) => option.key?.toLowerCase().includes(filterValue));
  }

  private sanitizeMetricOptions(options?: any[]): any[] {
    if (!options?.length) {
      return [];
    }
    return options.filter((option) => !option?.key?.endsWith('_REWARD'));
  }

  private findOptionByKey(options: any[], key: string): any {
    if (!options.length || !key) {
      return undefined;
    }
    return options.find((option) => option?.key === key);
  }

  private resolveSelectedOption(controlValue: any, options: any[] = []): any {
    if (!controlValue) {
      return undefined;
    }
    if (typeof controlValue === 'object') {
      return controlValue;
    }
    return this.findOptionByKey(options, this.extractKey(controlValue));
  }

  private getMetricIdOptionsFromKey(selectedKey: any): any[] {
    if (!selectedKey || typeof selectedKey !== 'object') {
      return [];
    }

    if (selectedKey.children && selectedKey.children.length > 0) {
      return this.sanitizeMetricOptions(selectedKey.children);
    }

    return this.sanitizeMetricOptions([selectedKey]);
  }

  private filterMetricsByAssignmentContext(metrics: any[]): any[] {
    if (!metrics?.length) {
      return [];
    }

    if (this.currentAssignmentUnit === ASSIGNMENT_UNIT.WITHIN_SUBJECTS) {
      const withinSubjectsMetrics = metrics.filter((metric) => metric.children && metric.children.length > 0);
      return withinSubjectsMetrics.length > 0 ? withinSubjectsMetrics : metrics;
    }

    if (this.currentAssignmentUnit && this.currentContext?.length) {
      const contextFilteredMetrics = metrics.filter(
        (metric) => metric.context && this.currentContext?.some((ctx) => metric.context.includes(ctx))
      );
      if (contextFilteredMetrics.length > 0) {
        return contextFilteredMetrics;
      }
    }

    return metrics;
  }

  private populateGlobalMetricOptions(metrics: any[]): void {
    this.metricClassOptions$.next([]);
    this.metricKeyOptions$.next([]);
    const globalMetrics = metrics.filter((metric) => !metric.children || metric.children.length === 0);
    this.metricIdOptions$.next(this.sanitizeMetricOptions(globalMetrics));
  }

  private populateRepeatableMetricOptions(metrics: any[]): void {
    const repeatableMetrics = metrics.filter((metric) => metric.children && metric.children.length > 0);
    this.metricClassOptions$.next(repeatableMetrics);

    const selectedClass = this.resolveSelectedOption(this.metricForm.get('metricClass')?.value, repeatableMetrics);
    if (!selectedClass?.children?.length) {
      this.metricKeyOptions$.next([]);
      this.metricIdOptions$.next([]);
      return;
    }

    const sanitizedClassChildren = this.sanitizeMetricOptions(selectedClass.children);
    this.metricKeyOptions$.next(sanitizedClassChildren);

    const selectedKey = this.resolveSelectedOption(this.metricForm.get('metricKey')?.value, sanitizedClassChildren);
    if (!selectedKey) {
      this.metricIdOptions$.next([]);
      return;
    }

    this.metricIdOptions$.next(this.getMetricIdOptionsFromKey(selectedKey));
  }

  onMetricTypeChange(): void {
    // Clear everything and repopulate
    this.metricDataType = null;
    this.hasValidMetricClassSelection$.next(false);
    this.hasValidMetricKeySelection$.next(false);
    this.hasValidMetricIdSelection$.next(false);

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

  onMetricIdValueChange(metricId: any): void {
    // If user is typing (string value) after selecting an option, invalidate the selection
    if (typeof metricId === 'string' && this.hasValidMetricIdSelection$.getValue()) {
      this.hasValidMetricIdSelection$.next(false);
      this.metricDataType = null;
      this.hideStatisticDropdowns();
      this.resetStatisticFields();
      this.updateFormValidators();
    }

    // If field is cleared completely
    if (!metricId) {
      this.hasValidMetricIdSelection$.next(false);
      this.metricDataType = null;
      this.hideStatisticDropdowns();
      this.resetStatisticFields();
      this.updateFormValidators();
    }
  }

  onMetricIdOptionSelected(metricId: any): void {
    // This is called when user actually selects an option from autocomplete
    if (metricId && typeof metricId === 'object') {
      this.hasValidMetricIdSelection$.next(true);
      this.detectMetricDataType(metricId);
      this.updateStatisticOptions();
      this.clearInvalidStatisticSelections();
      this.updateFormVisibility();
      this.updateFormValidators();
    }
  }

  detectMetricDataType(metricId: any): void {
    const selectedMetric = this.findSelectedMetric(metricId);

    // Use metadata if available
    if (selectedMetric?.metadata?.type) {
      this.setMetricDataType(selectedMetric.metadata.type, selectedMetric);
      return;
    }

    // Fallback to heuristic detection
    this.detectMetricTypeByHeuristic(metricId);
  }

  private findSelectedMetric(metricId: any): any {
    if (typeof metricId === 'object' && metricId.metadata) {
      return metricId;
    }

    if (typeof metricId === 'string') {
      const currentOptions = this.metricIdOptions$.getValue();
      return currentOptions.find((metric) => metric.key === metricId);
    }

    return null;
  }

  private setMetricDataType(dataType: IMetricMetaData, selectedMetric?: any): void {
    this.metricDataType = dataType;

    if (dataType === IMetricMetaData.CATEGORICAL) {
      this.allowableDataKeys = selectedMetric?.allowedData ? [...selectedMetric.allowedData] : [];
    } else {
      this.allowableDataKeys = [];
    }
  }

  private detectMetricTypeByHeuristic(metricId: any): void {
    const metricKey = this.extractKey(metricId);
    const lowerMetricKey = metricKey.toLowerCase();

    const continuousKeywords = ['time', 'count', 'score', 'number', 'seconds', 'minutes', 'duration'];
    const categoricalKeywords = ['status', 'type', 'category', 'level', 'completion'];

    if (continuousKeywords.some((keyword) => lowerMetricKey.includes(keyword))) {
      this.setMetricDataType(IMetricMetaData.CONTINUOUS);
    } else if (categoricalKeywords.some((keyword) => lowerMetricKey.includes(keyword))) {
      this.setMetricDataType(IMetricMetaData.CATEGORICAL);
    } else {
      // Default to continuous for unknown types
      this.setMetricDataType(IMetricMetaData.CONTINUOUS);
    }
  }

  updateFormVisibility(): void {
    const metricType = this.metricForm.get('metricType')?.value;

    // Base visibility for metric type
    this.showMetricClass = metricType === METRIC_TYPE.REPEATABLE;
    this.showMetricKey = metricType === METRIC_TYPE.REPEATABLE;

    // Statistics only show when a valid metric ID option has been selected
    if (this.hasValidMetricIdSelection$.getValue() && this.metricDataType) {
      this.showAggregateStatistic = true;
      this.showIndividualStatistic = metricType === METRIC_TYPE.REPEATABLE;
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
    // Disable global metrics for within-subjects experiments
    this.isGlobalMetricDisabled = this.currentAssignmentUnit === ASSIGNMENT_UNIT.WITHIN_SUBJECTS;

    // If global metrics are disabled and global is currently selected, switch to repeatable
    if (this.isGlobalMetricDisabled && this.metricForm.get('metricType')?.value === METRIC_TYPE.GLOBAL) {
      this.metricForm.get('metricType')?.setValue(METRIC_TYPE.REPEATABLE);
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

  private clearInvalidStatisticSelections(): void {
    if (!this.metricForm || !this.hasValidMetricIdSelection$.getValue()) {
      return;
    }

    const aggregateControl = this.metricForm.get('aggregateStatistic');
    const individualControl = this.metricForm.get('individualStatistic');

    const validAggregateValues = this.aggregateStatisticOptions.map((option) => option.value);
    const currentAggregateValue = aggregateControl?.value;

    if (currentAggregateValue && !validAggregateValues.includes(currentAggregateValue)) {
      aggregateControl?.setValue('', { emitEvent: false });
    }

    const validIndividualValues = this.individualStatisticOptions.map((option) => option.value);
    const currentIndividualValue = individualControl?.value;

    if (currentIndividualValue && !validIndividualValues.includes(currentIndividualValue)) {
      individualControl?.setValue('', { emitEvent: false });
    }
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
    if (metricType === METRIC_TYPE.REPEATABLE) {
      this.metricForm
        .get('metricClass')
        ?.setValidators([Validators.required, this.autocompleteSelectionValidator.bind(this)]);
      this.metricForm
        .get('metricKey')
        ?.setValidators([Validators.required, this.autocompleteSelectionValidator.bind(this)]);
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
    for (const key of Object.keys(this.metricForm.controls)) {
      this.metricForm.get(key)?.updateValueAndValidity({ emitEvent: false });
    }

    // Update the form's overall validity status WITH event emission
    // This ensures the observable streams are updated for button state
    this.metricForm.updateValueAndValidity({ emitEvent: true });
  }

  listenForIsInitialFormValueChanged(): void {
    this.isInitialFormValueChanged$ = this.metricForm.valueChanges.pipe(
      startWith(this.metricForm.value),
      map(() => {
        const currentWithKeys = {
          ...this.metricForm.value,
          allowableDataKeys: this.allowableDataKeys,
        };
        return !isEqual(currentWithKeys, this.initialFormValues$.value);
      })
    );
  }

  listenForPrimaryButtonDisabled(): void {
    this.isPrimaryButtonDisabled$ = this.isLoadingUpsertMetric$.pipe(
      combineLatestWith(this.isInitialFormValueChanged$, this.hasValidMetricIdSelection$),
      map(
        ([isLoading, isInitialFormValueChanged, hasValidMetricIdSelection]) =>
          isLoading ||
          this.metricForm.invalid ||
          !hasValidMetricIdSelection ||
          (!isInitialFormValueChanged && this.config.params.action === UPSERT_EXPERIMENT_ACTION.EDIT)
      )
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
    const { metricType, metricClass, metricKey: metricKeyValue, metricId } = formValue;

    // Prepare metric key based on type
    const metricKey =
      metricType === METRIC_TYPE.GLOBAL
        ? this.extractKey(metricId)
        : `${this.extractKey(metricClass)}${METRICS_JOIN_TEXT}${this.extractKey(
            metricKeyValue
          )}${METRICS_JOIN_TEXT}${this.extractKey(metricId)}`;

    // Prepare query object
    const queryObj: ExperimentQueryDTO = {
      name: formValue.displayName,
      query: {
        operationType: formValue.aggregateStatistic,
        // Add comparison for categorical metrics
        ...(this.metricDataType === IMetricMetaData.CATEGORICAL &&
          formValue.comparison &&
          formValue.compareValue && {
            compareFn: formValue.comparison,
            compareValue: formValue.compareValue,
          }),
      },
      metric: {
        key: metricKey,
      },
      repeatedMeasure:
        metricType === METRIC_TYPE.REPEATABLE ? formValue.individualStatistic : REPEATED_MEASURE.mostRecent,
    };

    return queryObj;
  }

  closeModal(): void {
    this.dialogRef.close();
  }
}
