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
import {
  POST_EXPERIMENT_RULE,
  ExperimentCondition,
  PAUSE_BEHAVIOR_MODAL_MODE,
} from '../../../../../core/experiments/store/experiments.model';
import { PAUSE_BEHAVIOR } from 'upgrade_types';

export interface PauseExperimentModalParams {
  mode: PAUSE_BEHAVIOR_MODAL_MODE;
  experimentName?: string;
  conditions: ExperimentCondition[];
  // For update mode
  currentPostExperimentRule?: POST_EXPERIMENT_RULE;
  currentRevertTo?: string;
}

export interface PauseExperimentModalResult {
  postExperimentRule: POST_EXPERIMENT_RULE;
  revertTo: string | null;
}

@Component({
  selector: 'app-pause-experiment-modal',
  imports: [
    CommonModalComponent,
    MatFormFieldModule,
    MatRadioModule,
    MatSelectModule,
    ReactiveFormsModule,
    TranslateModule,
    CommonModule,
  ],
  templateUrl: './pause-experiment-modal.component.html',
  styleUrl: './pause-experiment-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PauseExperimentModalComponent implements OnInit, OnDestroy {
  pauseForm: FormGroup;
  subscriptions = new Subscription();

  // Expose enums to template
  POST_EXPERIMENT_RULE = POST_EXPERIMENT_RULE;
  PAUSE_BEHAVIOR = PAUSE_BEHAVIOR;
  PAUSE_BEHAVIOR_MODAL_MODE = PAUSE_BEHAVIOR_MODAL_MODE;

  // Track if user has selected Assign
  isAssignSelected$ = new BehaviorSubject<boolean>(false);

  // Observable for form validity
  isPrimaryButtonDisabled$: Observable<boolean>;

  // Store initial values to detect changes (for update mode)
  private readonly initialValues?: { pauseBehavior: PAUSE_BEHAVIOR; revertTo: string };

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: CommonModalConfig<PauseExperimentModalParams>,
    private readonly fb: FormBuilder,
    public dialogRef: MatDialogRef<PauseExperimentModalComponent, PauseExperimentModalResult>
  ) {
    const mode = this.data.params?.mode || PAUSE_BEHAVIOR_MODAL_MODE.PAUSE;

    // Determine initial values based on mode
    let initialPauseBehavior: PAUSE_BEHAVIOR;
    let initialRevertTo = '';

    if (mode === PAUSE_BEHAVIOR_MODAL_MODE.UPDATE) {
      // Pre-populate from current values
      const currentRule = this.data.params?.currentPostExperimentRule;
      const currentRevertTo = this.data.params?.currentRevertTo;
      initialPauseBehavior = this.mapToPauseBehavior(currentRule, currentRevertTo);
      initialRevertTo = currentRevertTo || '';

      // Store for change detection
      this.initialValues = {
        pauseBehavior: initialPauseBehavior,
        revertTo: initialRevertTo,
      };
    } else {
      // Default for pause mode
      initialPauseBehavior = PAUSE_BEHAVIOR.KEEP_CONDITIONS;
    }

    this.pauseForm = this.fb.group({
      pauseBehavior: [initialPauseBehavior, Validators.required],
      revertTo: [initialRevertTo], // Condition ID - will add conditional validation
    });

    // Set initial state for isAssignSelected
    this.isAssignSelected$.next(initialPauseBehavior === PAUSE_BEHAVIOR.ASSIGN);
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
    const mode = this.data.params?.mode || PAUSE_BEHAVIOR_MODAL_MODE.PAUSE;

    if (mode === PAUSE_BEHAVIOR_MODAL_MODE.PAUSE) {
      // Simple: disable only when invalid
      this.isPrimaryButtonDisabled$ = this.pauseForm.statusChanges.pipe(
        startWith(this.pauseForm.status),
        map(() => this.pauseForm.invalid)
      );
    } else {
      // Update mode: disable when invalid OR unchanged
      this.isPrimaryButtonDisabled$ = this.pauseForm.valueChanges.pipe(
        startWith(this.pauseForm.value),
        map(() => {
          if (this.pauseForm.invalid) {
            return true;
          }

          // Disable if nothing has changed
          const currentValues = this.pauseForm.value;
          const pauseBehaviorChanged = currentValues.pauseBehavior !== this.initialValues?.pauseBehavior;
          const revertToChanged = currentValues.revertTo !== this.initialValues?.revertTo;

          return !pauseBehaviorChanged && !revertToChanged;
        })
      );
    }
  }

  private mapToPauseBehavior(rule?: POST_EXPERIMENT_RULE, revertTo?: string): PAUSE_BEHAVIOR {
    if (rule === POST_EXPERIMENT_RULE.CONTINUE) {
      return PAUSE_BEHAVIOR.KEEP_CONDITIONS;
    } else if (rule === POST_EXPERIMENT_RULE.ASSIGN && !revertTo) {
      return PAUSE_BEHAVIOR.NO_CONDITION;
    } else {
      return PAUSE_BEHAVIOR.ASSIGN;
    }
  }

  onPrimaryActionBtnClicked(): void {
    if (this.pauseForm.valid) {
      const formValue = this.pauseForm.value;

      // Map PAUSE_BEHAVIOR to POST_EXPERIMENT_RULE and revertTo
      const postExperimentRule =
        formValue.pauseBehavior === PAUSE_BEHAVIOR.KEEP_CONDITIONS
          ? POST_EXPERIMENT_RULE.CONTINUE
          : POST_EXPERIMENT_RULE.ASSIGN;

      const revertTo = formValue.pauseBehavior === PAUSE_BEHAVIOR.ASSIGN ? formValue.revertTo : null;

      const result: PauseExperimentModalResult = {
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
