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
import { PAUSE_BEHAVIOR } from 'upgrade_types';

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

  // Expose enums to template
  POST_EXPERIMENT_RULE = POST_EXPERIMENT_RULE;
  PAUSE_BEHAVIOR = PAUSE_BEHAVIOR;

  // Track if user has selected Assign
  isAssignSelected$ = new BehaviorSubject<boolean>(false);

  // Observable for form validity and changed state
  isPrimaryButtonDisabled$: Observable<boolean>;

  // Store initial values to detect changes
  private readonly initialValues: { pauseBehavior: PAUSE_BEHAVIOR; revertTo: string };

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: CommonModalConfig<UpdatePauseBehaviorModalParams>,
    private readonly fb: FormBuilder,
    public dialogRef: MatDialogRef<UpdatePauseBehaviorModalComponent, UpdatePauseBehaviorModalResult>
  ) {
    // Pre-populate form with current values - convert POST_EXPERIMENT_RULE to PAUSE_BEHAVIOR
    const currentRule = this.data.params?.currentPostExperimentRule || POST_EXPERIMENT_RULE.CONTINUE;
    const currentRevertTo = this.data.params?.currentRevertTo || '';

    // Map POST_EXPERIMENT_RULE + revertTo to PAUSE_BEHAVIOR
    let currentPauseBehavior: PAUSE_BEHAVIOR;
    if (currentRule === POST_EXPERIMENT_RULE.CONTINUE) {
      currentPauseBehavior = PAUSE_BEHAVIOR.KEEP_CONDITIONS;
    } else if (currentRule === POST_EXPERIMENT_RULE.ASSIGN && !currentRevertTo) {
      currentPauseBehavior = PAUSE_BEHAVIOR.NO_CONDITION;
    } else {
      currentPauseBehavior = PAUSE_BEHAVIOR.ASSIGN;
    }

    this.pauseForm = this.fb.group({
      pauseBehavior: [currentPauseBehavior, Validators.required],
      revertTo: [currentRevertTo], // Condition ID - will add conditional validation
    });

    // Store initial values
    this.initialValues = {
      pauseBehavior: currentPauseBehavior,
      revertTo: currentRevertTo,
    };

    // Set initial state for isAssignSelected
    this.isAssignSelected$.next(currentPauseBehavior === PAUSE_BEHAVIOR.ASSIGN);
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
    const pauseBehaviorControl = this.pauseForm.get('pauseBehavior');
    if (!pauseBehaviorControl) return;

    this.subscriptions.add(
      pauseBehaviorControl.valueChanges.subscribe((value) => {
        const revertToControl = this.pauseForm.get('revertTo');
        if (!revertToControl) return;

        if (value === PAUSE_BEHAVIOR.ASSIGN) {
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
        const pauseBehaviorChanged = currentValues.pauseBehavior !== this.initialValues.pauseBehavior;
        const revertToChanged = currentValues.revertTo !== this.initialValues.revertTo;

        return !pauseBehaviorChanged && !revertToChanged;
      })
    );
  }

  onPrimaryActionBtnClicked(): void {
    if (this.pauseForm.valid) {
      const formValue = this.pauseForm.value;

      // Map PAUSE_BEHAVIOR to POST_EXPERIMENT_RULE and revertTo
      const postExperimentRule =
        formValue.pauseBehavior === PAUSE_BEHAVIOR.KEEP_CONDITIONS
          ? POST_EXPERIMENT_RULE.CONTINUE
          : POST_EXPERIMENT_RULE.ASSIGN;

      const revertTo = formValue.pauseBehavior === PAUSE_BEHAVIOR.ASSIGN ? formValue.revertTo : undefined;

      const result: UpdatePauseBehaviorModalResult = {
        postExperimentRule,
        revertTo,
      };

      this.dialogRef.close(result);
    }
  }

  get conditions(): ExperimentCondition[] {
    return this.data.params?.conditions || [];
  }
}
