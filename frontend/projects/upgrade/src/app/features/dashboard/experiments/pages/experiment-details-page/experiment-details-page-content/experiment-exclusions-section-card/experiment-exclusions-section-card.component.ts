import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import {
  CommonSectionCardActionButtonsComponent,
  CommonSectionCardComponent,
  CommonSectionCardTitleHeaderComponent,
} from '../../../../../../../shared-standalone-component-lib/components';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { IMenuButtonItem } from 'upgrade_types';
import { ExperimentExclusionsTableComponent } from './experiment-exclusions-table/experiment-exclusions-table.component';
import { ExperimentService } from '../../../../../../../core/experiments/experiments.service';
import { Observable } from 'rxjs';
import { Experiment, EXPERIMENT_BUTTON_ACTION } from '../../../../../../../core/experiments/store/experiments.model';
import { UserPermission } from '../../../../../../../core/auth/store/auth.models';
import { AuthService } from '../../../../../../../core/auth/auth.service';

@Component({
  selector: 'app-experiment-exclusions-section-card',
  imports: [
    CommonModule,
    CommonSectionCardComponent,
    CommonSectionCardTitleHeaderComponent,
    CommonSectionCardActionButtonsComponent,
    ExperimentExclusionsTableComponent,
    TranslateModule,
  ],
  templateUrl: './experiment-exclusions-section-card.component.html',
  styleUrl: './experiment-exclusions-section-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperimentExclusionsSectionCardComponent implements OnInit {
  @Input() isSectionCardExpanded = true;

  permissions$: Observable<UserPermission>;
  selectedExperiment$ = this.experimentService.selectedExperiment$;

  // TODO: Add tableRowCount$ when experiment exclusions are implemented
  tableRowCount = 0;

  menuButtonItems: IMenuButtonItem[] = [
    {
      label: 'experiments.details.import-exclude-list.menu-item.text',
      action: EXPERIMENT_BUTTON_ACTION.IMPORT_EXCLUDE_LIST,
      disabled: false,
    },
    {
      label: 'experiments.details.export-all-exclude-lists.menu-item.text',
      action: EXPERIMENT_BUTTON_ACTION.EXPORT_ALL_EXCLUDE_LISTS,
      disabled: false,
    },
  ];

  constructor(private experimentService: ExperimentService, private authService: AuthService) {}

  ngOnInit() {
    this.permissions$ = this.authService.userPermissions$;
  }

  onAddExclusionClick(): void {
    // TODO: Implement add exclusion functionality when dialog service is available
    console.log('Add exclusion clicked');
  }

  onMenuButtonItemClick(event: string, experiment: Experiment): void {
    switch (event) {
      case EXPERIMENT_BUTTON_ACTION.IMPORT_EXCLUDE_LIST:
        // TODO: Implement import functionality when dialog service is available
        console.log('Import exclude list clicked for experiment:', experiment.id);
        break;
      case EXPERIMENT_BUTTON_ACTION.EXPORT_ALL_EXCLUDE_LISTS:
        // TODO: Implement export functionality when experiment service methods are available
        console.log('Export all exclude lists clicked for experiment:', experiment.id);
        break;
      default:
        console.log('Unknown action:', event);
    }
  }

  onSectionCardExpandChange(isSectionCardExpanded: boolean): void {
    this.isSectionCardExpanded = isSectionCardExpanded;
  }

  // TODO: Add row action methods when experiment exclusions table events are implemented
  // onRowAction(event: ExperimentParticipantListRowActionEvent, experimentId: string): void {}
  // onEditExcludeList(rowData: ExperimentParticipantListTableRow, experimentId: string): void {}
  // onDeleteExcludeList(segment: Segment): void {}
}
