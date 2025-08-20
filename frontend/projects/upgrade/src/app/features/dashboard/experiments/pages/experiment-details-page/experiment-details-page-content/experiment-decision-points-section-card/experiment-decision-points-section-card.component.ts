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
import { Observable } from 'rxjs';
import {
  Experiment,
  EXPERIMENT_BUTTON_ACTION,
  EXPERIMENT_ROW_ACTION,
  ExperimentDecisionPoint,
  ExperimentDecisionPointRowActionEvent,
} from '../../../../../../../core/experiments/store/experiments.model';
import { UserPermission } from '../../../../../../../core/auth/store/auth.models';
import { AuthService } from '../../../../../../../core/auth/auth.service';

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

  menuButtonItems: IMenuButtonItem[] = [
    {
      label: 'experiments.details.import-decision-point.menu-item.text',
      action: EXPERIMENT_BUTTON_ACTION.IMPORT_DECISION_POINT,
      disabled: false,
    },
    {
      label: 'experiments.details.export-all-decision-points.menu-item.text',
      action: EXPERIMENT_BUTTON_ACTION.EXPORT_ALL_DECISION_POINTS,
      disabled: false,
    },
  ];

  constructor(public experimentService: ExperimentService, private authService: AuthService) {}

  ngOnInit() {
    this.permissions$ = this.authService.userPermissions$;
  }

  onAddDecisionPointClick(appContext: string, experimentId: string): void {
    // TODO: Implement add decision point functionality when dialog service is available
    console.log('Add decision point');
  }

  onMenuButtonItemClick(event: string, experiment: Experiment): void {
    switch (event) {
      case EXPERIMENT_BUTTON_ACTION.IMPORT_DECISION_POINT:
        // TODO: Implement import functionality when dialog service is available
        console.log('Import decision point');
        break;
      case EXPERIMENT_BUTTON_ACTION.EXPORT_ALL_DECISION_POINTS:
        // TODO: Implement export functionality when experiment service methods are available
        console.log('Export all decision points');
        break;
      default:
        console.log('Unknown action:', event);
    }
  }

  onSectionCardExpandChange(isSectionCardExpanded: boolean): void {
    this.isSectionCardExpanded = isSectionCardExpanded;
  }

  // Decision point row action events
  onRowAction(event: ExperimentDecisionPointRowActionEvent, experimentId: string): void {
    switch (event.action) {
      case EXPERIMENT_ROW_ACTION.EDIT:
        this.onEditDecisionPoint(event.decisionPoint, experimentId);
        break;
      case EXPERIMENT_ROW_ACTION.DELETE:
        this.onDeleteDecisionPoint(event.decisionPoint);
        break;
      default:
        console.log('Unknown action:', event.action);
    }
  }

  onEditDecisionPoint(decisionPoint: ExperimentDecisionPoint, experimentId: string): void {
    // TODO: Implement edit functionality when dialog service is available
    console.log('Edit decision point');
  }

  onDeleteDecisionPoint(decisionPoint: ExperimentDecisionPoint): void {
    // TODO: Implement delete functionality when dialog service is available
    console.log('Delete decision point');
  }
}
