import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
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
import { NotificationService } from '../../../../../core/notifications/notification.service';
import { METRICS_JOIN_TEXT } from '../../../../../core/analysis/store/analysis.models';
import { CommonLearnMoreLinkComponent } from '../../../../../shared-standalone-component-lib/components';
import {
  ASSIGNMENT_UNIT,
  IMetricMetaData,
  IMetricUnit,
  METRIC_TYPE,
  OPERATION_TYPES,
  REPEATED_MEASURE,
  ExperimentQueryPayload,
  ExperimentQueryComparator,
} from 'upgrade_types';

interface StatisticOption {
  value: string;
  label: string;
}

type MetricNode = IMetricUnit;

type MetricControlValue = MetricNode | string | string[] | null;

interface MetricSelection {
  classNode: MetricNode | null;
  keyNode: MetricNode | null;
  idNode: MetricNode | null;
}

interface MetricFormValueBase {
  metricType: METRIC_TYPE;
  metricId: MetricControlValue;
  displayName: string;
  metricClass: MetricControlValue;
  metricKey: MetricControlValue;
  aggregateStatistic: OPERATION_TYPES | '';
  individualStatistic: REPEATED_MEASURE | '';
  comparison: ExperimentQueryComparator | '';
  compareValue: string;
}

interface GlobalMetricFormValue extends MetricFormValueBase {
  metricType: METRIC_TYPE.GLOBAL;
}

interface RepeatableMetricFormValue extends MetricFormValueBase {
  metricType: METRIC_TYPE.REPEATABLE;
}

type MetricFormValue = GlobalMetricFormValue | RepeatableMetricFormValue;

/**
 * Presents the add/edit metric modal and normalizes form values for global and repeatable metrics.
 * Centralizes the multi-step UX (autocomplete selections, validation, payload build) so callers only
 * inject services and consume the resulting DTO sent back through the modal close.
 */
