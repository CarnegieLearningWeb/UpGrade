import { ChangeDetectionStrategy, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  ValidatorFn,
  AbstractControl,
  ValidationErrors,
  AsyncValidatorFn,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { TranslateModule } from '@ngx-translate/core';
import { BehaviorSubject, Observable, Subscription, combineLatestWith, map, of, startWith, take } from 'rxjs';
import isEqual from 'lodash.isequal';

import { CommonModalComponent } from '../../../../../shared-standalone-component-lib/components';
import { ExperimentService } from '../../../../../core/experiments/experiments.service';
import { ConditionHelperService } from '../../../../../core/experiments/condition-helper.service';
import { CommonFormHelpersService } from '../../../../../shared/services/common-form-helpers.service';
import { CommonModalConfig } from '../../../../../shared-standalone-component-lib/components/common-modal/common-modal.types';
import {
  UPSERT_EXPERIMENT_ACTION,
  UpsertConditionParams,
  ConditionFormData,
  IContextMetaData,
  ExperimentCondition,
  Experiment,
} from '../../../../../core/experiments/store/experiments.model';

@Component({
  selector: 'upsert-condition-modal',
  imports: [
    CommonModalComponent,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
  ],
  templateUrl: './upsert-condition-modal.component.html',
  styleUrl: './upsert-condition-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpsertConditionModalComponent implements OnInit, OnDestroy {
  isLoadingUpsertCondition$ = this.experimentService.isLoadingExperiment$;
  contextMetaData$ = this.experimentService.contextMetaData$;

  subscriptions = new Subscription();
  isPrimaryButtonDisabled$: Observable<boolean>;
  isInitialFormValueChanged$: Observable<boolean>;

  initialFormValues$ = new BehaviorSubject<ConditionFormData>(null);

  // Filtered options for autocomplete
  filteredConditions$: Observable<string[]>;

  conditionForm: FormGroup;
  currentContext: string;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public config: CommonModalConfig<UpsertConditionParams>,
    private formBuilder: FormBuilder,
    private experimentService: ExperimentService,
    private conditionHelperService: ConditionHelperService,
    public dialogRef: MatDialogRef<UpsertConditionModalComponent>
  ) {}

  ngOnInit(): void {
    this.experimentService.fetchContextMetaData();

    if (!this.config.params.context) {
      throw new Error('Context parameter is required for condition modal');
    }

    this.currentContext = this.config.params.context;
    this.createConditionForm();
    this.setupAutocompleteFilters();

    // Add listeners AFTER form is fully set up
    this.listenForIsInitialFormValueChanged();
    this.listenForPrimaryButtonDisabled();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  createConditionForm(): void {
    const { sourceCondition, action } = this.config.params;
    const initialValues = this.deriveInitialFormValues(sourceCondition, action);
    this.conditionForm = this.formBuilder.group({
      condition: [
        initialValues.conditionCode,
        [Validators.required],
        [this.duplicateConditionValidator(sourceCondition)],
      ],
      description: [initialValues.description],
    });
    this.initialFormValues$.next(this.conditionForm.value);
  }

  deriveInitialFormValues(
    sourceCondition: ExperimentCondition | null,
    action: UPSERT_EXPERIMENT_ACTION
  ): ConditionFormData {
    const conditionCode =
      action === UPSERT_EXPERIMENT_ACTION.EDIT && sourceCondition?.conditionCode ? sourceCondition.conditionCode : '';
    const description =
      action === UPSERT_EXPERIMENT_ACTION.EDIT && sourceCondition?.description ? sourceCondition.description : '';

    return { conditionCode, description };
  }

  setupAutocompleteFilters(): void {
    this.filteredConditions$ = this.contextMetaData$.pipe(
      combineLatestWith(this.conditionForm.get('condition').valueChanges.pipe(startWith(''))),
      map(([metaData, value]) => this.filterConditions(metaData, value || ''))
    );
  }

  private filterConditions(metaData: IContextMetaData, value: string): string[] {
    const filterValue = value ? value.toLowerCase() : '';

    if (!metaData || !this.currentContext || !metaData.contextMetadata) {
      return [];
    }

    const contextData = metaData.contextMetadata[this.currentContext];
    if (!contextData || !contextData['CONDITIONS']) {
      return [];
    }

    return contextData['CONDITIONS'].filter((option) => option.toLowerCase().startsWith(filterValue));
  }

  listenForIsInitialFormValueChanged(): void {
    this.isInitialFormValueChanged$ = this.conditionForm.valueChanges.pipe(
      startWith(this.conditionForm.value),
      map(() => !isEqual(this.conditionForm.value, this.initialFormValues$.value))
    );
    this.subscriptions.add(this.isInitialFormValueChanged$.subscribe());
  }

  listenForPrimaryButtonDisabled(): void {
    this.isPrimaryButtonDisabled$ = this.isLoadingUpsertCondition$.pipe(
      combineLatestWith(this.isInitialFormValueChanged$),
      map(
        ([isLoading, isInitialFormValueChanged]) =>
          isLoading ||
          this.conditionForm.invalid ||
          (!isInitialFormValueChanged && this.config.params.action !== UPSERT_EXPERIMENT_ACTION.ADD)
      )
    );
    this.subscriptions.add(this.isPrimaryButtonDisabled$.subscribe());
  }

  onPrimaryActionBtnClicked(): void {
    if (this.conditionForm.valid) {
      this.sendUpsertConditionRequest();
    } else {
      CommonFormHelpersService.triggerTouchedToDisplayErrors(this.conditionForm);
    }
  }

  forbiddenNameValidator(nameRe: RegExp): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const forbidden = nameRe.test(control.value);
      return forbidden ? { forbiddenName: { value: control.value } } : null;
    };
  }

  duplicateConditionValidator(sourceCondition?: ExperimentCondition): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value) {
        return of(null);
      }

      return this.experimentService.selectedExperiment$.pipe(
        take(1),
        map((experiment: Experiment) => {
          if (!experiment) {
            console.error('Unable to validate condition: experiment data not loaded');
            return null;
          }

          // Get conditions excluding the one being edited
          const otherConditions = experiment.conditions
            .filter((condition) => !sourceCondition || condition.id !== sourceCondition.id)
            .map((condition) => condition.conditionCode);

          const isDuplicate = otherConditions.includes(control.value);
          if (isDuplicate) {
            console.error('Condition code must be unique within the experiment');
            return { duplicateCondition: { value: control.value } };
          }
          return null;
        })
      );
    };
  }
  sendUpsertConditionRequest(): void {
    const formData = this.conditionForm.value;
    const conditionData: ConditionFormData = {
      conditionCode: formData.condition?.trim() || '',
      description: formData.description?.trim() || '',
    };

    // Validate trimmed values are not empty
    if (!conditionData.conditionCode) {
      CommonFormHelpersService.triggerTouchedToDisplayErrors(this.conditionForm);
      return;
    }
    // Get current experiment and call helper service
    this.experimentService.selectedExperiment$.pipe(take(1)).subscribe((experiment: Experiment) => {
      const sourceCondition = this.config.params.sourceCondition;

      if (!experiment) {
        console.error('Cannot save condition: experiment not found or not selected');
        return;
      }

      if (this.config.params.action === UPSERT_EXPERIMENT_ACTION.ADD) {
        this.conditionHelperService.addCondition(experiment, conditionData);
      } else {
        if (!sourceCondition) {
          console.error('Cannot update condition: source condition data is missing');
          return;
        }
        this.conditionHelperService.updateCondition(experiment, sourceCondition, conditionData);
      }

      this.closeModal();
    });
  }

  get UPSERT_EXPERIMENT_ACTION() {
    return UPSERT_EXPERIMENT_ACTION;
  }

  closeModal(): void {
    this.dialogRef.close();
  }
}
