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
import { DialogService } from '../../../../../../../shared/services/common-dialog.service';
import { EXPERIMENT_BUTTON_ACTION, Experiment } from '../../../../../../../core/experiments/store/experiments.model';
import {
  PARTICIPANT_LIST_ROW_ACTION,
  ParticipantListRowActionEvent,
  ParticipantListTableRow,
} from '../../../../../../../core/feature-flags/store/feature-flags.model';
import { Segment } from '../../../../../../../core/segments/store/segments.model';
import { UserPermission } from '../../../../../../../core/auth/store/auth.models';
import { Observable } from 'rxjs';
import { AuthService } from '../../../../../../../core/auth/auth.service';

@Component({
  selector: 'app-experiment-exclusions-section-card',
  imports: [
    CommonSectionCardComponent,
    CommonSectionCardTitleHeaderComponent,
    CommonSectionCardActionButtonsComponent,
    CommonModule,
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
  tableRowCount$ = this.experimentService.selectExperimentExclusionsLength$;
  selectedExperiment$ = this.experimentService.selectedExperiment$;

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

  constructor(
    private experimentService: ExperimentService,
    private dialogService: DialogService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.permissions$ = this.authService.userPermissions$;
  }

  onAddExcludeListClick(appContext: string, experimentId: string): void {
    this.dialogService.openExperimentAddExcludeListModal(appContext, experimentId);
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

  // Participant list row action events
  onRowAction(event: ParticipantListRowActionEvent, experimentId: string): void {
    switch (event.action) {
      case PARTICIPANT_LIST_ROW_ACTION.EDIT:
        this.onEditExcludeList(event.rowData, experimentId);
        break;
      case PARTICIPANT_LIST_ROW_ACTION.DELETE:
        this.onDeleteExcludeList(event.rowData.segment);
        break;
      default:
        console.log('Unknown row action:', event.action);
    }
  }

  onEditExcludeList(rowData: ParticipantListTableRow, experimentId: string): void {
    this.dialogService.openExperimentEditExcludeListModal(rowData, rowData.segment.context, experimentId);
  }

  onDeleteExcludeList(segment: Segment): void {
    this.dialogService
      .openDeleteExcludeListModal(segment.name)
      .afterClosed()
      .subscribe((confirmClicked) => {
        if (confirmClicked) {
          this.experimentService.deleteExperimentExclusionPrivateSegmentList(segment.id);
        }
      });
  }
}
