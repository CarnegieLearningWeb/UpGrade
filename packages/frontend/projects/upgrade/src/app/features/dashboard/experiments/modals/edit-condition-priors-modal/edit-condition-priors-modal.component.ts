import { ChangeDetectionStrategy, Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormArray, FormControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { TranslateModule } from '@ngx-translate/core';
import { Observable, combineLatest, map, startWith } from 'rxjs';
import { CommonModalComponent } from '@shared-component-lib';
import { CommonFormHelpersService } from '../../../../../shared/services/common-form-helpers.service';
import { CommonModalConfig } from '@shared-component-lib/common-modal/common-modal.types';
import { MoocletExperimentHelperService } from '../../../../../core/experiments/mooclet-helper.service';
import { Prior } from 'upgrade_types';
import { SharedModule } from '../../../../../shared/shared.module';

export interface ConditionPriorUpdate {
  conditionCode: string;
  successes: number;
  failures: number;
}

@Component({
  selector: 'app-edit-condition-priors-modal',
  imports: [
    CommonModalComponent,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    SharedModule,
  ],
  templateUrl: './edit-condition-priors-modal.component.html',
  styleUrl: './edit-condition-priors-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditConditionPriorsModalComponent implements OnInit {
  isPrimaryButtonDisabled$: Observable<boolean>;
  priorsForm: FormGroup;
  displayedColumns: string[] = ['condition', 'successes', 'failures'];

  conditions: ConditionPriorUpdate[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public config: CommonModalConfig<{ conditions: ConditionPriorUpdate[] }>,
    public dialogRef: MatDialogRef<EditConditionPriorsModalComponent>,
    private readonly formBuilder: FormBuilder,
    private readonly moocletHelperService: MoocletExperimentHelperService
  ) {}

  ngOnInit(): void {
    this.conditions = this.config.params.conditions;
    this.createPriorsForm();
  }

  createPriorsForm(): void {
    const validators = this.moocletHelperService.getPriorsFieldValidators();

    const conditionsFormArray = this.formBuilder.array(
      this.conditions.map((condition) =>
        this.formBuilder.group({
          conditionCode: [condition.conditionCode],
          successes: [condition.successes, validators.successes],
          failures: [condition.failures, validators.failures],
        })
      )
    );

    this.priorsForm = this.formBuilder.group({ conditions: conditionsFormArray });

    this.isPrimaryButtonDisabled$ = combineLatest([
      this.priorsForm.statusChanges.pipe(startWith(this.priorsForm.status)),
      this.priorsForm.valueChanges.pipe(startWith(this.priorsForm.value)),
    ]).pipe(map(([status]) => status === 'INVALID' || this.priorsForm.pristine));
  }

  get conditionsFormArray(): FormArray {
    return this.priorsForm.get('conditions') as FormArray;
  }

  getSuccessesControl(index: number): FormControl {
    return this.conditionsFormArray.at(index).get('successes') as FormControl;
  }

  getFailuresControl(index: number): FormControl {
    return this.conditionsFormArray.at(index).get('failures') as FormControl;
  }

  onPrimaryActionBtnClicked(): void {
    if (this.priorsForm.valid) {
      const result: Record<string, Prior> = {};
      this.conditionsFormArray.controls.forEach((control) => {
        const conditionCode = control.get('conditionCode')?.value;
        result[conditionCode] = {
          success: control.get('successes')?.value,
          failure: control.get('failures')?.value,
        };
      });
      this.dialogRef.close(result);
    } else {
      CommonFormHelpersService.triggerTouchedToDisplayErrors(this.priorsForm);
    }
  }

  closeModal(): void {
    this.dialogRef.close();
  }
}
