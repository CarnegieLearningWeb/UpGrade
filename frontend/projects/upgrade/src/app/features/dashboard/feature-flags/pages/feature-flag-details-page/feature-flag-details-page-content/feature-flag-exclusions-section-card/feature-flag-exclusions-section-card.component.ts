import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import {
  CommonSectionCardActionButtonsComponent,
  CommonSectionCardComponent,
  CommonSectionCardTitleHeaderComponent,
} from '../../../../../../../shared-standalone-component-lib/components';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { IMenuButtonItem } from 'upgrade_types';
import { FeatureFlagExclusionsTableComponent } from './feature-flag-exclusions-table/feature-flag-exclusions-table.component';
import { FeatureFlagsService } from '../../../../../../../core/feature-flags/feature-flags.service';
import { DialogService } from '../../../../../../../shared/services/common-dialog.service';
import {
  FEATURE_FLAG_BUTTON_ACTION,
  FeatureFlag,
  PARTICIPANT_LIST_ROW_ACTION,
  ParticipantListRowActionEvent,
  ParticipantListTableRow,
} from '../../../../../../../core/feature-flags/store/feature-flags.model';
import { Segment } from '../../../../../../../core/segments/store/segments.model';
import { UserPermission } from '../../../../../../../core/auth/store/auth.models';
import { Observable } from 'rxjs';
import { AuthService } from '../../../../../../../core/auth/auth.service';

@Component({
  selector: 'app-feature-flag-exclusions-section-card',
  imports: [
    CommonSectionCardComponent,
    CommonSectionCardTitleHeaderComponent,
    CommonSectionCardActionButtonsComponent,
    CommonModule,
    FeatureFlagExclusionsTableComponent,
    TranslateModule,
  ],
  templateUrl: './feature-flag-exclusions-section-card.component.html',
  styleUrl: './feature-flag-exclusions-section-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureFlagExclusionsSectionCardComponent {
  @Input() isSectionCardExpanded;
  permissions$: Observable<UserPermission>;
  tableRowCount$ = this.featureFlagService.selectFeatureFlagExclusionsLength$;
  selectedFlag$ = this.featureFlagService.selectedFeatureFlag$;

  menuButtonItems: IMenuButtonItem[] = [
    {
      label: 'feature-flags.details.exclusions-modal.import-list.menu-item.text',
      action: FEATURE_FLAG_BUTTON_ACTION.IMPORT_EXCLUDE_LIST,
      disabled: false,
    },
    {
      label: 'feature-flags.details.exclusions-modal.export-lists.menu-item.text',
      action: FEATURE_FLAG_BUTTON_ACTION.EXPORT_ALL_EXCLUDE_LISTS,
      disabled: false,
    },
  ];

  constructor(
    private featureFlagService: FeatureFlagsService,
    private dialogService: DialogService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.permissions$ = this.authService.userPermissions$;
  }

  onAddExcludeListClick(appContext: string, flagId: string) {
    this.dialogService.openAddExcludeListModal(appContext, flagId);
  }

  onMenuButtonItemClick(event, flag: FeatureFlag) {
    const confirmMessage = 'feature-flags.export-all-exclude-lists-design.confirmation-text.text';
    switch (event) {
      case FEATURE_FLAG_BUTTON_ACTION.IMPORT_EXCLUDE_LIST:
        this.dialogService
          .openImportFeatureFlagExcludeListModal(flag.id)
          .afterClosed()
          .subscribe(() => this.featureFlagService.fetchFeatureFlagById(flag.id));
        break;
      case FEATURE_FLAG_BUTTON_ACTION.EXPORT_ALL_EXCLUDE_LISTS:
        if (flag.featureFlagSegmentExclusion.length) {
          this.dialogService
            .openExportDesignModal('Export All Exclude Lists', confirmMessage)
            .afterClosed()
            .subscribe((isExportClicked: boolean) => {
              if (isExportClicked) {
                this.featureFlagService.exportAllExcludeListsData(flag.id);
              }
            });
        }
        break;
      default:
        console.log('Unknown action');
    }
  }

  onSectionCardExpandChange(isSectionCardExpanded: boolean) {
    this.isSectionCardExpanded = isSectionCardExpanded;
  }

  // Participant list row action events
  onRowAction(event: ParticipantListRowActionEvent, flagId: string): void {
    switch (event.action) {
      case PARTICIPANT_LIST_ROW_ACTION.EDIT:
        this.onEditExcludeList(event.rowData, flagId);
        break;
      case PARTICIPANT_LIST_ROW_ACTION.DELETE:
        this.onDeleteExcludeList(event.rowData.segment);
        break;
    }
  }

  onEditExcludeList(rowData: ParticipantListTableRow, flagId: string): void {
    this.dialogService.openEditExcludeListModal(rowData, rowData.segment.context, flagId);
  }

  onDeleteExcludeList(segment: Segment): void {
    this.dialogService
      .openDeleteExcludeListModal(segment.name)
      .afterClosed()
      .subscribe((confirmClicked) => {
        if (confirmClicked) {
          this.featureFlagService.deleteFeatureFlagExclusionPrivateSegmentList(segment.id);
        }
      });
  }
}
