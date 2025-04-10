import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import {
  CommonSectionCardComponent,
  CommonSectionCardTitleHeaderComponent,
  CommonSectionCardActionButtonsComponent,
} from '../../../../../../../shared-standalone-component-lib/components';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { IMenuButtonItem } from 'upgrade_types';
import { SegmentsService } from '../../../../../../../core/segments/segments.service';
import { DialogService } from '../../../../../../../shared/services/common-dialog.service';
import {
  ParticipantListTableRow,
  Segment,
  SEGMENT_LIST_ACTIONS,
} from '../../../../../../../core/segments/store/segments.model';
import { Observable, Subscription } from 'rxjs';
import { AuthService } from '../../../../../../../core/auth/auth.service';
import { UserPermission } from '../../../../../../../core/auth/store/auth.models';
import {
  PARTICIPANT_LIST_ROW_ACTION,
  ParticipantListRowActionEvent,
} from '../../../../../../../core/feature-flags/store/feature-flags.model';
import { SegmentListsTableComponent } from './segment-lists-table/segment-lists-table.component';

@Component({
  selector: 'app-segment-lists-section-card',
  imports: [
    CommonModule,
    CommonSectionCardComponent,
    CommonSectionCardTitleHeaderComponent,
    CommonSectionCardActionButtonsComponent,
    SegmentListsTableComponent,
    TranslateModule,
  ],
  templateUrl: './segment-lists-section-card.component.html',
  styleUrl: './segment-lists-section-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SegmentListsSectionCardComponent {
  @Input() data: Segment;
  @Input() isSectionCardExpanded: boolean;
  permissions$: Observable<UserPermission>;
  tableRowCount$ = this.segmentsService.selectSegmentListsLength$;
  selectedSegment$ = this.segmentsService.selectedSegment$;
  subscriptions = new Subscription();

  menuButtonItems: IMenuButtonItem[] = [
    {
      label: 'segments.details.lists.menu-button.import-list.text',
      action: SEGMENT_LIST_ACTIONS.IMPORT,
      disabled: false,
    },
    {
      label: 'segments.details.lists.menu-button.export-lists.text',
      action: SEGMENT_LIST_ACTIONS.EXPORT_ALL,
      disabled: false,
    },
  ];

  constructor(
    private segmentsService: SegmentsService,
    private dialogService: DialogService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.permissions$ = this.authService.userPermissions$;
  }

  onAddListClick(appContext: string, segmentId: string) {
    this.dialogService.openAddListModal(appContext, segmentId);
  }

  onMenuButtonItemClick(event, segment: Segment) {
    switch (event) {
      case SEGMENT_LIST_ACTIONS.IMPORT:
        console.log('Import List');
        break;
      case SEGMENT_LIST_ACTIONS.EXPORT_ALL:
        this.onExportAllLists(segment);
        break;
      default:
        console.log('Unknown action');
    }
  }

  onExportAllLists(segment: Segment) {
    this.subscriptions.add(
      this.dialogService
        .openExportSegmentListsDesignModal()
        .afterClosed()
        .subscribe((isExportClicked: boolean) => {
          if (isExportClicked) {
            const subsegmentIds = segment.subSegments.map((subSegment) => subSegment.id);
            this.segmentsService.exportSegments(subsegmentIds);
          }
        })
    );
  }

  onSectionCardExpandChange(isSectionCardExpanded: boolean) {
    this.isSectionCardExpanded = isSectionCardExpanded;
  }

  onRowAction(event: ParticipantListRowActionEvent, segmentId: string): void {
    switch (event.action) {
      case PARTICIPANT_LIST_ROW_ACTION.EDIT:
        this.onEditList(event.rowData, segmentId);
        break;
      case PARTICIPANT_LIST_ROW_ACTION.DELETE:
        this.onDeleteList(event.rowData.segment);
        break;
    }
  }

  onEditList(rowData: ParticipantListTableRow, segmentId: string): void {
    this.dialogService.openEditListModal(rowData, rowData.segment.context, segmentId);
  }

  onDeleteList(segment: Segment): void {
    this.dialogService
      .openDeleteExcludeListModal(segment.name)
      .afterClosed()
      .subscribe((confirmClicked) => {
        if (confirmClicked) {
          this.segmentsService.deletePrivateSegmentList(segment.id, this.data.id);
        }
      });
  }

  onDestroy() {
    this.subscriptions.unsubscribe();
  }
}
