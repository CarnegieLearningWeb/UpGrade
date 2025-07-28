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
import { Observable } from 'rxjs';
import {
  Experiment,
  EXPERIMENT_BUTTON_ACTION,
  EXPERIMENT_ROW_ACTION,
  ExperimentCondition,
  ExperimentConditionRowActionEvent,
} from '../../../../../../../core/experiments/store/experiments.model';
import { UserPermission } from '../../../../../../../core/auth/store/auth.models';
import { AuthService } from '../../../../../../../core/auth/auth.service';

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

  menuButtonItems: IMenuButtonItem[] = [
    {
      label: 'experiments.details.import-condition.menu-item.text',
      action: EXPERIMENT_BUTTON_ACTION.IMPORT_CONDITION,
      disabled: false,
    },
    {
      label: 'experiments.details.export-all-conditions.menu-item.text',
      action: EXPERIMENT_BUTTON_ACTION.EXPORT_ALL_CONDITIONS,
      disabled: false,
    },
  ];

  constructor(private experimentService: ExperimentService, private authService: AuthService) {}

  ngOnInit() {
    this.permissions$ = this.authService.userPermissions$;
  }

  onAddConditionClick(appContext: string, experimentId: string): void {
    // TODO: Implement add condition functionality when dialog service is available
    console.log('Add condition clicked');
  }

  onMenuButtonItemClick(event: string, experiment: Experiment): void {
    switch (event) {
      case EXPERIMENT_BUTTON_ACTION.IMPORT_CONDITION:
        // TODO: Implement import functionality when dialog service is available
        console.log('Import condition clicked for experiment:', experiment.id);
        break;
      case EXPERIMENT_BUTTON_ACTION.EXPORT_ALL_CONDITIONS:
        // TODO: Implement export functionality when experiment service methods are available
        console.log('Export all conditions clicked for experiment:', experiment.id);
        break;
      default:
        console.log('Unknown action:', event);
    }
  }

  onSectionCardExpandChange(isSectionCardExpanded: boolean): void {
    this.isSectionCardExpanded = isSectionCardExpanded;
  }

  // Condition row action events
  onRowAction(event: ExperimentConditionRowActionEvent, experimentId: string): void {
    switch (event.action) {
      case EXPERIMENT_ROW_ACTION.EDIT:
        this.onEditCondition(event.condition, experimentId);
        break;
      case EXPERIMENT_ROW_ACTION.DELETE:
        this.onDeleteCondition(event.condition);
        break;
      default:
        console.log('Unknown action:', event.action);
    }
  }

  onEditCondition(condition: ExperimentCondition, experimentId: string): void {
    // TODO: Implement edit functionality when dialog service is available
    console.log('Edit condition:', condition, 'for experiment:', experimentId);
  }

  onDeleteCondition(condition: ExperimentCondition): void {
    // TODO: Implement delete functionality when dialog service is available
    console.log('Delete condition:', condition);
  }
}
