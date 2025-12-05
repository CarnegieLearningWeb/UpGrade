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
  MetricOption,
  MetricFormControlValue,
  MetricObjectResult,
  TypedMetricFormValue,
  isMetricOption,
} from '../../../../../core/experiments/store/experiments.model';
import { ExperimentService } from '../../../../../core/experiments/experiments.service';
import { MetricHelperService } from '../../../../../core/experiments/metric-helper.service';
import { AnalysisService } from '../../../../../core/analysis/analysis.service';
import { ASSIGNMENT_UNIT, IMetricMetaData, METRIC_TYPE } from 'upgrade_types';
import { MetricAutocompleteService, AutocompleteField } from './services/metric-autocomplete.service';
import { MetricFormDataService } from './services/metric-form-data.service';
import {
  MetricTypeDetectionService,
  StatisticOption,
} from '../../../../../core/experiments/services/metric-type-detection.service';
import { MetricFormStateManager } from './services/metric-form-state-manager.service';

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
  allMetrics: MetricOption[] = [];

  // Autocomplete field managers
  metricClassField!: AutocompleteField;
  metricKeyField!: AutocompleteField;
  metricIdField!: AutocompleteField;

  // Filtered autocomplete observables (for template)
  filteredMetricClasses$!: Observable<MetricOption[]>;
  filteredMetricKeys$!: Observable<MetricOption[]>;
  filteredMetricIds$!: Observable<MetricOption[]>;

  // Assignment unit and context for filtering
  private currentAssignmentUnit: ASSIGNMENT_UNIT | null = null;
  private currentContext: string[] | null = null;

  allowableDataKeys: string[] = [];
  comparisonOptions = [
    { value: '=', label: 'Equal' },
    { value: '<>', label: 'Not equal' },
  ];

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public config: CommonModalConfig<UpsertMetricParams>,
    private readonly formBuilder: FormBuilder,
    private readonly experimentService: ExperimentService,
    private readonly metricHelperService: MetricHelperService,
    private readonly analysisService: AnalysisService,
    private readonly cdr: ChangeDetectorRef,
    public readonly dialogRef: MatDialogRef<UpsertMetricModalComponent>,
    private readonly autocompleteService: MetricAutocompleteService,
    private readonly formDataService: MetricFormDataService,
    private readonly typeDetectionService: MetricTypeDetectionService,
    private readonly stateManager: MetricFormStateManager
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

  // Autocomplete validator using the helper service
  private get autocompleteSelectionValidator() {
    return CommonFormHelpersService.createAutocompleteSelectionValidator(isMetricOption);
  }

  createMetricForm(): void {
    const { sourceQuery, action } = this.config.params;
    const initialValues = this.formDataService.parseSourceQuery(sourceQuery, action);

    this.metricForm = this.formBuilder.group({
      metricType: [initialValues.metricType, Validators.required],
      metricId: [initialValues.metricId, [Validators.required, this.autocompleteSelectionValidator]],
      displayName: [initialValues.displayName, Validators.required],
      metricClass: [initialValues.metricClass, this.autocompleteSelectionValidator],
      metricKey: [initialValues.metricKey, this.autocompleteSelectionValidator],
      aggregateStatistic: [initialValues.aggregateStatistic],
      individualStatistic: [initialValues.individualStatistic],
      comparison: [initialValues.comparison || '='],
      compareValue: [initialValues.compareValue],
    });

    this.allowableDataKeys = initialValues.allowableDataKeys || [];
    this.initialFormValues$.next(initialValues);

    // Initialize autocomplete fields
    this.initializeAutocompleteFields();

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

  private initializeAutocompleteFields(): void {
    // Create autocomplete field managers
    this.metricClassField = this.autocompleteService.createField({
      formGroup: this.metricForm,
      controlName: 'metricClass',
    });

    this.metricKeyField = this.autocompleteService.createField({
      formGroup: this.metricForm,
      controlName: 'metricKey',
    });

    this.metricIdField = this.autocompleteService.createField({
      formGroup: this.metricForm,
      controlName: 'metricId',
    });

    // Expose filtered observables for template
    this.filteredMetricClasses$ = this.metricClassField.filteredOptions$;
    this.filteredMetricKeys$ = this.metricKeyField.filteredOptions$;
    this.filteredMetricIds$ = this.metricIdField.filteredOptions$;
  }

  populateFormForEditMode(initialValues: MetricFormData): void {
    // Wait for allMetrics to be loaded, then populate form with proper objects
    this.subscriptions.add(
      this.allMetrics$
        .pipe(
          filter((metrics) => Array.isArray(metrics) && metrics.length > 0),
          take(1)
        )
        .subscribe((metrics) => {
          const metricObjects = this.formDataService.findMetricObjects(metrics, initialValues);
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

  private updateValidationState(metricObjects: MetricObjectResult): void {
    const { classObject, keyObject, idObject } = metricObjects;

    // Mark selections as valid based on found objects
    if (classObject) {
      this.metricClassField.markAsValid();
    }
    if (keyObject) {
      this.metricKeyField.markAsValid();
    }
    if (idObject) {
      this.metricIdField.markAsValid();
    }
  }

  private initializeMetricTypeAndStatistics(idObject: MetricOption | null): void {
    this.detectMetricDataType(idObject);
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
    const filteredMetrics = this.metricHelperService.filterMetricsByAssignmentContext(
      this.allMetrics || [],
      this.currentAssignmentUnit,
      this.currentContext
    );

    if (metricType === METRIC_TYPE.GLOBAL) {
      this.populateGlobalMetricOptions(filteredMetrics);
      return;
    }

    this.populateRepeatableMetricOptions(filteredMetrics);
  }

  onMetricClassValueChange(selectedClass: MetricFormControlValue): void {
    this.autocompleteService.onValueChange(this.metricClassField, selectedClass, [
      this.metricKeyField,
      this.metricIdField,
    ]);
  }

  onMetricClassOptionSelected(selectedClass: MetricFormControlValue): void {
    const children = this.autocompleteService.onOptionSelected(this.metricClassField, selectedClass, [
      this.metricKeyField,
      this.metricIdField,
    ]);

    if (children.length > 0) {
      this.metricKeyField.setOptions(children);
    }
  }

  onMetricKeyValueChange(selectedKey: MetricFormControlValue): void {
    this.autocompleteService.onValueChange(this.metricKeyField, selectedKey, [this.metricIdField]);
  }

  onMetricKeyOptionSelected(selectedKey: MetricFormControlValue): void {
    const children = this.autocompleteService.onOptionSelected(this.metricKeyField, selectedKey, [this.metricIdField]);

    if (children.length > 0) {
      this.metricIdField.setOptions(children);
    }
  }

  // Use autocomplete service's display function
  displayFn = this.autocompleteService.displayFn;

  private populateGlobalMetricOptions(metrics: MetricOption[]): void {
    this.metricClassField.setOptions([]);
    this.metricKeyField.setOptions([]);
    const globalMetrics = this.metricHelperService.getGlobalMetricOptions(metrics);
    this.metricIdField.setOptions(globalMetrics);
  }

  private populateRepeatableMetricOptions(metrics: MetricOption[]): void {
    const repeatableMetrics = this.metricHelperService.getRepeatableMetricOptions(metrics);
    this.metricClassField.setOptions(repeatableMetrics);

    const selectedClass = this.metricHelperService.resolveOption(
      this.metricForm.get('metricClass')?.value,
      repeatableMetrics
    );
    if (!selectedClass?.children?.length) {
      this.metricKeyField.setOptions([]);
      this.metricIdField.setOptions([]);
      return;
    }

    const classChildren = Array.isArray(selectedClass.children) ? selectedClass.children : [];
    this.metricKeyField.setOptions(classChildren);

    const selectedKey = this.metricHelperService.resolveOption(this.metricForm.get('metricKey')?.value, classChildren);
    if (!selectedKey) {
      this.metricIdField.setOptions([]);
      return;
    }

    const children = this.autocompleteService.getChildrenFromOption(selectedKey);
    this.metricIdField.setOptions(children);
  }

  onMetricTypeChange(): void {
    // Clear everything and repopulate
    this.metricDataType = null;
    this.metricClassField.clear();
    this.metricKeyField.clear();
    this.metricIdField.clear();

    // Clear display name when metric type changes
    this.metricForm.get('displayName')?.setValue('');

    // Repopulate options based on new metric type
    this.populateOptions();

    // Update form state
    this.resetStatisticFields();
    this.updateFormVisibility();
    this.updateFormValidators();
  }

  onMetricIdValueChange(metricId: MetricFormControlValue): void {
    // If user is typing (string value) after selecting an option, invalidate the selection
    if (!isMetricOption(metricId) && this.metricIdField.hasValidSelection()) {
      this.metricIdField.markAsInvalid();
      this.metricDataType = null;
      this.hideStatisticDropdowns();
      this.resetStatisticFields();
      this.updateFormValidators();
    }

    // If field is cleared completely
    if (!metricId) {
      this.metricIdField.markAsInvalid();
      this.metricDataType = null;
      this.hideStatisticDropdowns();
      this.resetStatisticFields();
      this.updateFormValidators();
    }
  }

  onMetricIdOptionSelected(metricId: MetricFormControlValue): void {
    // This is called when user actually selects an option from autocomplete
    if (isMetricOption(metricId)) {
      this.metricIdField.markAsValid();
      this.detectMetricDataType(metricId);
      this.updateStatisticOptions();
      this.clearInvalidStatisticSelections();
      this.updateFormVisibility();
      this.updateFormValidators();
    }
  }

  detectMetricDataType(metricId: MetricFormControlValue): void {
    const result = this.typeDetectionService.detectMetricDataType(metricId, this.metricIdField.getOptions());

    this.metricDataType = result.dataType;
    this.allowableDataKeys = result.allowableDataKeys;
  }

  updateFormVisibility(): void {
    const metricType = this.metricForm.get('metricType')?.value;
    const visibility = this.stateManager.calculateVisibility(
      metricType,
      this.metricIdField.hasValidSelection(),
      this.metricDataType
    );

    this.showMetricClass = visibility.showMetricClass;
    this.showMetricKey = visibility.showMetricKey;
    this.showAggregateStatistic = visibility.showAggregateStatistic;
    this.showIndividualStatistic = visibility.showIndividualStatistic;
    this.showComparison = visibility.showComparison;

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
    if (this.metricDataType) {
      const options = this.typeDetectionService.getStatisticOptions(this.metricDataType);
      this.aggregateStatisticOptions = options.aggregate;
      this.individualStatisticOptions = options.individual;
    }
  }

  private clearInvalidStatisticSelections(): void {
    if (!this.metricForm || !this.metricIdField.hasValidSelection()) {
      return;
    }

    if (this.metricDataType) {
      const options = this.typeDetectionService.getStatisticOptions(this.metricDataType);
      this.stateManager.clearInvalidStatisticSelections(
        this.metricForm,
        this.metricIdField.hasValidSelection(),
        options
      );
    }
  }

  hideStatisticDropdowns(): void {
    this.showAggregateStatistic = false;
    this.showIndividualStatistic = false;
    this.showComparison = false;
  }

  resetStatisticFields(): void {
    this.stateManager.resetStatisticFields(this.metricForm);
    this.allowableDataKeys = [];
  }

  updateFormValidators(): void {
    const metricType = this.metricForm.get('metricType')?.value;
    this.stateManager.updateValidators(
      this.metricForm,
      metricType,
      this.showAggregateStatistic,
      this.showComparison,
      this.autocompleteSelectionValidator
    );
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
      combineLatestWith(this.isInitialFormValueChanged$, this.metricIdField.hasValidSelection$),
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

  private prepareMetricDataForBackend(formValue: TypedMetricFormValue): ExperimentQueryDTO {
    return this.formDataService.prepareForBackend(formValue, this.metricDataType);
  }

  closeModal(): void {
    this.dialogRef.close();
  }
}
