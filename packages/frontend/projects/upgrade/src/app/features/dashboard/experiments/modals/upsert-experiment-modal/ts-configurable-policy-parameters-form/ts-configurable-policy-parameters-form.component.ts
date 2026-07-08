import { Component, EventEmitter, inject, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule } from '@ngx-translate/core';
import { BehaviorSubject, map, Observable, of, startWith, Subject, Subscription } from 'rxjs';
import { ThompsonSamplingConfigDTO } from '../../../../../../core/experiments/store/experiments.model';
import {
  EditableThompsonSamplingConfig,
  ThompsonSamplingHelperService,
} from '../../../../../../core/experiments/thompson-sampling-helper.service';
import isEqual from 'lodash.isequal';

@Component({
  selector: 'app-ts-configurable-policy-parameters-form',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, TranslateModule],
  templateUrl: './ts-configurable-policy-parameters-form.component.html',
  styleUrl: './ts-configurable-policy-parameters-form.component.scss',
})
export class TsConfigurablePolicyParametersFormComponent implements OnInit, OnDestroy {
  @Input() existingPolicyParams?: ThompsonSamplingConfigDTO;
  @Input() disabled = false;
  @Output() parametersChange = new EventEmitter<ThompsonSamplingConfigDTO>();
  @Output() validationChange = new EventEmitter<boolean>();
  @Output() formChanged = new EventEmitter<boolean>();

  private readonly formBuilder = inject(FormBuilder);
  private readonly thompsonSamplingHelperService = inject(ThompsonSamplingHelperService);

  policyForm: FormGroup;
  validationErrors$ = new BehaviorSubject<string[]>([]);
  isInitialFormValueChanged$: Observable<boolean>;
  initialFormValue: EditableThompsonSamplingConfig;
  formValueChanges$ = new Subject<EditableThompsonSamplingConfig>();
  subscriptions = new Subscription();

  ngOnInit(): void {
    this.initializeFormValues();
    this.createForm();

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
    this.initialFormValue = this.thompsonSamplingHelperService.deriveEditableParameters(this.existingPolicyParams);
  }

  private createForm(): void {
    const params = this.initialFormValue;
    const validators = this.thompsonSamplingHelperService.getFieldValidators();

    this.policyForm = this.formBuilder.group({
      batchSize: [params.batchSize, validators.batchSize],
      warmupThreshold: [params.warmupThreshold, validators.warmupThreshold],
      minimumDrawDifference: [params.minimumDrawDifference, validators.minimumDrawDifference],
    });
  }

  private setupValidation(): void {
    this.subscriptions.add(
      this.policyForm.statusChanges.subscribe(() => {
        this.emitValidationState();
      })
    );
  }

  private emitValidationState(): void {
    const isValid = this.policyForm.disabled || this.policyForm.valid;
    this.validationChange.emit(isValid);
  }

  private listenToFormChanges(): void {
    this.subscriptions.add(
      this.policyForm.valueChanges.subscribe((formValue: EditableThompsonSamplingConfig) => {
        this.emitFormValueChanges(formValue);
      })
    );

    this.emitFormValueChanges(this.policyForm.value);
    this.emitValidationState();
  }

  private listenForIsInitialFormValueChanged() {
    this.isInitialFormValueChanged$ = this.policyForm.valueChanges.pipe(
      startWith(this.policyForm.value),
      map(() => !isEqual(this.policyForm.value, this.initialFormValue))
    );
    this.subscriptions.add(
      this.isInitialFormValueChanged$.subscribe((hasChanged) => {
        this.formChanged.emit(hasChanged);
      })
    );
  }

  private emitFormValueChanges(formValue: EditableThompsonSamplingConfig): void {
    this.formValueChanges$.next(formValue);
    this.parametersChange.emit(this.thompsonSamplingHelperService.buildConfig(formValue));
  }
}
