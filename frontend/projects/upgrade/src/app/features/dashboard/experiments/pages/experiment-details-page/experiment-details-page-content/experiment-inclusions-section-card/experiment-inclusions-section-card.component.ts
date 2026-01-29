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
import { Observable, map, Subscription, combineLatest, take } from 'rxjs';
import {
  Experiment,
  EXPERIMENT_BUTTON_ACTION,
  EXPERIMENT_SECTION_CARD_TYPE,
  SectionCardRestriction,
} from '../../../../../../../core/experiments/store/experiments.model';
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

  selectedExperiment$ = this.experimentService.selectedExperiment$;
  experimentInclusions$ = this.experimentService.selectExperimentInclusions$;
  tableRowCount$ = this.experimentService.selectExperimentInclusionsLength$;
  subscriptions = new Subscription();
  private previousFilterMode?: FILTER_MODE;
  vm$: Observable<{
    experiment: Experiment;
    permissions: UserPermission;
    restriction: SectionCardRestriction & { isIncludeAll?: boolean; slideToggleTooltipKey?: string };
  }>;
  menuButtonItems$: Observable<IMenuButtonItem[]>;
  menuButtonDisabled$: Observable<boolean>;

  rowCountWithInclude$: Observable<number> = combineLatest([this.tableRowCount$, this.selectedExperiment$]).pipe(
    map(([tableRowCount, selectedExperiment]) =>
      selectedExperiment?.filterMode === FILTER_MODE.INCLUDE_ALL ? 0 : tableRowCount
    )
  );

  get FILTER_MODE() {
    return FILTER_MODE;
  }

  constructor(
    readonly experimentService: ExperimentService,
    private readonly authService: AuthService,
    private readonly dialogService: DialogService
  ) {}

  confirmIncludeAllChangeDialogRef: MatDialogRef<CommonSimpleConfirmationModalComponent>;

  ngOnInit() {
    this.vm$ = combineLatest([
      this.selectedExperiment$,
      this.authService.userPermissions$,
      this.experimentService.sectionCardRestriction$(EXPERIMENT_SECTION_CARD_TYPE.INCLUSIONS),
    ]).pipe(
      map(([experiment, permissions, baseRestriction]) => {
        const isIncludeAll = experiment?.filterMode === FILTER_MODE.INCLUDE_ALL;

        return {
          experiment,
          permissions,
          restriction: {
            ...baseRestriction,
            isIncludeAll,
            ...(isIncludeAll && {
              tooltipKey: 'experiments.details.restrictions.include-all-enabled.text',
            }),
            slideToggleTooltipKey: permissions?.segments.update
              ? baseRestriction.tooltipKey
              : 'experiments.details.restrictions.include-all-read-only.text',
          },
        };
      })
    );

    this.menuButtonItems$ = combineLatest([this.vm$, this.tableRowCount$]).pipe(
      map(([vm, tableRowCount]) => [
        {
          label: 'experiments.details.import-include-list.menu-item.text',
          action: EXPERIMENT_BUTTON_ACTION.IMPORT_INCLUDE_LIST,
          disabled: !vm.permissions?.segments.update || vm.restriction.isDisabled || vm.restriction.shouldHideActions,
        },
        {
          label: 'experiments.details.export-all-include-lists.menu-item.text',
          action: EXPERIMENT_BUTTON_ACTION.EXPORT_ALL_INCLUDE_LISTS,
          disabled: tableRowCount === 0,
        },
      ])
    );

    this.menuButtonDisabled$ = combineLatest([this.vm$, this.menuButtonItems$]).pipe(
      map(([vm, items]) => vm.restriction.isIncludeAll || items.every((item) => item.disabled))
    );

    // Expand section when include-all mode transitions back to exclude-all (e.g., after context change)
    this.subscriptions.add(
      this.selectedExperiment$.subscribe((experiment) => {
        if (!experiment) {
          this.previousFilterMode = undefined;
          return;
        }

        const nextFilterMode = experiment.filterMode;
        if (this.previousFilterMode === FILTER_MODE.INCLUDE_ALL && nextFilterMode === FILTER_MODE.EXCLUDE_ALL) {
          this.isSectionCardExpanded = true;
        }

        this.previousFilterMode = nextFilterMode;
      })
    );
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
    }
    // If user cancels, the toggle state is already reverted, so no action needed
  }

  onMenuButtonItemClick(event: string, experiment: Experiment): void {
    switch (event) {
      case EXPERIMENT_BUTTON_ACTION.IMPORT_INCLUDE_LIST:
        this.dialogService.openImportExperimentIncludeListModal(experiment.id);
        break;
      case EXPERIMENT_BUTTON_ACTION.EXPORT_ALL_INCLUDE_LISTS:
        if (experiment.experimentSegmentInclusion.length) {
          this.dialogService
            .openExportIncludeListModal()
            .afterClosed()
            .pipe(take(1))
            .subscribe((isExportClicked: boolean) => {
              if (isExportClicked) {
                this.experimentService.exportAllIncludeListsData(experiment.id);
              }
            });
        }
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
      .pipe(take(1))
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
