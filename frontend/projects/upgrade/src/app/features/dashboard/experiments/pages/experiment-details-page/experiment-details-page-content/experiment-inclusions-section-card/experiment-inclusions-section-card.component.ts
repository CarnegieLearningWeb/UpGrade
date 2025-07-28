import { ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit } from '@angular/core';
import {
  CommonSectionCardActionButtonsComponent,
  CommonSectionCardComponent,
  CommonSectionCardTitleHeaderComponent,
} from '../../../../../../../shared-standalone-component-lib/components';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { IMenuButtonItem, FILTER_MODE } from 'upgrade_types';
import { ExperimentInclusionsTableComponent } from './experiment-inclusions-table/experiment-inclusions-table.component';
import { ExperimentService } from '../../../../../../../core/experiments/experiments.service';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { Observable, map, Subscription, combineLatest } from 'rxjs';
import { Experiment, EXPERIMENT_BUTTON_ACTION } from '../../../../../../../core/experiments/store/experiments.model';
import { UserPermission } from '../../../../../../../core/auth/store/auth.models';
import { AuthService } from '../../../../../../../core/auth/auth.service';
import {
  ParticipantListRowActionEvent,
  ParticipantListTableRow,
  PARTICIPANT_LIST_ROW_ACTION,
} from '../../../../../../../core/feature-flags/store/feature-flags.model';
import { Segment } from '../../../../../../../core/segments/store/segments.model';

@Component({
  selector: 'app-experiment-inclusions-section-card',
  imports: [
    CommonModule,
    CommonSectionCardComponent,
    CommonSectionCardTitleHeaderComponent,
    CommonSectionCardActionButtonsComponent,
    ExperimentInclusionsTableComponent,
    TranslateModule,
  ],
  templateUrl: './experiment-inclusions-section-card.component.html',
  styleUrl: './experiment-inclusions-section-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperimentInclusionsSectionCardComponent implements OnInit, OnDestroy {
  @Input() isSectionCardExpanded = true;

  permissions$: Observable<UserPermission>;
  selectedExperiment$ = this.experimentService.selectedExperiment$;
  experimentInclusions$ = this.experimentService.selectExperimentInclusions$;
  tableRowCount$ = this.experimentService.selectExperimentInclusionsLength$;
  subscriptions = new Subscription();

  menuButtonItems: IMenuButtonItem[] = [
    {
      label: 'experiments.details.import-include-list.menu-item.text',
      action: EXPERIMENT_BUTTON_ACTION.IMPORT_INCLUDE_LIST,
      disabled: false,
    },
    {
      label: 'experiments.details.export-all-include-lists.menu-item.text',
      action: EXPERIMENT_BUTTON_ACTION.EXPORT_ALL_INCLUDE_LISTS,
      disabled: false,
    },
  ];

  rowCountWithInclude$: Observable<number> = combineLatest([this.tableRowCount$, this.selectedExperiment$]).pipe(
    map(([tableRowCount, selectedExperiment]) =>
      selectedExperiment?.filterMode === FILTER_MODE.INCLUDE_ALL ? 0 : tableRowCount
    )
  );

  get FILTER_MODE() {
    return FILTER_MODE;
  }

  constructor(private experimentService: ExperimentService, private authService: AuthService) {}

  ngOnInit() {
    this.permissions$ = this.authService.userPermissions$;
  }

  onAddIncludeListClick(appContext: string, experimentId: string): void {
    // TODO: Implement add include list functionality when dialog service is available
    console.log('Add include list clicked for experiment:', experimentId, 'context:', appContext);
  }

  onSlideToggleChange(event: MatSlideToggleChange, experimentId: string): void {
    // TODO: Implement slide toggle functionality when experiment service methods are available
    const newFilterMode = event.checked ? FILTER_MODE.INCLUDE_ALL : FILTER_MODE.EXCLUDE_ALL;
    console.log('Slide toggle changed:', event.checked, 'experimentId:', experimentId, 'newFilterMode:', newFilterMode);
    this.updateSectionCardExpansion(newFilterMode);
  }

  updateSectionCardExpansion(newFilterMode: FILTER_MODE): void {
    this.isSectionCardExpanded = newFilterMode !== FILTER_MODE.INCLUDE_ALL;
  }

  onMenuButtonItemClick(event: string, experiment: Experiment): void {
    switch (event) {
      case EXPERIMENT_BUTTON_ACTION.IMPORT_INCLUDE_LIST:
        console.log('Import include list clicked for experiment:', experiment.id);
        break;
      case EXPERIMENT_BUTTON_ACTION.EXPORT_ALL_INCLUDE_LISTS:
        console.log('Export all include lists clicked for experiment:', experiment.id);
        break;
      default:
        console.log('Unknown menu action:', event);
    }
  }

  onSectionCardExpandChange(isSectionCardExpanded: boolean): void {
    this.isSectionCardExpanded = isSectionCardExpanded;
  }

  // Participant list row action events
  onRowAction(event: ParticipantListRowActionEvent): void {
    console.log('ExperimentInclusionsSectionCard row action:', event);

    switch (event.action) {
      case PARTICIPANT_LIST_ROW_ACTION.ENABLE:
        console.log('Enable participant clicked:', event.rowData);
        break;
      case PARTICIPANT_LIST_ROW_ACTION.DISABLE:
        console.log('Disable participant clicked:', event.rowData);
        break;
      case PARTICIPANT_LIST_ROW_ACTION.EDIT:
        console.log('Edit participant clicked:', event.rowData);
        break;
      case PARTICIPANT_LIST_ROW_ACTION.DELETE:
        console.log('Delete participant clicked:', event.rowData);
        break;
      default:
        console.log('Unknown action:', event.action);
    }
  }

  onEnableIncludeList(rowData: ParticipantListTableRow, experimentId: string): void {
    console.log('Enable include list clicked for experiment:', experimentId, 'segment:', rowData.segment.name);
  }

  onDisableIncludeList(rowData: ParticipantListTableRow, experimentId: string): void {
    console.log('Disable include list clicked for experiment:', experimentId, 'segment:', rowData.segment.name);
  }

  onEditIncludeList(rowData: ParticipantListTableRow, experimentId: string): void {
    console.log('Edit include list clicked for experiment:', experimentId, 'segment:', rowData.segment.name);
  }

  onDeleteIncludeList(segment: Segment): void {
    console.log('Delete include list clicked for segment:', segment.name);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
