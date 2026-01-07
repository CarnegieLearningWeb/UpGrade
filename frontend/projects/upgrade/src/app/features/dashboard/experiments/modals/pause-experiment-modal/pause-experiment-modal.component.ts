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

export interface PauseExperimentModalParams {
  experimentName: string;
  conditions: ExperimentCondition[];
}

export interface PauseExperimentModalResult {
  postExperimentRule: POST_EXPERIMENT_RULE;
  revertTo?: string;
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

  // Track if user has selected Assign
  isAssignSelected$ = new BehaviorSubject<boolean>(false);

  // Observable for form validity
  isPrimaryButtonDisabled$: Observable<boolean>;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: CommonModalConfig<PauseExperimentModalParams>,
    private readonly fb: FormBuilder,
    public dialogRef: MatDialogRef<PauseExperimentModalComponent, PauseExperimentModalResult>
  ) {
    this.pauseForm = this.fb.group({
      pauseBehavior: [PAUSE_BEHAVIOR.KEEP_CONDITIONS, Validators.required],
      revertTo: [''], // Condition ID - will add conditional validation
    });
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
    this.isPrimaryButtonDisabled$ = this.pauseForm.statusChanges.pipe(
      startWith(this.pauseForm.status),
      map(() => this.pauseForm.invalid)
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
