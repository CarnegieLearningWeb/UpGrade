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
import { MatDialogRef } from '@angular/material/dialog';
import { CommonSimpleConfirmationModalComponent } from '../../../../../../../shared-standalone-component-lib/components/common-simple-confirmation-modal/common-simple-confirmation-modal.component';
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
import { DialogService } from '../../../../../../../shared/services/common-dialog.service';

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

  constructor(
    private experimentService: ExperimentService,
    private authService: AuthService,
    private dialogService: DialogService
  ) {}

  confirmIncludeAllChangeDialogRef: MatDialogRef<CommonSimpleConfirmationModalComponent>;

  ngOnInit() {
    this.permissions$ = this.authService.userPermissions$;
  }

  onAddIncludeListClick(appContext: string, experimentId: string): void {
    this.dialogService.openExperimentAddIncludeListModal(appContext, experimentId);
  }

  onSlideToggleChange(event: MatSlideToggleChange, experiment: Experiment): void {
    const slideToggleEvent = event.source;
    const newFilterMode = slideToggleEvent.checked ? FILTER_MODE.INCLUDE_ALL : FILTER_MODE.EXCLUDE_ALL;

    if (slideToggleEvent.checked) {
      this.confirmIncludeAllChangeDialogRef = this.openEnableConfirmModel();
    } else {
      this.confirmIncludeAllChangeDialogRef = this.openDisableConfirmModal();
    }
    this.listenForConfirmIncludeAllChangeDialogRefClose(experiment, newFilterMode);

    // Revert the toggle state (will be updated when service call succeeds)
    slideToggleEvent.checked = !slideToggleEvent.checked;
  }

  openEnableConfirmModel(): MatDialogRef<CommonSimpleConfirmationModalComponent, boolean> {
    return this.dialogService.openEnableIncludeAllConfirmModel();
  }

  openDisableConfirmModal(): MatDialogRef<CommonSimpleConfirmationModalComponent, boolean> {
    return this.dialogService.openDisableIncludeAllConfirmModal();
  }

  listenForConfirmIncludeAllChangeDialogRefClose(experiment: Experiment, newFilterMode: FILTER_MODE) {
    this.subscriptions.add(
      this.confirmIncludeAllChangeDialogRef.afterClosed().subscribe((confirmClicked) => {
        this.handleDialogClose(confirmClicked, experiment, newFilterMode);
      })
    );
  }

  handleDialogClose(confirmClicked: boolean, experiment: Experiment, newFilterMode: FILTER_MODE): void {
    if (confirmClicked) {
      this.experimentService.updateFilterMode({
        experiment: experiment,
        filterMode: newFilterMode,
      });
      this.updateSectionCardExpansion(newFilterMode);
    }
    // If user cancels, the toggle state is already reverted, so no action needed
  }

  updateSectionCardExpansion(newFilterMode: FILTER_MODE): void {
    this.isSectionCardExpanded = newFilterMode !== FILTER_MODE.INCLUDE_ALL;
  }

  onMenuButtonItemClick(event: string, experiment: Experiment): void {
    switch (event) {
      case EXPERIMENT_BUTTON_ACTION.IMPORT_INCLUDE_LIST:
        // TODO: Uncomment when dialog service is available
        // this.dialogService
        //   .openImportExperimentIncludeListModal(experiment.id)
        //   .afterClosed()
        //   .subscribe(() => this.experimentService.fetchExperimentById(experiment.id));
        console.log('Import include list clicked for experiment:', experiment.id);
        break;
      case EXPERIMENT_BUTTON_ACTION.EXPORT_ALL_INCLUDE_LISTS:
        // TODO: Uncomment when dialog service is available and check for inclusions
        // if (experiment.experimentSegmentInclusion.length) {
        //   this.dialogService
        //     .openExportIncludeListModal()
        //     .afterClosed()
        //     .subscribe((isExportClicked: boolean) => {
        //       if (isExportClicked) {
        //         this.experimentService.exportAllIncludeListsData(experiment.id);
        //       }
        //     });
        // }
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
  onRowAction(event: ParticipantListRowActionEvent, experimentId: string): void {
    switch (event.action) {
      case PARTICIPANT_LIST_ROW_ACTION.EDIT:
        this.onEditIncludeList(event.rowData, experimentId);
        break;
      case PARTICIPANT_LIST_ROW_ACTION.DELETE:
        this.onDeleteIncludeList(event.rowData.segment);
        break;
      default:
        console.log('Unknown action:', event.action);
    }
  }

  onEditIncludeList(rowData: ParticipantListTableRow, experimentId: string): void {
    this.dialogService.openExperimentEditIncludeListModal(rowData, rowData.segment.context, experimentId);
  }

  onDeleteIncludeList(segment: Segment): void {
    this.dialogService
      .openDeleteIncludeListModal(segment.name)
      .afterClosed()
      .subscribe((confirmClicked) => {
        if (confirmClicked) {
          this.experimentService.deleteExperimentInclusionPrivateSegmentList(segment.id);
        }
      });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
