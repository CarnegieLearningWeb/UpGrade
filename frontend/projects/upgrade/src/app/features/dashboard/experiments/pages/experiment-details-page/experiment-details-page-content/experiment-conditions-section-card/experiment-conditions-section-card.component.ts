import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import {
  CommonSectionCardActionButtonsComponent,
  CommonSectionCardComponent,
  CommonSectionCardTitleHeaderComponent,
} from '../../../../../../../shared-standalone-component-lib/components';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { IMenuButtonItem } from 'upgrade_types';
import { ExperimentConditionsTableComponent } from './experiment-conditions-table/experiment-conditions-table.component';
import { ExperimentService } from '../../../../../../../core/experiments/experiments.service';
import { Observable, take } from 'rxjs';
import {
  Experiment,
  EXPERIMENT_BUTTON_ACTION,
  EXPERIMENT_ROW_ACTION,
  ExperimentCondition,
  ExperimentConditionRowActionEvent,
  ExperimentVM,
} from '../../../../../../../core/experiments/store/experiments.model';
import { UserPermission } from '../../../../../../../core/auth/store/auth.models';
import { AuthService } from '../../../../../../../core/auth/auth.service';
import { DialogService } from '../../../../../../../shared/services/common-dialog.service';
import { ConditionWeightUpdate } from '../../../../modals/edit-condition-weights-modal/edit-condition-weights-modal.component';
import { ConditionHelperService } from '../../../../../../../core/experiments/condition-helper.service';

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

  permissions$: Observable<UserPermission>;
  selectedExperiment$ = this.experimentService.selectedExperiment$;

  constructor(
    private experimentService: ExperimentService,
    private authService: AuthService,
    private dialogService: DialogService,
    private conditionHelperService: ConditionHelperService
  ) {}

  ngOnInit() {
    this.permissions$ = this.authService.userPermissions$;
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
      .openEditConditionWeightsModal(conditions)
      .subscribe((result: ConditionWeightUpdate[] | undefined) => {
        if (result) {
          // Update the experiment with new condition weights
          this.experimentService.updateExperimentConditionWeights(experiment, result);
        }
      });
  }
}
