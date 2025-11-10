import { ChangeDetectionStrategy, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TextFieldModule } from '@angular/cdk/text-field';
import { TranslateModule } from '@ngx-translate/core';
import { BehaviorSubject, Observable, Subscription, combineLatestWith, map, startWith } from 'rxjs';
import isEqual from 'lodash.isequal';
import { take } from 'rxjs/operators';

import { CommonModalComponent } from '../../../../../shared-standalone-component-lib/components';
import { ExperimentService } from '../../../../../core/experiments/experiments.service';
import { CommonFormHelpersService } from '../../../../../shared/services/common-form-helpers.service';
import { CommonModalConfig } from '../../../../../shared-standalone-component-lib/components/common-modal/common-modal.types';
import { ExperimentConditionPayload } from '../../../../../core/experiments/store/experiments.model';
import { SharedModule } from '../../../../../shared/shared.module';

export interface EditPayloadModalParams {
  payload: ExperimentConditionPayload;
}

@Component({
  selector: 'edit-payload-modal',
  imports: [
    CommonModalComponent,
    MatFormFieldModule,
    MatInputModule,
    TextFieldModule,
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    SharedModule,
  ],
  templateUrl: './edit-payload-modal.component.html',
  styleUrl: './edit-payload-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditPayloadModalComponent implements OnInit, OnDestroy {
  isLoadingUpdate$ = this.experimentService.isLoadingExperiment$;

  subscriptions = new Subscription();
  isPrimaryButtonDisabled$: Observable<boolean>;
  isInitialFormValueChanged$: Observable<boolean>;
  initialFormValues$ = new BehaviorSubject<{ payloadValue: string }>(null);

  payloadForm: FormGroup;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public config: CommonModalConfig<EditPayloadModalParams>,
    private formBuilder: FormBuilder,
    private experimentService: ExperimentService,
    public dialogRef: MatDialogRef<EditPayloadModalComponent>
  ) {}

  ngOnInit(): void {
    this.createPayloadForm();
    this.listenForIsInitialFormValueChanged();
    this.listenForPrimaryButtonDisabled();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  createPayloadForm(): void {
    const initialValue = this.config.params.payload.payload?.value || '';

    this.payloadForm = this.formBuilder.group({
      payloadValue: [initialValue, [Validators.required]],
    });

    this.initialFormValues$.next(this.payloadForm.value);
  }

  listenForIsInitialFormValueChanged(): void {
    this.isInitialFormValueChanged$ = this.payloadForm.valueChanges.pipe(
      startWith(this.payloadForm.value),
      map(() => !isEqual(this.payloadForm.value, this.initialFormValues$.value))
    );
    this.subscriptions.add(this.isInitialFormValueChanged$.subscribe());
  }

  listenForPrimaryButtonDisabled(): void {
    this.isPrimaryButtonDisabled$ = this.isLoadingUpdate$.pipe(
      combineLatestWith(this.isInitialFormValueChanged$),
      map(([isLoading, isChanged]) => isLoading || this.payloadForm.invalid || !isChanged)
    );
    this.subscriptions.add(this.isPrimaryButtonDisabled$.subscribe());
  }

  onPrimaryActionBtnClicked(): void {
    if (this.payloadForm.valid && !isEqual(this.payloadForm.value, this.initialFormValues$.value)) {
      this.updatePayload();
    } else {
      CommonFormHelpersService.triggerTouchedToDisplayErrors(this.payloadForm);
    }
  }

  updatePayload(): void {
    const { payload } = this.config.params;
    const newPayloadValue = this.payloadForm.value.payloadValue;

    this.experimentService.selectedExperiment$.pipe(take(1)).subscribe((experiment) => {
      if (experiment) {
        const updatedExperiment = {
          ...experiment,
          conditionPayloads: experiment.conditionPayloads.map((existingPayload) => {
            if (existingPayload.id === payload.id) {
              const updatedPayloadValue = { ...existingPayload.payload, value: newPayloadValue };

              return { ...existingPayload, payload: updatedPayloadValue };
            }
            return existingPayload;
          }),
        };

        this.experimentService.updateExperiment(updatedExperiment);
      } else {
        console.error('No experiment data found for updating payload.');
      }

      this.dialogRef.close();
    });
  }
}
