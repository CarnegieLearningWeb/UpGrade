import { ChangeDetectionStrategy, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { TranslateModule } from '@ngx-translate/core';
import { BehaviorSubject, Observable, Subscription, combineLatestWith, map, startWith, take } from 'rxjs';
import isEqual from 'lodash.isequal';

import { CommonModalComponent } from '../../../../../shared-standalone-component-lib/components';
import { ExperimentService } from '../../../../../core/experiments/experiments.service';
import { DecisionPointHelperService } from '../../../../../core/experiments/decision-point-helper.service';
import { CommonFormHelpersService } from '../../../../../shared/services/common-form-helpers.service';
import { CommonModalConfig } from '../../../../../shared-standalone-component-lib/components/common-modal/common-modal.types';
import {
  UPSERT_EXPERIMENT_ACTION,
  UpsertDecisionPointParams,
  DecisionPointFormData,
  IContextMetaData,
  ExperimentDecisionPoint,
  Experiment,
} from '../../../../../core/experiments/store/experiments.model';

@Component({
  selector: 'upsert-decision-point-modal',
  imports: [
    CommonModalComponent,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatAutocompleteModule,
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
  ],
  templateUrl: './upsert-decision-point-modal.component.html',
  styleUrl: './upsert-decision-point-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpsertDecisionPointModalComponent implements OnInit, OnDestroy {
  isLoadingUpsertDecisionPoint$ = this.experimentService.isLoadingExperiment$;
  contextMetaData$ = this.experimentService.contextMetaData$;

  subscriptions = new Subscription();
  isPrimaryButtonDisabled$: Observable<boolean>;
  isInitialFormValueChanged$: Observable<boolean>;

  initialFormValues$ = new BehaviorSubject<DecisionPointFormData>(null);

  // Filtered options for autocomplete
  filteredSites$: Observable<string[]>;
  filteredTargets$: Observable<string[]>;

  decisionPointForm: FormGroup;
  currentContext: string;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public config: CommonModalConfig<UpsertDecisionPointParams>,
    private formBuilder: FormBuilder,
    private experimentService: ExperimentService,
    private decisionPointHelperService: DecisionPointHelperService,
    public dialogRef: MatDialogRef<UpsertDecisionPointModalComponent>
  ) {}

  ngOnInit(): void {
    this.experimentService.fetchContextMetaData();

    if (!this.config.params.context) {
      throw new Error('Context parameter is required for decision point modal');
    }

    this.currentContext = this.config.params.context;
    this.createDecisionPointForm();
    this.setupAutocompleteFilters();

    // Add listeners AFTER form is fully set up
    this.listenForIsInitialFormValueChanged();
    this.listenForPrimaryButtonDisabled();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  createDecisionPointForm(): void {
    const { sourceDecisionPoint, action } = this.config.params;
    const initialValues = this.deriveInitialFormValues(sourceDecisionPoint, action);

    this.decisionPointForm = this.formBuilder.group({
      site: [initialValues.site, [Validators.required]],
      target: [initialValues.target, [Validators.required]],
      excludeIfReached: [initialValues.excludeIfReached],
    });

    this.initialFormValues$.next(this.decisionPointForm.value);
  }

  deriveInitialFormValues(
    sourceDecisionPoint: ExperimentDecisionPoint,
    action: UPSERT_EXPERIMENT_ACTION
  ): DecisionPointFormData {
    const site = action === UPSERT_EXPERIMENT_ACTION.EDIT && sourceDecisionPoint?.site ? sourceDecisionPoint.site : '';
    const target =
      action === UPSERT_EXPERIMENT_ACTION.EDIT && sourceDecisionPoint?.target ? sourceDecisionPoint.target : '';
    const excludeIfReached = sourceDecisionPoint?.excludeIfReached || false;

    return { site, target, excludeIfReached };
  }

  setupAutocompleteFilters(): void {
    this.filteredSites$ = this.contextMetaData$.pipe(
      combineLatestWith(this.decisionPointForm.get('site').valueChanges.pipe(startWith(''))),
      map(([metaData, value]) => this.filterSitesAndTargets(metaData, value || '', 'EXP_POINTS'))
    );

    this.filteredTargets$ = this.contextMetaData$.pipe(
      combineLatestWith(this.decisionPointForm.get('target').valueChanges.pipe(startWith(''))),
      map(([metaData, value]) => this.filterSitesAndTargets(metaData, value || '', 'EXP_IDS'))
    );
  }

  private filterSitesAndTargets(metaData: IContextMetaData, value: string, field: 'EXP_POINTS' | 'EXP_IDS'): string[] {
    const filterValue = value ? value.toLowerCase() : '';

    if (!metaData || !this.currentContext || !metaData.contextMetadata) {
      return [];
    }

    const contextData = metaData.contextMetadata[this.currentContext];
    if (!contextData || !contextData[field]) {
      return [];
    }

    return contextData[field].filter((option) => option.toLowerCase().startsWith(filterValue));
  }

  listenForIsInitialFormValueChanged(): void {
    this.isInitialFormValueChanged$ = this.decisionPointForm.valueChanges.pipe(
      startWith(this.decisionPointForm.value),
      map(() => !isEqual(this.decisionPointForm.value, this.initialFormValues$.value))
    );
    this.subscriptions.add(this.isInitialFormValueChanged$.subscribe());
  }

  listenForPrimaryButtonDisabled(): void {
    this.isPrimaryButtonDisabled$ = this.isLoadingUpsertDecisionPoint$.pipe(
      combineLatestWith(this.isInitialFormValueChanged$),
      map(
        ([isLoading, isInitialFormValueChanged]) =>
          isLoading ||
          this.decisionPointForm.invalid ||
          (!isInitialFormValueChanged && this.config.params.action !== UPSERT_EXPERIMENT_ACTION.ADD)
      )
    );
    this.subscriptions.add(this.isPrimaryButtonDisabled$.subscribe());
  }

  onPrimaryActionBtnClicked(): void {
    if (this.decisionPointForm.valid) {
      this.sendUpsertDecisionPointRequest();
    } else {
      CommonFormHelpersService.triggerTouchedToDisplayErrors(this.decisionPointForm);
    }
  }

  sendUpsertDecisionPointRequest(): void {
    const formData = this.decisionPointForm.value;
    const decisionPointData: DecisionPointFormData = {
      site: formData.site?.trim() || '',
      target: formData.target?.trim() || '',
      excludeIfReached: formData.excludeIfReached,
    };

    // Validate trimmed values are not empty
    if (!decisionPointData.site || !decisionPointData.target) {
      CommonFormHelpersService.triggerTouchedToDisplayErrors(this.decisionPointForm);
      return;
    }

    // Get current experiment and call helper service
    this.experimentService.selectedExperiment$.pipe(take(1)).subscribe((experiment: Experiment) => {
      if (!experiment) {
        console.error('No experiment selected');
        return;
      }

      if (this.config.params.action === UPSERT_EXPERIMENT_ACTION.ADD) {
        this.decisionPointHelperService.addDecisionPoint(experiment, decisionPointData);
      } else {
        const sourceDecisionPoint = this.config.params.sourceDecisionPoint;
        if (!sourceDecisionPoint) {
          console.error('No source decision point for edit action');
          return;
        }

        this.decisionPointHelperService.updateDecisionPoint(experiment, sourceDecisionPoint, decisionPointData);
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
