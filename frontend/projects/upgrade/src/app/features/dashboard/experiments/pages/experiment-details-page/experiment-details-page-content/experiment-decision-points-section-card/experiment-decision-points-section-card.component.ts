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
import { Experiment, EXPERIMENT_BUTTON_ACTION } from '../../../../../../../core/experiments/store/experiments.model';
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

  // TODO: Add tableRowCount$ when experiment decision points are implemented
  tableRowCount = 0;

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

  constructor(private experimentService: ExperimentService, private authService: AuthService) {}

  ngOnInit() {
    this.permissions$ = this.authService.userPermissions$;
  }

  onAddDecisionPointClick(): void {
    // TODO: Implement add decision point functionality when dialog service is available
    console.log('Add decision point clicked');
  }

  onMenuButtonItemClick(event: string, experiment: Experiment): void {
    switch (event) {
      case EXPERIMENT_BUTTON_ACTION.IMPORT_DECISION_POINT:
        // TODO: Implement import functionality when dialog service is available
        console.log('Import decision point clicked for experiment:', experiment.id);
        break;
      case EXPERIMENT_BUTTON_ACTION.EXPORT_ALL_DECISION_POINTS:
        // TODO: Implement export functionality when experiment service methods are available
        console.log('Export all decision points clicked for experiment:', experiment.id);
        break;
      default:
        console.log('Unknown action:', event);
    }
  }

  onSectionCardExpandChange(isSectionCardExpanded: boolean): void {
    this.isSectionCardExpanded = isSectionCardExpanded;
  }

  // TODO: Add row action methods when experiment decision points table events are implemented
  // onRowAction(event: ExperimentDecisionPointRowActionEvent, experimentId: string): void {}
  // onEditDecisionPoint(rowData: ExperimentDecisionPointTableRow, experimentId: string): void {}
  // onDeleteDecisionPoint(decisionPoint: ExperimentDecisionPoint): void {}
}
