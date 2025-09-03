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
import { v4 as uuidv4 } from 'uuid';

import { CommonModalComponent } from '../../../../../shared-standalone-component-lib/components';
import { ExperimentService } from '../../../../../core/experiments/experiments.service';
import { CommonFormHelpersService } from '../../../../../shared/services/common-form-helpers.service';
import { CommonModalConfig } from '../../../../../shared-standalone-component-lib/components/common-modal/common-modal.types';
import {
  UPSERT_EXPERIMENT_ACTION,
  UpsertDecisionPointParams,
  DecisionPointFormData,
  IContextMetaData,
  ExperimentDecisionPoint,
  UpdateExperimentDecisionPointsRequest,
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
    public dialogRef: MatDialogRef<UpsertDecisionPointModalComponent>
  ) {}

  ngOnInit(): void {
    this.experimentService.fetchContextMetaData();
    this.currentContext = this.config.params.context || '';
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
    const site = action === UPSERT_EXPERIMENT_ACTION.EDIT ? sourceDecisionPoint?.site || '' : '';
    const target = action === UPSERT_EXPERIMENT_ACTION.EDIT ? sourceDecisionPoint?.target || '' : '';
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
    const decisionPointRequest = {
      site: formData.site?.trim() || '',
      target: formData.target?.trim() || '',
      excludeIfReached: formData.excludeIfReached,
      experimentId: this.config.params.experimentId,
    };

    // Validate trimmed values are not empty
    if (!decisionPointRequest.site || !decisionPointRequest.target) {
      CommonFormHelpersService.triggerTouchedToDisplayErrors(this.decisionPointForm);
      return;
    }

    // Get the current experiment to update its decision points
    this.experimentService.selectedExperiment$.pipe(take(1)).subscribe((experiment: Experiment) => {
      if (!experiment) {
        console.error('No experiment selected');
        return;
      }

      const currentDecisionPoints = [...(experiment.partitions || [])];
      let updatedDecisionPoints: ExperimentDecisionPoint[];

      if (this.config.params.action === UPSERT_EXPERIMENT_ACTION.ADD) {
        // Add new decision point
        const newDecisionPoint = {
          id: uuidv4(),
          site: decisionPointRequest.site,
          target: decisionPointRequest.target,
          description: '',
          order: currentDecisionPoints.length + 1,
          excludeIfReached: decisionPointRequest.excludeIfReached,
        };
        updatedDecisionPoints = [...currentDecisionPoints, newDecisionPoint] as ExperimentDecisionPoint[];
      } else {
        // Edit existing decision point
        const sourceDecisionPoint = this.config.params.sourceDecisionPoint;
        if (!sourceDecisionPoint) {
          console.error('No source decision point for edit action');
          return;
        }

        updatedDecisionPoints = currentDecisionPoints.map((dp) =>
          dp.id === sourceDecisionPoint.id
            ? {
                ...dp,
                site: decisionPointRequest.site,
                target: decisionPointRequest.target,
                excludeIfReached: decisionPointRequest.excludeIfReached,
              }
            : dp
        );
      }

      // Create the update request
      const updateRequest: UpdateExperimentDecisionPointsRequest = {
        experiment,
        decisionPoints: updatedDecisionPoints,
      };

      // Dispatch the update action
      this.experimentService.updateExperimentDecisionPoints(updateRequest);

      // Close the modal
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
