import { Component, EventEmitter, inject, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { BehaviorSubject, debounceTime, from, Observable, Subject, Subscription, switchMap } from 'rxjs';
import { ValidationError } from 'class-validator';
import { MoocletTSConfigurablePolicyParametersDTO } from 'upgrade_types';
import { AdaptiveAlgorithmHelperService } from '../../../../../../core/experiments/adaptive-algorithm-helper.service';

@Component({
  selector: 'app-ts-configurable-policy-parameters-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule],
  templateUrl: './ts-configurable-policy-parameters-form.component.html',
  styleUrl: './ts-configurable-policy-parameters-form.component.scss',
})
export class TsConfigurablePolicyParametersFormComponent implements OnInit, OnDestroy {
  @Input() initialParameters?: MoocletTSConfigurablePolicyParametersDTO;
  @Output() parametersChange = new EventEmitter<MoocletTSConfigurablePolicyParametersDTO>();
  @Output() validationChange = new EventEmitter<boolean>();

  private readonly formBuilder = inject(FormBuilder);
  private readonly adaptiveAlgorithmHelperService = inject(AdaptiveAlgorithmHelperService);

  policyForm: FormGroup;
  validationErrors$ = new BehaviorSubject<ValidationError[]>([]);
  private formValueChanges$ = new Subject<any>();
  private subscriptions = new Subscription();

  // Store non-editable fields
  private outcomeVariableName = '';
  private maxRating = 1;
  private minRating = 0;

  ngOnInit(): void {
    this.initializeFormValues();
    this.createForm();
    this.setupValidation();
    this.listenToFormChanges();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private initializeFormValues(): void {
    if (this.initialParameters) {
      this.outcomeVariableName = this.initialParameters.outcome_variable_name || '';
      this.maxRating = this.initialParameters.max_rating ?? 1;
      this.minRating = this.initialParameters.min_rating ?? 0;
    }
  }

  private createForm(): void {
    const params = this.initialParameters;

    this.policyForm = this.formBuilder.group({
      batch_size: [params?.batch_size ?? 1, [Validators.required, Validators.min(1)]],
      uniform_threshold: [params?.uniform_threshold ?? 0, [Validators.required, Validators.min(0)]],
      tspostdiff_thresh: [params?.tspostdiff_thresh ?? 0, [Validators.required, Validators.min(0)]],
      prior_success: [params?.prior?.success ?? 1, [Validators.required, Validators.min(0)]],
      prior_failure: [params?.prior?.failure ?? 1, [Validators.required, Validators.min(0)]],
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
      this.policyForm.valueChanges.subscribe((value) => {
        this.formValueChanges$.next(value);
        this.parametersChange.emit(this.getValue());
      })
    );

    // Trigger initial validation
    this.formValueChanges$.next(this.policyForm.value);
  }

  private validateParameters(formValue: any): Observable<ValidationError[]> {
    const completeParams = this.buildCompleteParameters(formValue);
    return from(this.adaptiveAlgorithmHelperService.validateTSConfigurablePolicyParameters(completeParams));
  }

  private buildCompleteParameters(formValue: any): MoocletTSConfigurablePolicyParametersDTO {
    return {
      outcome_variable_name: this.outcomeVariableName,
      batch_size: formValue.batch_size,
      max_rating: this.maxRating,
      min_rating: this.minRating,
      uniform_threshold: formValue.uniform_threshold,
      tspostdiff_thresh: formValue.tspostdiff_thresh,
      prior: {
        success: formValue.prior_success,
        failure: formValue.prior_failure,
      },
    } as MoocletTSConfigurablePolicyParametersDTO;
  }

  // Public API methods for parent component access

  getValue(): MoocletTSConfigurablePolicyParametersDTO {
    return this.buildCompleteParameters(this.policyForm.value);
  }

  getErrors(): ValidationError[] {
    return this.validationErrors$.value;
  }

  isValid(): boolean {
    return this.policyForm.valid && this.validationErrors$.value.length === 0;
  }

  reset(): void {
    if (this.initialParameters) {
      this.policyForm.patchValue({
        batch_size: this.initialParameters.batch_size ?? 1,
        uniform_threshold: this.initialParameters.uniform_threshold ?? 0,
        tspostdiff_thresh: this.initialParameters.tspostdiff_thresh ?? 0,
        prior_success: this.initialParameters.prior?.success ?? 1,
        prior_failure: this.initialParameters.prior?.failure ?? 1,
      });
    }
  }

  patchValue(params: MoocletTSConfigurablePolicyParametersDTO): void {
    this.outcomeVariableName = params.outcome_variable_name || '';
    this.maxRating = params.max_rating ?? 1;
    this.minRating = params.min_rating ?? 0;

    this.policyForm.patchValue({
      batch_size: params.batch_size ?? 1,
      uniform_threshold: params.uniform_threshold ?? 0,
      tspostdiff_thresh: params.tspostdiff_thresh ?? 0,
      prior_success: params.prior?.success ?? 1,
      prior_failure: params.prior?.failure ?? 1,
    });
  }
}
