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
import { BehaviorSubject, Observable, Subscription, combineLatestWith, map, startWith } from 'rxjs';
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
  IContextMetaData,
  ExperimentFormData,
  AddExperimentRequest,
  UpdateExperimentRequest,
} from '../../../../../core/experiments/store/experiments.model';
import { CommonFormHelpersService } from '../../../../../shared/services/common-form-helpers.service';
import {
  ASSIGNMENT_UNIT,
  CONSISTENCY_RULE,
  ASSIGNMENT_ALGORITHM,
  EXPERIMENT_STATE,
  FILTER_MODE,
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

  // Stratification factors
  allStratificationFactors: Array<{ factorName: string }> = [];
  isStratificationFactorSelected = true;
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
    },
    {
      value: CONSISTENCY_RULE.GROUP,
      description: 'experiments.upsert-experiment-modal.consistency-rule-group-description.text',
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
    this.experimentForm.get('assignmentAlgorithm')?.disable();
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
      assignmentAlgorithm: [initialValues.assignmentAlgorithm, Validators.required],
      stratificationFactor: [initialValues.stratificationFactor],
      tags: [initialValues.tags],
    });

    this.initialFormValues$.next(this.experimentForm.value);
  }

  deriveInitialFormValues(sourceExperiment: Experiment, action: string): ExperimentFormData {
    const name = action === UPSERT_EXPERIMENT_ACTION.EDIT ? sourceExperiment?.name : '';
    const description = sourceExperiment?.description || '';
    const appContext = sourceExperiment?.context?.[0] || '';
    const experimentType =
      sourceExperiment?.type === 'Factorial' ? ExperimentDesignTypes.FACTORIAL : ExperimentDesignTypes.SIMPLE;
    const unitOfAssignment = sourceExperiment?.assignmentUnit || ASSIGNMENT_UNIT.INDIVIDUAL;
    const consistencyRule = sourceExperiment?.consistencyRule || CONSISTENCY_RULE.INDIVIDUAL;
    const assignmentAlgorithm = sourceExperiment?.assignmentAlgorithm || ASSIGNMENT_ALGORITHM.RANDOM;
    const stratificationFactor = sourceExperiment?.stratificationFactor?.stratificationFactorName || null;
    const tags = sourceExperiment?.tags || [];

    return {
      name,
      description,
      appContext,
      experimentType,
      unitOfAssignment,
      consistencyRule,
      assignmentAlgorithm,
      stratificationFactor,
      tags,
    };
  }

  listenForContextMetaData(): void {
    this.subscriptions.add(
      this.contextMetaData$.subscribe((contextMetaData: IContextMetaData) => {
        if (contextMetaData?.contextMetadata) {
          this.allContexts = Object.keys(contextMetaData.contextMetadata);
        }
      })
    );
  }

  listenOnContext(): void {
    this.subscriptions.add(
      this.experimentForm.get('appContext')?.valueChanges.subscribe((context) => {
        this.isContextChanged = context !== this.initialContext;
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
    if (algorithm === ASSIGNMENT_ALGORITHM.STRATIFIED_RANDOM_SAMPLING) {
      const stratificationFactorValue = this.experimentForm.get('stratificationFactor')?.value;
      this.isStratificationFactorSelected = !!stratificationFactorValue || this.allStratificationFactors.length === 0;
    } else {
      this.isStratificationFactorSelected = true;
      // Reset stratification factor when not using stratified random sampling
      this.experimentForm.get('stratificationFactor')?.setValue(null);
    }
  }

  get assignmentAlgorithmValue() {
    return this.experimentForm.get('assignmentAlgorithm')?.value;
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
    assignmentAlgorithm,
    stratificationFactor,
    tags,
  }: ExperimentFormData): void {
    const stratificationFactorObj = stratificationFactor ? { stratificationFactorName: stratificationFactor } : null;

    const experimentRequest: AddExperimentRequest = {
      name,
      description,
      context: [appContext],
      type: experimentType,
      assignmentUnit: unitOfAssignment,
      consistencyRule,
      assignmentAlgorithm,
      stratificationFactor: stratificationFactorObj,
      tags,
      state: EXPERIMENT_STATE.INACTIVE,
      filterMode: FILTER_MODE.EXCLUDE_ALL,
    };

    console.log('Create experiment request:', experimentRequest);
    this.dialogRef.close(experimentRequest);
  }

  createEditRequest(
    {
      name,
      description,
      appContext,
      experimentType,
      unitOfAssignment,
      consistencyRule,
      assignmentAlgorithm,
      stratificationFactor,
      tags,
    }: ExperimentFormData,
    sourceExperiment: Experiment
  ): void {
    const stratificationFactorObj = stratificationFactor ? { stratificationFactorName: stratificationFactor } : null;

    const experimentRequest: UpdateExperimentRequest = {
      ...sourceExperiment,
      name,
      description,
      context: [appContext],
      type: experimentType,
      assignmentUnit: unitOfAssignment,
      consistencyRule,
      assignmentAlgorithm,
      stratificationFactor: stratificationFactorObj,
      tags,
      state: sourceExperiment.state,
      filterMode: FILTER_MODE.EXCLUDE_ALL,
    };

    console.log('Update experiment request:', experimentRequest);
    this.dialogRef.close(experimentRequest);
  }

  closeModal() {
    this.dialogRef.close();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
