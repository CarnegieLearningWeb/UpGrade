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
import {
  EXPERIMENT_BUTTON_ACTION,
  Experiment,
  EXPERIMENT_SECTION_CARD_TYPE,
} from '../../../../../../../core/experiments/store/experiments.model';
import {
  PARTICIPANT_LIST_ROW_ACTION,
  ParticipantListRowActionEvent,
  ParticipantListTableRow,
} from '../../../../../../../core/feature-flags/store/feature-flags.model';
import { Segment } from '../../../../../../../core/segments/store/segments.model';
import { UserPermission } from '../../../../../../../core/auth/store/auth.models';
import { Observable, take, combineLatest, map } from 'rxjs';
import { AuthService } from '../../../../../../../core/auth/auth.service';
import {
  getSectionCardRestriction,
  SectionCardRestriction,
} from '../../../../../../../core/experiments/experiment-status-restriction-helper.service';

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
  tableRowCount$ = this.experimentService.selectExperimentExclusionsLength$;
  selectedExperiment$ = this.experimentService.selectedExperiment$;
  vm$: Observable<{ experiment: Experiment; permissions: UserPermission; restriction: SectionCardRestriction }>;
  menuButtonItems$: Observable<IMenuButtonItem[]>;

  constructor(
    readonly experimentService: ExperimentService,
    private readonly dialogService: DialogService,
    private readonly authService: AuthService
  ) {}

  ngOnInit() {
    this.vm$ = combineLatest([this.selectedExperiment$, this.authService.userPermissions$]).pipe(
      map(([experiment, permissions]) => ({
        experiment,
        permissions,
        restriction: getSectionCardRestriction(EXPERIMENT_SECTION_CARD_TYPE.EXCLUSIONS, experiment?.state),
      }))
    );

    this.menuButtonItems$ = combineLatest([this.vm$, this.tableRowCount$]).pipe(
      map(([vm, tableRowCount]) => [
        {
          label: 'experiments.details.import-exclude-list.menu-item.text',
          action: EXPERIMENT_BUTTON_ACTION.IMPORT_EXCLUDE_LIST,
          disabled: !vm.permissions?.segments.update || vm.restriction.isDisabled || vm.restriction.shouldHideActions,
        },
        {
          label: 'experiments.details.export-all-exclude-lists.menu-item.text',
          action: EXPERIMENT_BUTTON_ACTION.EXPORT_ALL_EXCLUDE_LISTS,
          disabled: tableRowCount === 0,
        },
      ])
    );
  }

  onAddExcludeListClick(appContext: string, experimentId: string): void {
    this.dialogService.openExperimentAddExcludeListModal(appContext, experimentId);
  }

  onMenuButtonItemClick(event: string, experiment: Experiment): void {
    switch (event) {
      case EXPERIMENT_BUTTON_ACTION.IMPORT_EXCLUDE_LIST:
        this.dialogService
          .openImportExperimentExcludeListModal(experiment.id)
          .afterClosed()
          .pipe(take(1))
          .subscribe((didImport) => {
            if (didImport) {
              this.experimentService.fetchExperimentById(experiment.id);
            }
          });
        break;
      case EXPERIMENT_BUTTON_ACTION.EXPORT_ALL_EXCLUDE_LISTS:
        if (experiment.experimentSegmentExclusion.length) {
          this.dialogService
            .openExportExcludeListModal()
            .afterClosed()
            .pipe(take(1))
            .subscribe((isExportClicked: boolean) => {
              if (isExportClicked) {
                this.experimentService.exportAllExcludeListsData(experiment.id);
              }
            });
        }
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
      .pipe(take(1))
      .subscribe((confirmClicked) => {
        if (confirmClicked) {
          this.experimentService.deleteExperimentExclusionPrivateSegmentList(segment.id);
        }
      });
  }
}
