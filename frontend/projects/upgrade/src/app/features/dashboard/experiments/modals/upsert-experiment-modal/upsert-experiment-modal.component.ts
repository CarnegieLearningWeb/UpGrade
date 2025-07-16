import { ChangeDetectionStrategy, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AsyncPipe, NgIf, CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { TranslateModule } from '@ngx-translate/core';
import { BehaviorSubject, Observable, Subscription, combineLatestWith, map, startWith, take } from 'rxjs';
import { isEqual } from 'lodash';

import { CommonModalComponent } from '../../../../../shared-standalone-component-lib/components';
import { CommonTagInputType } from '../../../../../core/feature-flags/store/feature-flags.model';
import { CommonTagsInputComponent } from '../../../../../shared-standalone-component-lib/components/common-tag-input/common-tag-input.component';
import { ExperimentService } from '../../../../../core/experiments/experiments.service';
import {
  UPSERT_EXPERIMENT_ACTION,
  UpsertExperimentParams,
  ExperimentDesignTypes,
  Experiment,
  ExperimentVM,
  IContextMetaData,
  ExperimentFormData,
  AddExperimentRequest,
  UpdateExperimentRequest,
} from '../../../../../core/experiments/store/experiments.model';
import { CommonFormHelpersService } from '../../../../../shared/services/common-form-helpers.service';
import {
  ASSIGNMENT_UNIT,
  CONSISTENCY_RULE,
  CONDITION_ORDER,
  ASSIGNMENT_ALGORITHM,
  EXPERIMENT_STATE,
  FILTER_MODE,
  POST_EXPERIMENT_RULE,
  SUPPORTED_MOOCLET_ALGORITHMS,
  ASSIGNMENT_ALGORITHM_DISPLAY_MAP,
} from 'upgrade_types';
import { CommonModalConfig } from '../../../../../shared-standalone-component-lib/components/common-modal/common-modal.types';
import { StratificationFactorsService } from '../../../../../core/stratification-factors/stratification-factors.service';
import { ENV, Environment } from '../../../../../../environments/environment-types';

@Component({
  selector: 'upsert-experiment-modal',
  imports: [
    CommonModalComponent,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatRadioModule,
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    CommonTagsInputComponent,
    AsyncPipe,
    NgIf,
  ],
  templateUrl: './upsert-experiment-modal.component.html',
  styleUrl: './upsert-experiment-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpsertExperimentModalComponent implements OnInit, OnDestroy {
  isLoadingUpsertExperiment$ = this.experimentService.isLoadingExperiment$;
  selectedExperiment$ = this.experimentService.selectedExperiment$;
  contextMetaData$ = this.experimentService.contextMetaData$;
  allContexts: string[] = [];

  // Group types
  groupTypes: Array<{ value: string }> = [];
  currentContext = '';

  // Stratification factors
  allStratificationFactors: Array<{ factorName: string }> = [];
  isLoadingStratificationFactors$ = this.stratificationFactorsService.isLoading$;

  subscriptions = new Subscription();
  isContextChanged = false;
  initialContext = '';
  isInitialFormValueChanged$: Observable<boolean>;
  isPrimaryButtonDisabled$: Observable<boolean>;

  initialFormValues$ = new BehaviorSubject<ExperimentFormData>(null);

  experimentForm: FormGroup;
  CommonTagInputType = CommonTagInputType;

  // Enum references for template
  UPSERT_EXPERIMENT_ACTION = UPSERT_EXPERIMENT_ACTION;
  ExperimentDesignTypes = ExperimentDesignTypes;
  ASSIGNMENT_UNIT = ASSIGNMENT_UNIT;
  CONSISTENCY_RULE = CONSISTENCY_RULE;
  CONDITION_ORDER = CONDITION_ORDER;
  ASSIGNMENT_ALGORITHM = ASSIGNMENT_ALGORITHM;
  ASSIGNMENT_ALGORITHM_DISPLAY_MAP = ASSIGNMENT_ALGORITHM_DISPLAY_MAP;

  experimentTypes = [
    {
      value: ExperimentDesignTypes.SIMPLE,
      description: 'experiments.upsert-experiment-modal.experiment-type-simple-description.text',
    },
    {
      value: ExperimentDesignTypes.FACTORIAL,
      description: 'experiments.upsert-experiment-modal.experiment-type-factorial-description.text',
    },
  ];

  unitOfAssignments = [
    {
      value: ASSIGNMENT_UNIT.INDIVIDUAL,
      description: 'experiments.upsert-experiment-modal.unit-of-assignment-individual-description.text',
    },
    {
      value: ASSIGNMENT_UNIT.GROUP,
      description: 'experiments.upsert-experiment-modal.unit-of-assignment-group-description.text',
    },
  ];

  consistencyRules = [
    {
      value: CONSISTENCY_RULE.INDIVIDUAL,
      description: 'experiments.upsert-experiment-modal.consistency-rule-individual-description.text',
      disabled: false,
    },
    {
      value: CONSISTENCY_RULE.GROUP,
      description: 'experiments.upsert-experiment-modal.consistency-rule-group-description.text',
      disabled: false,
    },
  ];

  conditionOrders = [
    {
      value: CONDITION_ORDER.RANDOM,
      description: 'experiments.upsert-experiment-modal.condition-order-random-description.text',
    },
    {
      value: CONDITION_ORDER.RANDOM_ROUND_ROBIN,
      description: 'experiments.upsert-experiment-modal.condition-order-random-round-robin-description.text',
    },
    {
      value: CONDITION_ORDER.ORDERED_ROUND_ROBIN,
      description: 'experiments.upsert-experiment-modal.condition-order-ordered-round-robin-description.text',
    },
  ];

  assignmentAlgorithms = [
    {
      value: ASSIGNMENT_ALGORITHM.RANDOM,
      description: 'experiments.upsert-experiment-modal.assignment-algorithm-random-description.text',
    },
    {
      value: ASSIGNMENT_ALGORITHM.STRATIFIED_RANDOM_SAMPLING,
      description:
        'experiments.upsert-experiment-modal.assignment-algorithm-stratified-random-sampling-description.text',
    },
  ];

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public config: CommonModalConfig<UpsertExperimentParams>,
    public dialog: MatDialog,
    private readonly formBuilder: FormBuilder,
    private readonly experimentService: ExperimentService,
    private readonly stratificationFactorsService: StratificationFactorsService,
    public dialogRef: MatDialogRef<UpsertExperimentModalComponent>,
    @Inject(ENV) private readonly environment: Environment
  ) {
    if (this.environment.withinSubjectExperimentSupportToggle) {
      this.unitOfAssignments.push({
        value: ASSIGNMENT_UNIT.WITHIN_SUBJECTS,
        description: 'Condition will be assigned within subjects (e.g., participant sees multiple conditions).',
      });
    }
    if (this.environment.moocletToggle) {
      const supportedMoocletAlgorithms = SUPPORTED_MOOCLET_ALGORITHMS as ASSIGNMENT_ALGORITHM[];
      supportedMoocletAlgorithms.forEach((algorithmName) => {
        this.assignmentAlgorithms.push({
          value: algorithmName,
          description: `Mooclet algorithm: ${algorithmName}`,
        });
      });
    }
  }

  ngOnInit(): void {
    this.experimentService.fetchContextMetaData();
    this.stratificationFactorsService.fetchStratificationFactors(true);
    this.createExperimentForm();

    // Set up subscriptions
    this.listenForContextMetaData();
    this.listenForStratificationFactors();

    // Disable restricted fields if editing
    if (this.isDisabled()) {
      this.disableRestrictedFields();
    }

    // Add listeners AFTER form is fully set up
    this.listenForIsInitialFormValueChanged();
    this.listenForPrimaryButtonDisabled();
    this.listenOnContext();
    this.listenOnAssignmentAlgorithm();
    this.listenOnUnitOfAssignment();
  }

  isDisabled() {
    return (
      this.config.params.action === UPSERT_EXPERIMENT_ACTION.EDIT &&
      this.config.params.sourceExperiment?.state === EXPERIMENT_STATE.ENROLLING
    );
  }

  disableRestrictedFields(): void {
    this.experimentForm.get('name')?.disable();
    this.experimentForm.get('appContext')?.disable();
    this.experimentForm.get('experimentType')?.disable();
    this.experimentForm.get('unitOfAssignment')?.disable();
    this.experimentForm.get('consistencyRule')?.disable();
    this.experimentForm.get('conditionOrder')?.disable();
    this.experimentForm.get('assignmentAlgorithm')?.disable();
    this.experimentForm.get('groupType')?.disable();
  }

  createExperimentForm(): void {
    const { sourceExperiment, action } = this.config.params;
    const initialValues = this.deriveInitialFormValues(sourceExperiment, action);
    this.initialContext = initialValues.appContext;

    this.experimentForm = this.formBuilder.group({
      name: [initialValues.name, Validators.required],
      description: [initialValues.description],
      appContext: [initialValues.appContext, Validators.required],
      experimentType: [initialValues.experimentType, Validators.required],
      unitOfAssignment: [initialValues.unitOfAssignment, Validators.required],
      consistencyRule: [initialValues.consistencyRule, Validators.required],
      conditionOrder: [initialValues.conditionOrder],
      assignmentAlgorithm: [initialValues.assignmentAlgorithm, Validators.required],
      stratificationFactor: [initialValues.stratificationFactor],
      groupType: [initialValues.groupType],
      tags: [initialValues.tags],
    });

    // Initialize consistency rules state based on initial unit of assignment
    this.initializeConsistencyRules(initialValues.unitOfAssignment);

    this.initialFormValues$.next(this.experimentForm.value);
  }

  initializeConsistencyRules(unitOfAssignment: ASSIGNMENT_UNIT): void {
    // Set initial disabled state for consistency rules based on unit of assignment
    this.consistencyRules = this.consistencyRules.map((rule) => ({
      ...rule,
      disabled: unitOfAssignment === ASSIGNMENT_UNIT.INDIVIDUAL && rule.value === CONSISTENCY_RULE.GROUP,
    }));
  }

  deriveInitialFormValues(sourceExperiment: Experiment, action: string): ExperimentFormData {
    const name = action === UPSERT_EXPERIMENT_ACTION.EDIT ? sourceExperiment?.name : '';
    const description = sourceExperiment?.description || '';
    const appContext = sourceExperiment?.context?.[0] || '';
    const experimentType =
      sourceExperiment?.type === 'Factorial' ? ExperimentDesignTypes.FACTORIAL : ExperimentDesignTypes.SIMPLE;
    const unitOfAssignment = sourceExperiment?.assignmentUnit || ASSIGNMENT_UNIT.INDIVIDUAL;
    const consistencyRule = sourceExperiment?.consistencyRule || CONSISTENCY_RULE.INDIVIDUAL;
    const conditionOrder = sourceExperiment?.conditionOrder || null;
    const assignmentAlgorithm = sourceExperiment?.assignmentAlgorithm || ASSIGNMENT_ALGORITHM.RANDOM;
    const stratificationFactor = sourceExperiment?.stratificationFactor?.stratificationFactorName || null;
    const groupType = sourceExperiment?.group || null;
    const tags = sourceExperiment?.tags || [];

    return {
      name,
      description,
      appContext,
      experimentType,
      unitOfAssignment,
      consistencyRule,
      conditionOrder,
      assignmentAlgorithm,
      stratificationFactor,
      groupType,
      tags,
    };
  }

  listenForContextMetaData(): void {
    this.subscriptions.add(
      this.contextMetaData$.subscribe((contextMetaData: IContextMetaData) => {
        if (contextMetaData?.contextMetadata) {
          this.allContexts = Object.keys(contextMetaData.contextMetadata);

          // Update group types when context metadata changes
          const currentContext = this.experimentForm.get('appContext')?.value;
          if (currentContext) {
            this.currentContext = currentContext;
            this.setGroupTypes(contextMetaData);
          }
        }
      })
    );
  }

  listenOnContext(): void {
    this.subscriptions.add(
      this.experimentForm.get('appContext')?.valueChanges.subscribe((context) => {
        this.isContextChanged = context !== this.initialContext;
        this.currentContext = context;

        // Reset group type when context changes
        this.experimentForm.get('groupType')?.setValue(null);

        // Update group types based on current context metadata
        this.contextMetaData$.pipe(take(1)).subscribe((contextMetaData: IContextMetaData) => {
          if (contextMetaData) {
            this.setGroupTypes(contextMetaData);
          }
        });
      })
    );
  }

  listenForIsInitialFormValueChanged() {
    this.isInitialFormValueChanged$ = this.experimentForm.valueChanges.pipe(
      startWith(this.experimentForm.value),
      map(() => !isEqual(this.experimentForm.value, this.initialFormValues$.value))
    );
    this.subscriptions.add(this.isInitialFormValueChanged$.subscribe());
  }

  listenForPrimaryButtonDisabled() {
    this.isPrimaryButtonDisabled$ = this.isLoadingUpsertExperiment$.pipe(
      combineLatestWith(this.isInitialFormValueChanged$),
      map(([isLoading, isInitialFormValueChanged]) => isLoading || !isInitialFormValueChanged)
    );
    this.subscriptions.add(this.isPrimaryButtonDisabled$.subscribe());
  }

  listenForStratificationFactors(): void {
    this.subscriptions.add(
      this.stratificationFactorsService.allStratificationFactors$.subscribe((stratificationFactors) => {
        this.allStratificationFactors = stratificationFactors.map((factor) => ({
          factorName: factor.factor,
        }));

        // Update the assignment algorithms based on available stratification factors
        this.updateAssignmentAlgorithms();
      })
    );
  }

  listenOnAssignmentAlgorithm(): void {
    this.subscriptions.add(
      this.experimentForm.get('assignmentAlgorithm')?.valueChanges.subscribe((algorithm) => {
        this.validateStratificationFactorSelection(algorithm);
      })
    );
  }

  listenOnUnitOfAssignment(): void {
    this.subscriptions.add(
      this.experimentForm.get('unitOfAssignment')?.valueChanges.subscribe((assignmentUnit) => {
        const groupTypeControl = this.experimentForm.get('groupType');
        const consistencyRuleControl = this.experimentForm.get('consistencyRule');
        const conditionOrderControl = this.experimentForm.get('conditionOrder');

        switch (assignmentUnit) {
          case ASSIGNMENT_UNIT.INDIVIDUAL:
            // Individual assignment: disable group type, enable consistency rule with default, disable condition order
            groupTypeControl?.disable();
            groupTypeControl?.clearValidators();
            groupTypeControl?.setValue(null);

            consistencyRuleControl?.enable();
            consistencyRuleControl?.setValidators([Validators.required]);
            consistencyRuleControl?.setValue(CONSISTENCY_RULE.INDIVIDUAL);

            conditionOrderControl?.disable();
            conditionOrderControl?.clearValidators();
            conditionOrderControl?.setValue(null);

            // Disable Group consistency rule for Individual assignment
            this.consistencyRules = this.consistencyRules.map((rule) => ({
              ...rule,
              disabled: rule.value === CONSISTENCY_RULE.GROUP,
            }));
            break;

          case ASSIGNMENT_UNIT.GROUP:
            // Group assignment: enable group type and consistency rule with default, disable condition order
            groupTypeControl?.enable();
            groupTypeControl?.setValidators([Validators.required]);
            // Note: groupType value will be set when group types are loaded from context metadata

            consistencyRuleControl?.enable();
            consistencyRuleControl?.setValidators([Validators.required]);
            consistencyRuleControl?.setValue(CONSISTENCY_RULE.INDIVIDUAL); // Default to Individual

            conditionOrderControl?.disable();
            conditionOrderControl?.clearValidators();
            conditionOrderControl?.setValue(null);

            // Enable all consistency rules for Group assignment
            this.consistencyRules = this.consistencyRules.map((rule) => ({
              ...rule,
              disabled: false,
            }));

            // Update group types based on current context metadata
            this.contextMetaData$.pipe(take(1)).subscribe((contextMetaData: IContextMetaData) => {
              if (contextMetaData) {
                this.setGroupTypes(contextMetaData);
              }
            });
            break;

          case ASSIGNMENT_UNIT.WITHIN_SUBJECTS:
            // Within subjects: disable group type and consistency rule, enable condition order with default
            groupTypeControl?.disable();
            groupTypeControl?.clearValidators();
            groupTypeControl?.setValue(null);

            consistencyRuleControl?.disable();
            consistencyRuleControl?.clearValidators();
            consistencyRuleControl?.setValue(null);

            conditionOrderControl?.enable();
            conditionOrderControl?.setValidators([Validators.required]);
            conditionOrderControl?.setValue(CONDITION_ORDER.RANDOM); // Default to Random
            break;
        }

        // Update validators for all controls
        groupTypeControl?.updateValueAndValidity();
        consistencyRuleControl?.updateValueAndValidity();
        conditionOrderControl?.updateValueAndValidity();
      })
    );
  }

  updateAssignmentAlgorithms(): void {
    // Disable stratified random sampling if no stratification factors are available
    const stratifiedAlgorithm = this.assignmentAlgorithms.find(
      (alg) => alg.value === ASSIGNMENT_ALGORITHM.STRATIFIED_RANDOM_SAMPLING
    );

    if (stratifiedAlgorithm) {
      (stratifiedAlgorithm as any).disabled = this.allStratificationFactors.length === 0;
    }
  }

  validateStratificationFactorSelection(algorithm: ASSIGNMENT_ALGORITHM): void {
    const stratificationFactorControl = this.experimentForm.get('stratificationFactor');

    if (algorithm === ASSIGNMENT_ALGORITHM.STRATIFIED_RANDOM_SAMPLING) {
      // Add required validator when stratified random sampling is selected
      stratificationFactorControl?.setValidators([Validators.required]);
    } else {
      // Remove validators and reset value when other algorithms are selected
      stratificationFactorControl?.clearValidators();
      stratificationFactorControl?.setValue(null);
    }

    stratificationFactorControl?.updateValueAndValidity();
  }

  get assignmentAlgorithmValue() {
    return this.experimentForm.get('assignmentAlgorithm')?.value;
  }

  get unitOfAssignmentValue() {
    return this.experimentForm.get('unitOfAssignment')?.value;
  }

  setGroupTypes(contextMetaData?: IContextMetaData): void {
    this.groupTypes = [];
    // We'll use the current subscription to get context metadata if not provided
    if (contextMetaData?.contextMetadata?.[this.currentContext]) {
      contextMetaData.contextMetadata[this.currentContext].GROUP_TYPES.forEach((groupType) => {
        this.groupTypes.push({ value: groupType });
      });
    }
  }

  onPrimaryActionBtnClicked() {
    if (this.experimentForm.valid) {
      this.sendRequest(this.config.params.action, this.config.params.sourceExperiment);
    } else {
      // If the form is invalid, manually mark all form controls as touched
      CommonFormHelpersService.triggerTouchedToDisplayErrors(this.experimentForm);
    }
  }

  sendRequest(action: UPSERT_EXPERIMENT_ACTION, sourceExperiment?: Experiment): void {
    const formData: ExperimentFormData = this.experimentForm.value;
    if (action === UPSERT_EXPERIMENT_ACTION.ADD || action === UPSERT_EXPERIMENT_ACTION.DUPLICATE) {
      this.createAddRequest(formData);
    } else if (action === UPSERT_EXPERIMENT_ACTION.EDIT && sourceExperiment) {
      this.createEditRequest(formData, sourceExperiment);
    } else {
      console.error('UpsertExperimentModalComponent: sendRequest: Invalid action or missing sourceExperiment');
    }
  }

  createAddRequest({
    name,
    description,
    appContext,
    experimentType,
    unitOfAssignment,
    consistencyRule,
    conditionOrder,
    assignmentAlgorithm,
    stratificationFactor,
    groupType,
    tags,
  }: ExperimentFormData): void {
    const stratificationFactorObj = stratificationFactor ? { stratificationFactorName: stratificationFactor } : null;

    const experimentRequest: AddExperimentRequest = {
      // Form data
      name,
      description: description || undefined, // @IsOptional - can be undefined
      context: [appContext],
      type: experimentType,
      assignmentUnit: unitOfAssignment,
      consistencyRule: unitOfAssignment !== ASSIGNMENT_UNIT.WITHIN_SUBJECTS ? consistencyRule : undefined, // Conditional validation
      conditionOrder: unitOfAssignment === ASSIGNMENT_UNIT.WITHIN_SUBJECTS ? conditionOrder : undefined, // Conditional validation
      assignmentAlgorithm: assignmentAlgorithm || undefined, // @IsOptional
      stratificationFactor: stratificationFactorObj,
      group: groupType || undefined,
      tags,
      state: EXPERIMENT_STATE.INACTIVE,
      filterMode: FILTER_MODE.EXCLUDE_ALL,

      // Backend required fields with correct defaults
      postExperimentRule: POST_EXPERIMENT_RULE.CONTINUE,
      enrollmentCompleteCondition: undefined, // @IsOptional - can be undefined
      startOn: undefined, // @IsOptional
      endOn: undefined, // @IsOptional
      revertTo: undefined, // @IsOptional
      conditions: [], // @IsNotEmpty @IsArray - must be empty array, not undefined
      partitions: [], // @IsNotEmpty @IsArray - must be empty array, not undefined
      factors: undefined, // @IsOptional @IsArray - can be undefined
      conditionPayloads: undefined, // @IsOptional @IsArray - can be undefined
      queries: undefined, // @IsOptional @IsArray - can be undefined
      experimentSegmentInclusion: undefined, // @IsOptional @IsArray - can be undefined
      experimentSegmentExclusion: undefined, // @IsOptional @IsArray - can be undefined
      stateTimeLogs: undefined, // @IsOptional @IsArray - can be undefined
      backendVersion: undefined, // @IsOptional - can be undefined
      moocletPolicyParameters: undefined, // Conditional validation - can be undefined
      rewardMetricKey: undefined, // Conditional validation - can be undefined
    };

    this.experimentService.createNewExperiment(experimentRequest);
  }

  createEditRequest(
    {
      name,
      description,
      appContext,
      experimentType,
      unitOfAssignment,
      consistencyRule,
      conditionOrder,
      assignmentAlgorithm,
      stratificationFactor,
      groupType,
      tags,
    }: ExperimentFormData,
    sourceExperiment: Experiment
  ): void {
    const stratificationFactorObj = stratificationFactor ? { stratificationFactorName: stratificationFactor } : null;

    const experimentRequest: UpdateExperimentRequest = {
      // Spread existing experiment data first
      ...sourceExperiment,

      // Override with form data
      name,
      description: description || undefined,
      context: [appContext],
      type: experimentType,
      assignmentUnit: unitOfAssignment,
      consistencyRule: unitOfAssignment !== ASSIGNMENT_UNIT.WITHIN_SUBJECTS ? consistencyRule : undefined,
      conditionOrder: unitOfAssignment === ASSIGNMENT_UNIT.WITHIN_SUBJECTS ? conditionOrder : undefined,
      assignmentAlgorithm: assignmentAlgorithm || undefined,
      stratificationFactor: stratificationFactorObj,
      group: groupType || undefined,
      tags,

      // Preserve existing state and structure
      state: sourceExperiment.state,
      filterMode: sourceExperiment.filterMode || FILTER_MODE.EXCLUDE_ALL,

      // Ensure required arrays are maintained from source
      conditions: sourceExperiment.conditions || [],
      partitions: sourceExperiment.partitions || [],

      // Preserve optional arrays from source
      factors: sourceExperiment.factors,
      conditionPayloads: sourceExperiment.conditionPayloads,
      queries: sourceExperiment.queries,
      stateTimeLogs: sourceExperiment.stateTimeLogs,

      // Backend metadata
      backendVersion: sourceExperiment.backendVersion,
      moocletPolicyParameters: sourceExperiment.moocletPolicyParameters,
      rewardMetricKey: sourceExperiment.rewardMetricKey,

      // Required backend fields with defaults if not present
      postExperimentRule: sourceExperiment.postExperimentRule || POST_EXPERIMENT_RULE.CONTINUE,
      enrollmentCompleteCondition: sourceExperiment.enrollmentCompleteCondition,
      startOn: sourceExperiment.startOn,
      endOn: sourceExperiment.endOn,
      revertTo: sourceExperiment.revertTo,
    };

    this.experimentService.updateExperiment(experimentRequest as unknown as ExperimentVM);
  }

  closeModal() {
    this.dialogRef.close();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
