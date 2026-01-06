import { ChangeDetectionStrategy, Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModalComponent } from '../../../../../shared-standalone-component-lib/components';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { BehaviorSubject, map, Observable, startWith, Subscription } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { CommonModalConfig } from '../../../../../shared-standalone-component-lib/components/common-modal/common-modal.types';
import { POST_EXPERIMENT_RULE, ExperimentCondition } from '../../../../../core/experiments/store/experiments.model';

export interface UpdatePauseBehaviorModalParams {
  currentPostExperimentRule: POST_EXPERIMENT_RULE;
  currentRevertTo?: string;
  conditions: ExperimentCondition[];
}

export interface UpdatePauseBehaviorModalResult {
  postExperimentRule: POST_EXPERIMENT_RULE;
  revertTo?: string;
}

@Component({
  selector: 'app-update-pause-behavior-modal',
  imports: [
    CommonModalComponent,
    MatFormFieldModule,
    MatRadioModule,
    MatSelectModule,
    ReactiveFormsModule,
    TranslateModule,
    CommonModule,
  ],
  templateUrl: './update-pause-behavior-modal.component.html',
  styleUrl: './update-pause-behavior-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpdatePauseBehaviorModalComponent implements OnInit, OnDestroy {
  pauseForm: FormGroup;
  subscriptions = new Subscription();

  // Expose enum to template
  POST_EXPERIMENT_RULE = POST_EXPERIMENT_RULE;

  // Track if user has selected Assign
  isAssignSelected$ = new BehaviorSubject<boolean>(false);

  // Observable for form validity and changed state
  isPrimaryButtonDisabled$: Observable<boolean>;

  // Store initial values to detect changes
  private readonly initialValues: { postExperimentRule: POST_EXPERIMENT_RULE; revertTo: string };

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: CommonModalConfig<UpdatePauseBehaviorModalParams>,
    private readonly fb: FormBuilder,
    public dialogRef: MatDialogRef<UpdatePauseBehaviorModalComponent, UpdatePauseBehaviorModalResult>
  ) {
    // Pre-populate form with current values
    const currentRule = this.data.params?.currentPostExperimentRule || POST_EXPERIMENT_RULE.CONTINUE;
    const currentRevertTo = this.data.params?.currentRevertTo || '';

    this.pauseForm = this.fb.group({
      postExperimentRule: [currentRule, Validators.required],
      revertTo: [currentRevertTo], // Condition ID - will add conditional validation
    });

    // Store initial values
    this.initialValues = {
      postExperimentRule: currentRule,
      revertTo: currentRevertTo,
    };

    // Set initial state for isAssignSelected
    this.isAssignSelected$.next(currentRule === POST_EXPERIMENT_RULE.ASSIGN);
  }

  ngOnInit(): void {
    this.setupConditionalValidation();
    this.setupPrimaryButtonDisabled();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.isAssignSelected$.complete();
  }

  private setupConditionalValidation(): void {
    const postExperimentRuleControl = this.pauseForm.get('postExperimentRule');
    if (!postExperimentRuleControl) return;

    this.subscriptions.add(
      postExperimentRuleControl.valueChanges.subscribe((value) => {
        const revertToControl = this.pauseForm.get('revertTo');
        if (!revertToControl) return;

        if (value === POST_EXPERIMENT_RULE.ASSIGN) {
          this.isAssignSelected$.next(true);
          revertToControl.setValidators([Validators.required]);
        } else {
          this.isAssignSelected$.next(false);
          revertToControl.clearValidators();
          revertToControl.setValue('');
        }

        revertToControl.updateValueAndValidity();
      })
    );
  }

  private setupPrimaryButtonDisabled(): void {
    this.isPrimaryButtonDisabled$ = this.pauseForm.valueChanges.pipe(
      startWith(this.pauseForm.value),
      map(() => {
        // Disable if form is invalid
        if (this.pauseForm.invalid) {
          return true;
        }

        // Disable if nothing has changed
        const currentValues = this.pauseForm.value;
        const postExperimentRuleChanged = currentValues.postExperimentRule !== this.initialValues.postExperimentRule;
        const revertToChanged = currentValues.revertTo !== this.initialValues.revertTo;

        return !postExperimentRuleChanged && !revertToChanged;
      })
    );
  }

  onPrimaryActionBtnClicked(): void {
    if (this.pauseForm.valid) {
      const formValue = this.pauseForm.value;
      const result: UpdatePauseBehaviorModalResult = {
        postExperimentRule: formValue.postExperimentRule,
        revertTo: formValue.postExperimentRule === POST_EXPERIMENT_RULE.ASSIGN ? formValue.revertTo : undefined,
      };

      this.dialogRef.close(result);
    }
  }

  get conditions(): ExperimentCondition[] {
    return this.data.params?.conditions || [];
  }
}
