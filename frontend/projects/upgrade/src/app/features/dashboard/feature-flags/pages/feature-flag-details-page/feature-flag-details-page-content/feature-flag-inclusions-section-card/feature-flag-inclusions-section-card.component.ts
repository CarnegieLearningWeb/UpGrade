import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import {
  CommonSectionCardActionButtonsComponent,
  CommonSectionCardComponent,
  CommonSectionCardTitleHeaderComponent,
} from '../../../../../../../shared-standalone-component-lib/components';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { IMenuButtonItem, SEGMENT_TYPE } from 'upgrade_types';
import { FeatureFlagInclusionsTableComponent } from './feature-flag-inclusions-table/feature-flag-inclusions-table.component';
import { FeatureFlagsService } from '../../../../../../../core/feature-flags/feature-flags.service';
import { DialogService } from '../../../../../../../shared/services/common-dialog.service';
import {
  PARTICIPANT_LIST_ROW_ACTION,
  ParticipantListRowActionEvent,
  ParticipantListTableRow,
} from '../../../../../../../core/feature-flags/store/feature-flags.model';
import {
  EditPrivateSegmentListDetails,
  EditPrivateSegmentListRequest,
  Segment,
} from '../../../../../../../core/segments/store/segments.model';

@Component({
  selector: 'app-feature-flag-inclusions-section-card',
  standalone: true,
  imports: [
    CommonSectionCardComponent,
    CommonSectionCardTitleHeaderComponent,
    CommonSectionCardActionButtonsComponent,
    CommonModule,
    FeatureFlagInclusionsTableComponent,
    TranslateModule,
  ],
  templateUrl: './feature-flag-inclusions-section-card.component.html',
  styleUrl: './feature-flag-inclusions-section-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureFlagInclusionsSectionCardComponent {
  @Input() isSectionCardExpanded;
  tableRowCount$ = this.featureFlagService.selectFeatureFlagInclusionsLength$;
  featureFlag$ = this.featureFlagService.selectedFeatureFlag$;

  constructor(private featureFlagService: FeatureFlagsService, private dialogService: DialogService) {}

  menuButtonItems: IMenuButtonItem[] = [
    { name: 'Edit', disabled: false },
    { name: 'Delete', disabled: false },
  ];

  onAddIncludeListClick(appContext: string, flagId: string) {
    this.dialogService.openAddIncludeListModal(appContext, flagId);
  }

  onMenuButtonItemClick(event) {
    console.log('Menu button Clicked');
    console.log(event);
  }

  onSectionCardExpandChange(isSectionCardExpanded: boolean) {
    this.isSectionCardExpanded = isSectionCardExpanded;
  }

  // Participant list row action events
  onRowAction(event: ParticipantListRowActionEvent, flagId: string): void {
    switch (event.action) {
      case PARTICIPANT_LIST_ROW_ACTION.ENABLE:
        this.onEnableIncludeList(event.rowData, flagId);
        break;
      case PARTICIPANT_LIST_ROW_ACTION.DISABLE:
        this.onDisableIncludeList(event.rowData, flagId);
        break;
      case PARTICIPANT_LIST_ROW_ACTION.EDIT:
        this.onEditIncludeList(event.rowData, flagId);
        break;
      case PARTICIPANT_LIST_ROW_ACTION.DELETE:
        this.onDeleteIncludeList(event.rowData.segment);
        break;
    }
  }

  onEnableIncludeList(rowData: ParticipantListTableRow, flagId: string): void {
    this.dialogService
      .openEnableIncludeListModal(rowData.segment.name)
      .afterClosed()
      .subscribe((confirmClicked) => {
        if (confirmClicked) {
          this.sendUpdateIncludeListRequest(flagId, true, rowData.listType, rowData.segment);
        }
      });
  }

  onDisableIncludeList(rowData: ParticipantListTableRow, flagId: string): void {
    this.dialogService
      .openDisableIncludeListModal(rowData.segment.name)
      .afterClosed()
      .subscribe((confirmClicked) => {
        if (confirmClicked) {
          this.sendUpdateIncludeListRequest(flagId, false, rowData.listType, rowData.segment);
        }
      });
  }

  onEditIncludeList(rowData: ParticipantListTableRow, flagId: string): void {
    this.dialogService.openEditIncludeListModal(rowData, rowData.segment.context, flagId);
  }

  sendUpdateIncludeListRequest(flagId: string, enabled: boolean, listType: string, segment: Segment): void {
    const list: EditPrivateSegmentListDetails = this.createEditPrivateSegmentListDetails(segment);

    const listRequest: EditPrivateSegmentListRequest = {
      flagId,
      enabled,
      listType,
      list,
    };

    this.sendUpdateFeatureFlagInclusionRequest(listRequest);
  }

  createEditPrivateSegmentListDetails(segment: Segment): EditPrivateSegmentListDetails {
    const editPrivateSegmentListDetails: EditPrivateSegmentListDetails = {
      id: segment.id,
      name: segment.name,
      description: segment.description,
      context: segment.context,
      type: SEGMENT_TYPE.PRIVATE,
      userIds: segment.individualForSegment.map((individual) => individual.userId),
      groups: segment.groupForSegment,
      subSegmentIds: segment.subSegments.map((subSegment) => subSegment.id),
    };

    return editPrivateSegmentListDetails;
  }

  sendUpdateFeatureFlagInclusionRequest(request: EditPrivateSegmentListRequest): void {
    this.featureFlagService.updateFeatureFlagInclusionPrivateSegmentList(request);
  }

  onDeleteIncludeList(segment: Segment): void {
    this.dialogService
      .openDeleteIncludeListModal(segment.name)
      .afterClosed()
      .subscribe((confirmClicked) => {
        if (confirmClicked) {
          this.featureFlagService.deleteFeatureFlagInclusionPrivateSegmentList(segment.id);
        }
      });
  }
}