@Component({
  selector: 'upsert-metric-modal',
  imports: [
    CommonModalComponent,
    CommonLearnMoreLinkComponent,
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
  allMetrics: MetricNode[] = [];

  // Filtered autocomplete observables
  filteredMetricClasses$: Observable<MetricNode[]>;
  filteredMetricKeys$: Observable<MetricNode[]>;
  filteredMetricIds$: Observable<MetricNode[]>;

  // BehaviorSubjects for source data
  private readonly metricClassOptions$ = new BehaviorSubject<MetricNode[]>([]);
  private readonly metricKeyOptions$ = new BehaviorSubject<MetricNode[]>([]);
  private readonly metricIdOptions$ = new BehaviorSubject<MetricNode[]>([]);

  // Track if user has selected a valid option from autocomplete (vs just typing)
  private readonly hasValidMetricClassSelection$ = new BehaviorSubject<boolean>(false);
  private readonly hasValidMetricKeySelection$ = new BehaviorSubject<boolean>(false);
  private readonly hasValidMetricIdSelection$ = new BehaviorSubject<boolean>(false);

  // Assignment unit and context for filtering
  private currentAssignmentUnit: ASSIGNMENT_UNIT | null = null;
  private currentContext: string[] | null = null;
  private currentExperiment: Experiment | null = null;

  allowableDataKeys: string[] = [];
  comparisonOptions: Array<{ value: ExperimentQueryComparator; label: string }> = [
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
    private readonly notificationService: NotificationService,
    private readonly cdr: ChangeDetectorRef,
    public readonly dialogRef: MatDialogRef<UpsertMetricModalComponent>
  ) {}

  private getCurrentFormValue(): MetricFormValue {
    return this.metricForm.getRawValue() as MetricFormValue;
  }

  private isRepeatableFormValue(value: MetricFormValue): value is RepeatableMetricFormValue {
    return value.metricType === METRIC_TYPE.REPEATABLE;
  }

  private getNodeKey(node: MetricNode | null | undefined): string {
    if (!node) {
      return '';
    }

    return Array.isArray(node.key) ? node.key.join(METRICS_JOIN_TEXT) : node.key ?? '';
  }

  private toMetricFormData(
    formValue: MetricFormValue,
    allowableDataKeys: string[] = this.allowableDataKeys
  ): MetricFormData {
    return {
      metricType: formValue.metricType,
      metricId: this.extractKey(formValue.metricId),
      displayName: formValue.displayName,
      metricClass: this.extractKey(formValue.metricClass),
      metricKey: this.extractKey(formValue.metricKey),
      aggregateStatistic: formValue.aggregateStatistic,
      individualStatistic: formValue.individualStatistic,
      comparison: formValue.comparison || undefined,
      compareValue: formValue.compareValue,
      allowableDataKeys,
    };
  }

  /**
   * Bootstraps the reactive form, wiring together data sources, listeners, and initial state so the
   * UI reflects the selected experiment context and metric being edited (if any).
   */
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
  private autocompleteSelectionValidator(control: AbstractControl): ValidationErrors | null {
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

  /**
   * Builds the reactive form with validators that reflect the current modal mode (add vs edit) and
   * metric type (global vs repeatable). When editing, seeds controls with parsed source query values.
   */
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

  /**
   * Translates the incoming query into form-ready values, handling both global and repeatable key formats.
   */
  deriveInitialFormValues(sourceQuery: ExperimentQueryDTO | null, action: UPSERT_EXPERIMENT_ACTION): MetricFormData {
    if (action === UPSERT_EXPERIMENT_ACTION.EDIT && sourceQuery) {
      const metricKey = sourceQuery.metric?.key || '';
      const aggregateStatistic = sourceQuery.query?.operationType ?? '';
      const comparison = sourceQuery.query?.compareFn ?? '=';
      const compareValue = sourceQuery.query?.compareValue ?? '';

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
        aggregateStatistic,
        individualStatistic: sourceQuery.repeatedMeasure || '',
        comparison,
        compareValue,
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

  /**
   * When editing, waits for available metrics so the form can rehydrate selections with real node objects
   * instead of raw strings, restoring validator state and statistic dropdowns accurately.
   */
  populateFormForEditMode(initialValues: MetricFormData): void {
    // Wait for allMetrics to be loaded, then populate form with proper objects
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
          if (metricObjects.idNode) {
            this.updateValidationState(metricObjects);
            this.initializeMetricTypeAndStatistics(metricObjects.idNode);
          }

          this.cdr.markForCheck();
        })
    );
  }

  private findMetricObjects(metrics: MetricNode[], initialValues: MetricFormData): MetricSelection {
    const { metricType, metricClass, metricKey, metricId } = initialValues;

    if (metricType === METRIC_TYPE.REPEATABLE) {
      return this.findRepeatableMetricObjects(metrics, metricClass, metricKey, metricId);
    }

    // Global metric: find the metric directly
    return {
      classNode: null,
      keyNode: null,
      idNode: metrics.find((m) => this.extractKey(m) === metricId) ?? null,
    };
  }

  private findRepeatableMetricObjects(
    metrics: MetricNode[],
    metricClass: string,
    metricKey: string,
    metricId: string
  ): MetricSelection {
    const classNode = metrics.find((m) => this.extractKey(m) === metricClass) ?? null;

    if (!classNode?.children) {
      return { classNode, keyNode: null, idNode: null };
    }

    const keyNode = classNode.children?.find((k) => this.extractKey(k) === metricKey) ?? null;

    if (!keyNode) {
      return { classNode, keyNode: null, idNode: null };
    }

    // Find ID object in key's children, or use key itself if no children
    const idNode = keyNode.children?.length
      ? keyNode.children.find((id) => this.extractKey(id) === metricId) ?? null
      : keyNode;

    return { classNode, keyNode, idNode };
  }

  private updateFormWithMetricObjects(initialValues: MetricFormData, metricObjects: MetricSelection): void {
    const { classNode, keyNode, idNode } = metricObjects;

    // Update form with found objects (fallback to string values if not found)
    const formControlUpdates = {
      metricClass: classNode ?? initialValues.metricClass,
      metricKey: keyNode ?? initialValues.metricKey,
      metricId: idNode ?? initialValues.metricId,
    };

    this.metricForm.patchValue(formControlUpdates);
    this.populateOptions();

    // Update initial form values once with all necessary data
    const normalizedInitialValues = this.toMetricFormData(
      this.getCurrentFormValue(),
      this.allowableDataKeys.length > 0 ? this.allowableDataKeys : initialValues.allowableDataKeys ?? []
    );

    if (!isEqual(this.initialFormValues$.value, normalizedInitialValues)) {
      this.initialFormValues$.next(normalizedInitialValues);
    }
  }

  private updateValidationState(metricObjects: MetricSelection): void {
    const { classNode, keyNode, idNode } = metricObjects;

    // Mark selections as valid based on found objects
    if (classNode) {
      this.hasValidMetricClassSelection$.next(true);
    }
    if (keyNode) {
      this.hasValidMetricKeySelection$.next(true);
    }
    if (idNode) {
      this.hasValidMetricIdSelection$.next(true);
    }
  }

  private initializeMetricTypeAndStatistics(idNode: MetricControlValue): void {
    this.detectMetricDataType(idNode);
    this.updateStatisticOptions();
    this.clearInvalidStatisticSelections();
    this.updateFormVisibility();
    this.updateFormValidators();

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
        this.onMetricClassValueChange(selectedClass as MetricControlValue);
      })
    );

    this.subscriptions.add(
      this.metricForm.get('metricKey')?.valueChanges.subscribe((selectedKey) => {
        this.onMetricKeyValueChange(selectedKey as MetricControlValue);
      })
    );

    this.subscriptions.add(
      this.metricForm.get('metricId')?.valueChanges.subscribe((metricId) => {
        this.onMetricIdValueChange(metricId as MetricControlValue);
      })
    );
  }

  setupAutocomplete(): void {
    this.subscriptions.add(
      this.allMetrics$.subscribe((metrics) => {
        this.allMetrics = Array.isArray(metrics) ? (metrics as MetricNode[]) : [];
        this.populateOptions();
        this.createFilteredObservables();
      })
    );
  }

  setupExperimentContext(): void {
    this.subscriptions.add(
      this.experimentService.selectedExperiment$.subscribe((experiment) => {
        if (experiment) {
          this.currentExperiment = experiment;
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
            this.currentExperiment = experiment;
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

    const { metricType } = this.getCurrentFormValue();
    const filteredMetrics = this.filterMetricsByAssignmentContext(this.allMetrics || []);

    if (metricType === METRIC_TYPE.GLOBAL) {
      this.populateGlobalMetricOptions(filteredMetrics);
      return;
    }

    this.populateRepeatableMetricOptions(filteredMetrics);
  }

  createFilteredObservables(): void {
    const metricClassControl = this.metricForm.get('metricClass');
    const metricKeyControl = this.metricForm.get('metricKey');
    const metricIdControl = this.metricForm.get('metricId');

    const metricClassChanges$ = metricClassControl
      ? metricClassControl.valueChanges.pipe(startWith((metricClassControl.value ?? null) as MetricControlValue))
      : new BehaviorSubject<MetricControlValue>(null);

    const metricKeyChanges$ = metricKeyControl
      ? metricKeyControl.valueChanges.pipe(startWith((metricKeyControl.value ?? null) as MetricControlValue))
      : new BehaviorSubject<MetricControlValue>(null);

    const metricIdChanges$ = metricIdControl
      ? metricIdControl.valueChanges.pipe(startWith((metricIdControl.value ?? null) as MetricControlValue))
      : new BehaviorSubject<MetricControlValue>(null);

    this.filteredMetricClasses$ = combineLatest([metricClassChanges$, this.metricClassOptions$]).pipe(
      map(([searchValue, options]) => this._filter(searchValue as MetricControlValue, options))
    );

    this.filteredMetricKeys$ = combineLatest([metricKeyChanges$, this.metricKeyOptions$]).pipe(
      map(([searchValue, options]) => this._filter(searchValue as MetricControlValue, options))
    );

    this.filteredMetricIds$ = combineLatest([metricIdChanges$, this.metricIdOptions$]).pipe(
      map(([searchValue, options]) => this._filter(searchValue as MetricControlValue, options))
    );
  }

  onMetricClassValueChange(selectedClass: MetricControlValue): void {
    // If user is typing (string value) after selecting an option, invalidate the selection
    if (
      (typeof selectedClass === 'string' || Array.isArray(selectedClass)) &&
      this.hasValidMetricClassSelection$.getValue()
    ) {
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

  onMetricClassOptionSelected(selectedClass: MetricNode): void {
    if (selectedClass && typeof selectedClass === 'object' && selectedClass.children) {
      this.hasValidMetricClassSelection$.next(true);
      const classChildren: MetricNode[] = Array.isArray(selectedClass.children) ? selectedClass.children : [];
      this.metricKeyOptions$.next(classChildren);

      // Reset dependent fields
      this.metricForm.get('metricKey')?.setValue('');
      this.metricForm.get('metricId')?.setValue('');
      this.metricIdOptions$.next([]);
      this.hasValidMetricKeySelection$.next(false);
      this.hasValidMetricIdSelection$.next(false);
    }
  }

  onMetricKeyValueChange(selectedKey: MetricControlValue): void {
    // If user is typing (string value) after selecting an option, invalidate the selection
    if (
      (typeof selectedKey === 'string' || Array.isArray(selectedKey)) &&
      this.hasValidMetricKeySelection$.getValue()
    ) {
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

  onMetricKeyOptionSelected(selectedKey: MetricNode): void {
    if (selectedKey && typeof selectedKey === 'object') {
      this.hasValidMetricKeySelection$.next(true);

      // Set metric IDs based on selected key's children
      this.metricIdOptions$.next(this.getMetricIdOptionsFromKey(selectedKey));

      // Reset ID field
      this.metricForm.get('metricId')?.setValue('');
      this.hasValidMetricIdSelection$.next(false);
    }
  }

  displayFn = (option?: MetricControlValue): string => {
    if (!option) {
      return '';
    }

    if (typeof option === 'string') {
      return option;
    }

    if (Array.isArray(option)) {
      return option.join(', ');
    }

    const key = this.getNodeKey(option);
    return key.includes(METRICS_JOIN_TEXT) ? key.split(METRICS_JOIN_TEXT).join(' / ') : key;
  };

  private extractKey(value: MetricControlValue): string {
    if (!value) {
      return '';
    }

    if (typeof value === 'string') {
      return value;
    }

    if (Array.isArray(value)) {
      return value.join(METRICS_JOIN_TEXT);
    }

    return this.getNodeKey(value);
  }

  private _filter(value: MetricControlValue, options: MetricNode[]): MetricNode[] {
    const filterValue = this.extractKey(value).toLowerCase();
    return options.filter((option) => {
      const optionKey = this.getNodeKey(option);
      return optionKey?.toLowerCase().includes(filterValue) ?? false;
    });
  }

  private findOptionByKey(options: MetricNode[], key: string): MetricNode | undefined {
    if (!options.length || !key) {
      return undefined;
    }
    return options.find((option) => this.getNodeKey(option) === key);
  }

  private resolveSelectedOption(controlValue: MetricControlValue, options: MetricNode[] = []): MetricNode | undefined {
    if (!controlValue) {
      return undefined;
    }
    if (Array.isArray(controlValue)) {
      return this.findOptionByKey(options, controlValue.join(METRICS_JOIN_TEXT));
    }

    if (typeof controlValue === 'object') {
      return controlValue;
    }
    return this.findOptionByKey(options, this.extractKey(controlValue));
  }

  private getMetricIdOptionsFromKey(selectedKey: MetricControlValue): MetricNode[] {
    if (!selectedKey || typeof selectedKey !== 'object' || Array.isArray(selectedKey)) {
      return [];
    }

    if (selectedKey.children && selectedKey.children.length > 0) {
      return Array.isArray(selectedKey.children) ? selectedKey.children : [];
    }

    return [selectedKey];
  }

  private filterMetricsByAssignmentContext(metrics: MetricNode[]): MetricNode[] {
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

  private populateGlobalMetricOptions(metrics: MetricNode[]): void {
    this.metricClassOptions$.next([]);
    this.metricKeyOptions$.next([]);
    const globalMetrics = metrics.filter((metric) => !metric.children || metric.children.length === 0);
    this.metricIdOptions$.next(globalMetrics);
  }

  private populateRepeatableMetricOptions(metrics: MetricNode[]): void {
    const repeatableMetrics = metrics.filter((metric) => metric.children && metric.children.length > 0);
    this.metricClassOptions$.next(repeatableMetrics);

    const selectedClassValue = this.metricForm.get('metricClass')?.value as MetricControlValue;
    const selectedClass = this.resolveSelectedOption(selectedClassValue, repeatableMetrics);
    if (!selectedClass?.children?.length) {
      this.metricKeyOptions$.next([]);
      this.metricIdOptions$.next([]);
      return;
    }

    const classChildren: MetricNode[] = Array.isArray(selectedClass.children) ? selectedClass.children : [];
    this.metricKeyOptions$.next(classChildren);

    const selectedKeyValue = this.metricForm.get('metricKey')?.value as MetricControlValue;
    const selectedKey = this.resolveSelectedOption(selectedKeyValue, classChildren);
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

  onMetricIdValueChange(metricId: MetricControlValue): void {
    // If user is typing (string or string[] value) after selecting an option, invalidate the selection
    if ((typeof metricId === 'string' || Array.isArray(metricId)) && this.hasValidMetricIdSelection$.getValue()) {
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

  onMetricIdOptionSelected(metricId: MetricNode): void {
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

  detectMetricDataType(metricId: MetricControlValue): void {
    const selectedMetric = this.findSelectedMetric(metricId);

    // Use metadata if available
    if (selectedMetric?.metadata?.type) {
      this.setMetricDataType(selectedMetric.metadata.type, selectedMetric);
      return;
    }

    // Fallback to heuristic detection
    this.detectMetricTypeByHeuristic(metricId);
  }

  private findSelectedMetric(metricId: MetricControlValue): MetricNode | null {
    if (metricId && typeof metricId === 'object' && !Array.isArray(metricId) && metricId.metadata) {
      return metricId;
    }

    if (typeof metricId === 'string') {
      const currentOptions = this.metricIdOptions$.getValue();
      return currentOptions.find((metric) => this.getNodeKey(metric) === metricId) ?? null;
    }

    if (Array.isArray(metricId)) {
      const joinedKey = metricId.join(METRICS_JOIN_TEXT);
      return this.metricIdOptions$.getValue().find((metric) => this.getNodeKey(metric) === joinedKey) ?? null;
    }

    return null;
  }

  private setMetricDataType(dataType: IMetricMetaData, selectedMetric?: MetricNode): void {
    this.metricDataType = dataType;

    if (dataType === IMetricMetaData.CATEGORICAL) {
      this.allowableDataKeys = selectedMetric?.allowedData ? [...selectedMetric.allowedData] : [];
    } else {
      this.allowableDataKeys = [];
    }
  }

  private detectMetricTypeByHeuristic(metricId: MetricControlValue): void {
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
    const { metricType } = this.getCurrentFormValue();

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
    const { metricType } = this.getCurrentFormValue();
    if (this.isGlobalMetricDisabled && metricType === METRIC_TYPE.GLOBAL) {
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
    const { metricType } = this.getCurrentFormValue();

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

  /**
   * Emits whether the user has diverged from the original payload so the modal can toggle its action button.
   */
  listenForIsInitialFormValueChanged(): void {
    this.isInitialFormValueChanged$ = this.metricForm.valueChanges.pipe(
      startWith(this.getCurrentFormValue()),
      map((value) => value as MetricFormValue),
      map((formValue) => this.toMetricFormData(formValue)),
      map((normalizedValue) => !isEqual(normalizedValue, this.initialFormValues$.value))
    );
  }

  /**
   * Combines form validity, loading status, and selection completeness to drive the primary button state.
   */
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

  /**
   * Resolves the target experiment and dispatches the normalized metric payload through the helper service.
   */
  sendUpsertMetricRequest(): void {
    const formValue = this.getCurrentFormValue();
    const metricData = this.prepareMetricDataForBackend(formValue);

    const experiment = this.currentExperiment;

    if (experiment) {
      this.executeMetricUpsert(experiment, metricData);
      return;
    }

    this.experimentService.selectedExperiment$.pipe(take(1)).subscribe((selectedExperiment) => {
      if (!selectedExperiment) {
        this.notificationService.showError('Unable to load the selected experiment. Please refresh and try again.');
        return;
      }

      const resolvedExperiment = selectedExperiment as Experiment;
      this.currentExperiment = resolvedExperiment;
      this.executeMetricUpsert(resolvedExperiment, metricData);
    });
  }

  private executeMetricUpsert(experiment: Experiment, metricData: ExperimentQueryDTO): void {
    if (this.config.params.action === UPSERT_EXPERIMENT_ACTION.ADD) {
      this.metricHelperService.addMetric(experiment, metricData);
      this.closeModal();
      return;
    }

    const sourceQuery = this.config.params.sourceQuery;
    if (!sourceQuery) {
      this.notificationService.showError('Unable to update the metric because required query details are missing.');
      return;
    }

    this.metricHelperService.updateMetric(experiment, sourceQuery, metricData);
    this.closeModal();
  }

  /**
   * Normalizes the form value into the backend DTO, joining repeatable keys and attaching categorical filters
   * only when required by the selected metric metadata.
   */
  private prepareMetricDataForBackend(formValue: MetricFormValue): ExperimentQueryDTO {
    const metricKey = this.isRepeatableFormValue(formValue)
      ? `${this.extractKey(formValue.metricClass)}${METRICS_JOIN_TEXT}${this.extractKey(
          formValue.metricKey
        )}${METRICS_JOIN_TEXT}${this.extractKey(formValue.metricId)}`
      : this.extractKey(formValue.metricId);

    const repeatedMeasure = this.isRepeatableFormValue(formValue)
      ? formValue.individualStatistic || REPEATED_MEASURE.mostRecent
      : REPEATED_MEASURE.mostRecent;

    const operationType = formValue.aggregateStatistic as OPERATION_TYPES;

    const queryPayload: ExperimentQueryPayload = {
      operationType,
      ...(this.metricDataType === IMetricMetaData.CATEGORICAL &&
        formValue.comparison &&
        formValue.compareValue && {
          compareFn: formValue.comparison,
          compareValue: formValue.compareValue,
        }),
    };

    // Prepare query object
    const queryObj: ExperimentQueryDTO = {
      name: formValue.displayName,
      query: queryPayload,
      metric: {
        key: metricKey,
      },
      repeatedMeasure,
    };

    return queryObj;
  }

  closeModal(): void {
    this.dialogRef.close();
  }
}
