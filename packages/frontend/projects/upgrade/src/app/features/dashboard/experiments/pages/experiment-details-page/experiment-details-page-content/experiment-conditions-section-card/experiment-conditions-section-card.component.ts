import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import {
  CommonSectionCardActionButtonsComponent,
  CommonSectionCardComponent,
  CommonSectionCardTitleHeaderComponent,
} from '@shared-component-lib';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ExperimentConditionsTableComponent } from './experiment-conditions-table/experiment-conditions-table.component';
import { ExperimentService } from '../../../../../../../core/experiments/experiments.service';
import { Observable, combineLatest, map, take } from 'rxjs';
import {
  Experiment,
  EXPERIMENT_ROW_ACTION,
  ExperimentCondition,
  ExperimentConditionRowActionEvent,
  ExperimentVM,
  EXPERIMENT_SECTION_CARD_TYPE,
  SectionCardRestriction,
} from '../../../../../../../core/experiments/store/experiments.model';
import { UserPermission } from '../../../../../../../core/auth/store/auth.models';
import { AuthService } from '../../../../../../../core/auth/auth.service';
import { DialogService } from '../../../../../../../shared/services/common-dialog.service';
import { ConditionWeightUpdate } from '../../../../modals/edit-condition-weights-modal/edit-condition-weights-modal.component';
import { Prior } from 'upgrade_types';
import { ConditionHelperService } from '../../../../../../../core/experiments/condition-helper.service';
import { selectConditionWeightsValid } from '../../../../../../../core/experiments/store/experiments.selectors';
import { Store } from '@ngrx/store';
import { MoocletExperimentHelperService } from '../../../../../../../core/experiments/mooclet-helper.service';

@Component({
  selector: 'app-experiment-conditions-section-card',
  imports: [
    CommonModule,
    CommonSectionCardComponent,
    CommonSectionCardTitleHeaderComponent,
    CommonSectionCardActionButtonsComponent,
    ExperimentConditionsTableComponent,
    TranslateModule,
  ],
  templateUrl: './experiment-conditions-section-card.component.html',
  styleUrl: './experiment-conditions-section-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperimentConditionsSectionCardComponent implements OnInit {
  @Input() isSectionCardExpanded = true;

  selectedExperiment$ = this.experimentService.selectedExperiment$;
  conditionWeightsValid$ = this.store.select(selectConditionWeightsValid);
  isLoadingExperiment$ = this.experimentService.isLoadingExperiment$;
  weightWarningText$ = combineLatest([this.conditionWeightsValid$, this.isLoadingExperiment$]).pipe(
    map(([valid, isLoading]) =>
      !valid && !isLoading ? ['experiments.edit-condition-weights-modal.weights-sum-validation.text'] : []
    )
  );

  vm$: Observable<{ experiment: Experiment; permissions: UserPermission; restriction: SectionCardRestriction }>;

  constructor(
    readonly experimentService: ExperimentService,
    private readonly authService: AuthService,
    private readonly dialogService: DialogService,
    private readonly conditionHelperService: ConditionHelperService,
    private readonly store: Store,
    private readonly moocletHelperService: MoocletExperimentHelperService
  ) {}

  ngOnInit() {
    this.vm$ = combineLatest([
      this.selectedExperiment$,
      this.authService.userPermissions$,
      this.experimentService.sectionCardRestriction$(EXPERIMENT_SECTION_CARD_TYPE.CONDITIONS),
    ]).pipe(
      map(([experiment, permissions, restriction]) => ({
        experiment,
        permissions,
        restriction,
      }))
    );
  }

  isMoocletExperiment(experiment: Experiment) {
    return this.moocletHelperService.isMoocletAlgorithm(experiment?.assignmentAlgorithm);
  }

  onAddConditionClick(appContext: string, experimentId: string): void {
    this.dialogService.openAddConditionModal(experimentId, appContext);
  }

  onSectionCardExpandChange(isSectionCardExpanded: boolean): void {
    this.isSectionCardExpanded = isSectionCardExpanded;
  }

  // Condition row action events
  onRowAction(event: ExperimentConditionRowActionEvent, experimentId: string, context: string): void {
    switch (event.action) {
      case EXPERIMENT_ROW_ACTION.EDIT:
        this.onEditCondition(event.condition, experimentId, context);
        break;
      case EXPERIMENT_ROW_ACTION.DELETE:
        this.onDeleteCondition(event.condition);
        break;
      default:
        console.log('Unknown action:', event.action);
    }
  }

  onEditCondition(condition: ExperimentCondition, experimentId: string, context: string): void {
    this.dialogService.openEditConditionModal(condition, experimentId, context);
  }

  onDeleteCondition(condition: ExperimentCondition): void {
    this.dialogService
      .openDeleteConditionModal(condition.conditionCode)
      .afterClosed()
      .subscribe((confirmClicked) => {
        if (confirmClicked) {
          this.selectedExperiment$.pipe(take(1)).subscribe((experiment: Experiment) => {
            if (experiment) {
              this.conditionHelperService.deleteCondition(experiment, condition);
            }
          });
        }
      });
  }

  onEditWeights(conditions: ExperimentCondition[], experiment: ExperimentVM): void {
    this.dialogService
      .openEditConditionWeightsModal(conditions, experiment.weightingMethod)
      .subscribe((result: ConditionWeightUpdate[] | undefined) => {
        if (result) {
          this.experimentService.updateExperimentConditionWeights(experiment, result);
        }
      });
  }

  onEditPriors(conditions: ExperimentCondition[], experiment: ExperimentVM): void {
    const existingPriors = experiment.moocletPolicyParameters?.priors;
    this.dialogService
      .openEditConditionPriorsModal(conditions, existingPriors)
      .subscribe((result: Record<string, Prior> | undefined) => {
        if (result) {
          this.experimentService.updateExperimentConditionPriors(experiment, result);
        }
      });
  }
}
