import { Component, EventEmitter, inject, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule } from '@ngx-translate/core';
import {
  BehaviorSubject,
  debounceTime,
  from,
  map,
  Observable,
  startWith,
  Subject,
  Subscription,
  switchMap,
} from 'rxjs';
import { ValidationError } from 'class-validator';
import { ASSIGNMENT_ALGORITHM, MoocletTSConfigurablePolicyParametersDTO } from 'upgrade_types';
import { AdaptiveAlgorithmHelperService } from '../../../../../../core/experiments/adaptive-algorithm-helper.service';
import isEqual from 'lodash.isequal';

interface EditableTSConfigurablePolicyParameters {
  batch_size: number;
  uniform_threshold: number;
  tspostdiff_thresh: number;
  prior_success: number;
  prior_failure: number;
}

@Component({
  selector: 'app-ts-configurable-policy-parameters-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, TranslateModule],
  templateUrl: './ts-configurable-policy-parameters-form.component.html',
  styleUrl: './ts-configurable-policy-parameters-form.component.scss',
})
export class TsConfigurablePolicyParametersFormComponent implements OnInit, OnDestroy {
  @Input() existingPolicyParams?: MoocletTSConfigurablePolicyParametersDTO;
  @Input() experimentNameValue?: string;
  @Output() parametersChange = new EventEmitter<MoocletTSConfigurablePolicyParametersDTO>();
  @Output() validationChange = new EventEmitter<boolean>();
  @Output() formChanged = new EventEmitter<boolean>();

  private readonly formBuilder = inject(FormBuilder);
  private readonly adaptiveAlgorithmHelperService = inject(AdaptiveAlgorithmHelperService);

  policyForm: FormGroup;
  validationErrors$ = new BehaviorSubject<ValidationError[]>([]);
  isInitialFormValueChanged$: Observable<boolean>;
  defaultParameters: MoocletTSConfigurablePolicyParametersDTO;
  initialFormValue: EditableTSConfigurablePolicyParameters;
  formValueChanges$ = new Subject<EditableTSConfigurablePolicyParameters>();
  subscriptions = new Subscription();

  ngOnInit(): void {
    this.initializeFormValues();
    this.createForm();
    this.setupValidation();
    this.listenToFormChanges();
    this.listenForIsInitialFormValueChanged();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private initializeFormValues(): void {
    this.defaultParameters = new MoocletTSConfigurablePolicyParametersDTO();

    // when adding a new experiment
    if (!this.existingPolicyParams) {
      this.initialFormValue = {
        batch_size: this.defaultParameters.batch_size,
        uniform_threshold: this.defaultParameters.uniform_threshold,
        tspostdiff_thresh: this.defaultParameters.tspostdiff_thresh,
        prior_success: this.defaultParameters.prior?.success,
        prior_failure: this.defaultParameters.prior?.failure,
      };
    } else {
      // when editing an existing experiment
      this.initialFormValue = {
        batch_size: this.existingPolicyParams.batch_size,
        uniform_threshold: this.existingPolicyParams.uniform_threshold,
        tspostdiff_thresh: this.existingPolicyParams.tspostdiff_thresh,
        prior_success: this.existingPolicyParams.prior?.success,
        prior_failure: this.existingPolicyParams.prior?.failure,
      };
    }
  }

  private createForm(): void {
    const params = this.initialFormValue;

    this.policyForm = this.formBuilder.group({
      batch_size: [params.batch_size, [Validators.required, Validators.min(this.defaultParameters.batch_size)]],
      uniform_threshold: [
        params.uniform_threshold,
        [Validators.required, Validators.min(this.defaultParameters.uniform_threshold)],
      ],
      tspostdiff_thresh: [
        params.tspostdiff_thresh,
        [Validators.required, Validators.min(this.defaultParameters.tspostdiff_thresh)],
      ],
      prior_success: [
        params.prior_success,
        [Validators.required, Validators.min(this.defaultParameters.prior.success)],
      ],
      prior_failure: [
        params.prior_failure,
        [Validators.required, Validators.min(this.defaultParameters.prior.failure)],
      ],
    });
  }

  private setupValidation(): void {
    // Set up validation pipeline with debounce
    this.subscriptions.add(
      this.formValueChanges$
        .pipe(
          debounceTime(300),
          switchMap((formValue) => this.validateParameters(formValue))
        )
        .subscribe((errors) => {
          this.validationErrors$.next(errors);
          this.validationChange.emit(errors.length === 0);
        })
    );
  }

  private listenToFormChanges(): void {
    this.subscriptions.add(
      this.policyForm.valueChanges.subscribe((formValue: EditableTSConfigurablePolicyParameters) => {
        this.emitFormValueChanges(formValue);
      })
    );

    // Trigger initial validation
    this.emitFormValueChanges(this.policyForm.value);
  }

  private listenForIsInitialFormValueChanged() {
    this.isInitialFormValueChanged$ = this.policyForm.valueChanges.pipe(
      startWith(this.policyForm.value),
      map(() => {
        // Compare form values with initial parameters
        const currentValues = this.policyForm.value;
        return !isEqual(currentValues, this.initialFormValue);
      })
    );
    this.subscriptions.add(
      this.isInitialFormValueChanged$.subscribe((hasChanged) => {
        this.formChanged.emit(hasChanged);
      })
    );
  }

  private validateParameters(formValue: EditableTSConfigurablePolicyParameters): Observable<ValidationError[]> {
    const completeParams = this.buildCompletePolicyParametersDTO(formValue);
    return from(this.adaptiveAlgorithmHelperService.validateTSConfigurablePolicyParameters(completeParams));
  }

  private emitFormValueChanges(formValue: EditableTSConfigurablePolicyParameters): void {
    this.formValueChanges$.next(formValue);
    this.parametersChange.emit(this.buildCompletePolicyParametersDTO(formValue));
  }

  private buildCompletePolicyParametersDTO(
    formValue: EditableTSConfigurablePolicyParameters
  ): MoocletTSConfigurablePolicyParametersDTO {
    return {
      // set configurable fields
      batch_size: formValue.batch_size,
      uniform_threshold: formValue.uniform_threshold,
      tspostdiff_thresh: formValue.tspostdiff_thresh,
      prior: {
        success: formValue.prior_success,
        failure: formValue.prior_failure,
      },
      // set non-configurable fields
      assignmentAlgorithm: ASSIGNMENT_ALGORITHM.MOOCLET_TS_CONFIGURABLE,
      outcome_variable_name: this.adaptiveAlgorithmHelperService.generateUniqueOutcomeVariableName(
        this.experimentNameValue
      ),
      max_rating: this.defaultParameters.max_rating,
      min_rating: this.defaultParameters.min_rating,
    } as MoocletTSConfigurablePolicyParametersDTO;
  }
}
