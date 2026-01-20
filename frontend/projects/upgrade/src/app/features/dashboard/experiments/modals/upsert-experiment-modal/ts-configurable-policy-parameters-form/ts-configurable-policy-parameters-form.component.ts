import { Component, EventEmitter, inject, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
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
import { MoocletTSConfigurablePolicyParametersDTO } from 'upgrade_types';
import {
  EditableTSConfigurablePolicyParameters,
  MoocletExperimentHelperService,
} from '../../../../../../core/experiments/mooclet-helper.service';
import isEqual from 'lodash.isequal';

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
  @Input() disabled = false; // Disable all form fields when true
  @Output() parametersChange = new EventEmitter<MoocletTSConfigurablePolicyParametersDTO>();
  @Output() validationChange = new EventEmitter<boolean>();
  @Output() formChanged = new EventEmitter<boolean>();

  private readonly formBuilder = inject(FormBuilder);
  private readonly moocletExperimentHelperService = inject(MoocletExperimentHelperService);

  policyForm: FormGroup;
  validationErrors$ = new BehaviorSubject<ValidationError[]>([]);
  isInitialFormValueChanged$: Observable<boolean>;
  initialFormValue: EditableTSConfigurablePolicyParameters;
  formValueChanges$ = new Subject<EditableTSConfigurablePolicyParameters>();
  subscriptions = new Subscription();

  ngOnInit(): void {
    this.initializeFormValues();
    this.createForm();

    // Disable form if disabled input is true
    if (this.disabled) {
      this.policyForm.disable();
    }

    this.setupValidation();
    this.listenToFormChanges();
    this.listenForIsInitialFormValueChanged();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private initializeFormValues(): void {
    // Delegate to service to derive initial form values from existing or default parameters
    this.initialFormValue = this.moocletExperimentHelperService.deriveEditableParametersForTSConfigurable(
      this.existingPolicyParams
    );
  }

  private createForm(): void {
    const params = this.initialFormValue;
    const validators = this.moocletExperimentHelperService.getTSConfigurableFieldValidators();

    this.policyForm = this.formBuilder.group({
      batch_size: [params.batch_size, validators.batch_size],
      uniform_threshold: [params.uniform_threshold, validators.uniform_threshold],
      tspostdiff_thresh: [params.tspostdiff_thresh, validators.tspostdiff_thresh],
      prior_success: [params.prior_success, validators.prior_success],
      prior_failure: [params.prior_failure, validators.prior_failure],
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
          this.emitValidationState(errors);
        })
    );

    // Emit validation state immediately when Angular form validity changes
    this.subscriptions.add(
      this.policyForm.statusChanges.subscribe(() => {
        this.emitValidationState(this.validationErrors$.value);
      })
    );
  }

  private emitValidationState(backendErrors: ValidationError[]): void {
    // Treat disabled form as valid; otherwise require Angular + backend validation to pass
    const formDisabled = this.policyForm.disabled;
    const isValid = formDisabled || (this.policyForm.valid && backendErrors.length === 0);
    this.validationChange.emit(isValid);
  }

  private listenToFormChanges(): void {
    this.subscriptions.add(
      this.policyForm.valueChanges.subscribe((formValue: EditableTSConfigurablePolicyParameters) => {
        this.emitFormValueChanges(formValue);
      })
    );

    // Trigger initial validation and emit initial form state
    this.emitFormValueChanges(this.policyForm.value);
    // Emit initial validation state considering Angular form validity
    this.emitValidationState(this.validationErrors$.value);
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
    return from(this.moocletExperimentHelperService.validateTSConfigurablePolicyParameters(completeParams));
  }

  private emitFormValueChanges(formValue: EditableTSConfigurablePolicyParameters): void {
    this.formValueChanges$.next(formValue);
    this.parametersChange.emit(this.buildCompletePolicyParametersDTO(formValue));
  }

  private buildCompletePolicyParametersDTO(
    formValue: EditableTSConfigurablePolicyParameters
  ): MoocletTSConfigurablePolicyParametersDTO {
    // Delegate DTO assembly to service
    return this.moocletExperimentHelperService.buildTSConfigurablePolicyParametersDTO(
      formValue,
      this.experimentNameValue
    );
  }
}
