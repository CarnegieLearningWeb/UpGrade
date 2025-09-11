import { ChangeDetectionStrategy, Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormArray,
  FormControl,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { NgIf, CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatTableModule } from '@angular/material/table';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Observable, combineLatest, map, startWith } from 'rxjs';
import { CommonModalComponent } from '../../../../../shared-standalone-component-lib/components';
import { CommonFormHelpersService } from '../../../../../shared/services/common-form-helpers.service';
import { CommonModalConfig } from '../../../../../shared-standalone-component-lib/components/common-modal/common-modal.types';

export interface ConditionWeightUpdate {
  conditionId: string;
  conditionCode: string;
  assignmentWeight: number;
}
@Component({
  selector: 'edit-condition-weights-modal',
  imports: [
    CommonModalComponent,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatRadioModule,
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
  ],
  templateUrl: './edit-condition-weights-modal.component.html',
  styleUrl: './edit-condition-weights-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditConditionWeightsModalComponent implements OnInit {
  isPrimaryButtonDisabled$: Observable<boolean>;
  conditionWeightForm: FormGroup;
  displayedColumns: string[] = ['condition', 'weight'];

  conditions: ConditionWeightUpdate[] = [];
  weightingMethods = [
    {
      value: 'equal',
      name: this.translate.instant('experiments.edit-condition-weights-modal.equal-assignment-weights.label.text'),
      description: this.translate.instant(
        'experiments.edit-condition-weights-modal.equal-assignment-weights.description.text'
      ),
      disabled: false,
    },
    {
      value: 'custom',
      name: this.translate.instant('experiments.edit-condition-weights-modal.custom-percentages.label.text'),
      description: this.translate.instant(
        'experiments.edit-condition-weights-modal.custom-percentages.description.text'
      ),
      disabled: false,
    },
  ];

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public config: CommonModalConfig<{ experimentWeightsArray: ConditionWeightUpdate[] }>,
    public dialog: MatDialog,
    private readonly formBuilder: FormBuilder,
    private translate: TranslateService,
    public dialogRef: MatDialogRef<EditConditionWeightsModalComponent>
  ) {}

  ngOnInit(): void {
    this.createconditionWeightForm();
  }

  createconditionWeightForm(): void {
    const { experimentWeightsArray } = this.config.params;
    this.conditions = experimentWeightsArray;

    // Determine initial weighting method based on existing weights
    const initialWeightingMethod = this.determineInitialWeightingMethod(experimentWeightsArray);

    // Create FormArray for conditions with individual validators
    const conditionsFormArray = this.formBuilder.array(
      experimentWeightsArray.map((condition) =>
        this.formBuilder.group({
          conditionCode: [condition.conditionCode],
          assignmentWeight: [
            condition.assignmentWeight,
            [Validators.required, Validators.min(0), Validators.max(100), this.decimalValidator],
          ],
        })
      ),
      [this.totalWeightValidator] // Array-level validator for sum = 100
    );

    this.conditionWeightForm = this.formBuilder.group({
      weightingMethod: [initialWeightingMethod, Validators.required],
      conditions: conditionsFormArray,
    });

    // Set up form validation with weight sum checking
    this.setupFormValidation();

    // Watch for weighting method changes
    this.watchWeightingMethodChanges();

    // Set initial input state based on the determined method
    if (initialWeightingMethod === 'equal') {
      this.disableWeightInputs();
    } else {
      this.enableWeightInputs();
    }
  }

  private determineInitialWeightingMethod(conditions: ConditionWeightUpdate[]): string {
    if (!conditions || conditions.length === 0) {
      return 'equal';
    }

    if (conditions.length === 1) {
      // Single condition should always be 100%
      return Math.abs(conditions[0].assignmentWeight - 100) < 0.01 ? 'equal' : 'custom';
    }

    const expectedEqualWeight = 100 / conditions.length;

    // Check if all weights are close to the expected equal distribution
    const areWeightsEquallyDistributed = conditions.every(
      (condition) => Math.abs(condition.assignmentWeight - expectedEqualWeight) < 0.01
    );

    // Additional check: ensure total is close to 100%
    const totalWeight = conditions.reduce((sum, condition) => sum + condition.assignmentWeight, 0);
    const isTotalValid = Math.abs(totalWeight - 100) < 0.01;

    // Return 'equal' only if weights are equally distributed AND total is valid
    return areWeightsEquallyDistributed && isTotalValid ? 'equal' : 'custom';
  }

  private setupFormValidation(): void {
    this.isPrimaryButtonDisabled$ = combineLatest([
      this.conditionWeightForm.statusChanges.pipe(startWith(this.conditionWeightForm.status)),
      this.conditionWeightForm.valueChanges.pipe(startWith(this.conditionWeightForm.value)),
    ]).pipe(
      map(([status, value]) => {
        return (
          status === 'INVALID' ||
          this.conditionsFormArray.hasError('totalWeightInvalid') ||
          this.conditionWeightForm.pristine
        );
      })
    );
  }

  private watchWeightingMethodChanges(): void {
    this.conditionWeightForm.get('weightingMethod')?.valueChanges.subscribe((method) => {
      this.conditionWeightForm.markAsDirty();

      if (method === 'equal') {
        this.distributeWeightsEqually();
        this.disableWeightInputs();
      } else if (method === 'custom') {
        this.enableWeightInputs();
      } else if (method === null) {
        this.disableWeightInputs();
      }
    });
  }

  // Custom validator for decimal precision
  decimalValidator(control: AbstractControl): ValidationErrors | null {
    if (control.value == null || control.value === '') {
      return null;
    }

    const value = parseFloat(control.value);
    if (isNaN(value)) {
      return { invalidNumber: true };
    }

    // Allow up to 2 decimal places
    const decimalPlaces = (control.value.toString().split('.')[1] || '').length;
    if (decimalPlaces > 2) {
      return { tooManyDecimals: true };
    }

    return null;
  }

  // Array-level validator for total weight and individual control errors
  totalWeightValidator(formArray: AbstractControl): ValidationErrors | null {
    if (!(formArray instanceof FormArray)) {
      return null;
    }

    const [total, formErrors] = formArray.controls.reduce(
      (acc, control) => {
        const weight = control.get('assignmentWeight')?.value;
        return [acc[0] + (parseFloat(weight) || 0), { ...acc[1], ...control.get('assignmentWeight')?.errors }];
      },
      [0, {}] as [number, ValidationErrors]
    );
    const isValid = Math.abs(total - 100) < 0.01;
    const totalValidation = isValid
      ? {}
      : {
          totalWeightInvalid: {
            actualTotal: Math.round(total * 100) / 100,
            expectedTotal: 100,
          },
        };
    const allErrors = {
      ...formErrors,
      ...totalValidation,
    };
    return Object.keys(allErrors).length === 0 ? null : allErrors;
  }

  get conditionsFormArray(): FormArray {
    return this.conditionWeightForm.get('conditions') as FormArray;
  }

  getWeightControl(index: number): FormControl {
    return this.conditionsFormArray.at(index).get('assignmentWeight') as FormControl;
  }

  getCurrentTotal(): number {
    return this.conditionsFormArray.controls.reduce((sum, control) => {
      const weight = control.get('assignmentWeight')?.value;
      return sum + (parseFloat(weight) || 0);
    }, 0);
  }

  distributeWeightsEqually(): void {
    const equalWeight = Math.round((100 / this.conditions.length) * 100) / 100;
    let remainingWeight = 100;

    this.conditionsFormArray.controls.forEach((control, index) => {
      if (index === this.conditionsFormArray.controls.length - 1) {
        // Last condition gets the remaining weight to ensure total = 100
        control.get('assignmentWeight')?.setValue(Math.round(remainingWeight * 100) / 100);
      } else {
        control.get('assignmentWeight')?.setValue(equalWeight);
        remainingWeight -= equalWeight;
      }
    });
  }

  disableWeightInputs(): void {
    this.conditionsFormArray.controls.forEach((control) => {
      control.get('assignmentWeight')?.disable();
    });
  }

  enableWeightInputs(): void {
    this.conditionsFormArray.controls.forEach((control) => {
      control.get('assignmentWeight')?.enable();
    });
  }

  onWeightChange(): void {
    // Force validation update
    this.conditionsFormArray.updateValueAndValidity();
  }

  // Helper method to get total weight status for display
  getTotalWeightStatus(): ValidationErrors {
    return this.conditionsFormArray.errors as ValidationErrors;
  }

  onPrimaryActionBtnClicked() {
    if (this.conditionWeightForm.valid) {
      const result: ConditionWeightUpdate[] = this.conditionsFormArray.controls.map((control, index) => ({
        conditionId: this.conditions[index].conditionId,
        conditionCode: control.get('conditionCode')?.value,
        assignmentWeight: control.get('assignmentWeight')?.value,
      }));

      // Close dialog and return the result
      this.dialogRef.close(result);
    } else {
      // If the form is invalid, manually mark all form controls as touched
      CommonFormHelpersService.triggerTouchedToDisplayErrors(this.conditionWeightForm);
    }
  }

  closeModal() {
    this.dialogRef.close();
  }
}
