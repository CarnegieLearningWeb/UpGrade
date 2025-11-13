import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import {
  CommonSectionCardActionButtonsComponent,
  CommonSectionCardComponent,
  CommonSectionCardTitleHeaderComponent,
} from '../../../../../../../shared-standalone-component-lib/components';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { IMenuButtonItem } from 'upgrade_types';
import { ExperimentDecisionPointsTableComponent } from './experiment-decision-points-table/experiment-decision-points-table.component';
import { ExperimentService } from '../../../../../../../core/experiments/experiments.service';
import { DecisionPointHelperService } from '../../../../../../../core/experiments/decision-point-helper.service';
import { Observable, take } from 'rxjs';
import {
  EXPERIMENT_BUTTON_ACTION,
  EXPERIMENT_ROW_ACTION,
  ExperimentDecisionPoint,
  ExperimentDecisionPointRowActionEvent,
  Experiment,
} from '../../../../../../../core/experiments/store/experiments.model';
import { UserPermission } from '../../../../../../../core/auth/store/auth.models';
import { AuthService } from '../../../../../../../core/auth/auth.service';
import { DialogService } from '../../../../../../../shared/services/common-dialog.service';

@Component({
  selector: 'app-experiment-decision-points-section-card',
  imports: [
    CommonModule,
    CommonSectionCardComponent,
    CommonSectionCardTitleHeaderComponent,
    CommonSectionCardActionButtonsComponent,
    ExperimentDecisionPointsTableComponent,
    TranslateModule,
  ],
  templateUrl: './experiment-decision-points-section-card.component.html',
  styleUrl: './experiment-decision-points-section-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperimentDecisionPointsSectionCardComponent implements OnInit {
  @Input() isSectionCardExpanded = true;

  permissions$: Observable<UserPermission>;
  selectedExperiment$ = this.experimentService.selectedExperiment$;

  constructor(
    public experimentService: ExperimentService,
    private authService: AuthService,
    private dialogService: DialogService,
    private decisionPointHelperService: DecisionPointHelperService
  ) {}

  ngOnInit() {
    this.permissions$ = this.authService.userPermissions$;
  }

  onAddDecisionPointClick(experimentId: string, appContext: string): void {
    this.dialogService.openAddDecisionPointModal(experimentId, appContext);
  }

  onSectionCardExpandChange(isSectionCardExpanded: boolean): void {
    this.isSectionCardExpanded = isSectionCardExpanded;
  }

  // Decision point row action events
  onRowAction(event: ExperimentDecisionPointRowActionEvent, experimentId: string, context: string): void {
    switch (event.action) {
      case EXPERIMENT_ROW_ACTION.EDIT:
        this.onEditDecisionPoint(event.decisionPoint, experimentId, context);
        break;
      case EXPERIMENT_ROW_ACTION.DELETE:
        this.onDeleteDecisionPoint(event.decisionPoint);
        break;
      default:
        console.log('Unknown action:', event.action);
    }
  }

  onEditDecisionPoint(decisionPoint: ExperimentDecisionPoint, experimentId: string, context: string): void {
    this.dialogService.openEditDecisionPointModal(decisionPoint, experimentId, context);
  }

  onDeleteDecisionPoint(decisionPoint: ExperimentDecisionPoint): void {
    const decisionPointDisplayName = `${decisionPoint.site}; ${decisionPoint.target}`;

    this.dialogService
      .openDeleteDecisionPointModal(decisionPointDisplayName)
      .afterClosed()
      .subscribe((confirmClicked) => {
        if (confirmClicked) {
          this.selectedExperiment$.pipe(take(1)).subscribe((experiment: Experiment) => {
            if (experiment) {
              this.decisionPointHelperService.deleteDecisionPoint(experiment, decisionPoint);
            }
          });
        }
      });
  }
}
