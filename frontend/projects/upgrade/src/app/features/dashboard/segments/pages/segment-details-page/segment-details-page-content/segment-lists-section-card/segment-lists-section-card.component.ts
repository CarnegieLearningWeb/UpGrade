import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import {
  CommonSectionCardComponent,
  CommonSectionCardTitleHeaderComponent,
  CommonSectionCardActionButtonsComponent,
} from '../../../../../../../shared-standalone-component-lib/components';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { IMenuButtonItem, SEGMENT_TYPE } from 'upgrade_types';
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
  title = '';
  subtitle = '';
  buttonText = '';

  menuButtonItems: IMenuButtonItem[] = [
    {
      label: '',
      action: SEGMENT_LIST_ACTIONS.IMPORT,
      disabled: false,
    },
    {
      label: '',
      action: SEGMENT_LIST_ACTIONS.EXPORT_ALL,
      disabled: false,
    },
  ];

  constructor(
    private segmentsService: SegmentsService,
    private dialogService: DialogService,
    private authService: AuthService
  ) {}

  private segmentTypeConfig = {
    [SEGMENT_TYPE.GLOBAL_EXCLUDE]: {
      title: 'segments.details.lists.card.title.global-excludes.text',
      subtitle: 'segments.details.lists.card.subtitle.global-excludes.text',
      buttonText: 'segments.details.add-exclude-list.button.text',
      importLabel: 'segments.details.lists.menu-button.import-exclude-list.text',
      exportLabel: 'segments.details.lists.menu-button.export-exclude-lists.text',
    },
    [SEGMENT_TYPE.PUBLIC]: {
      title: 'segments.details.lists.card.title.text',
      subtitle: 'segments.details.lists.card.subtitle.text',
      buttonText: 'segments.details.add-list.button.text',
      importLabel: 'segments.details.lists.menu-button.import-list.text',
      exportLabel: 'segments.details.lists.menu-button.export-lists.text',
    },
  };

  ngOnInit() {
    this.permissions$ = this.authService.userPermissions$;
    this.configureUiForSegmentType();
  }

  private configureUiForSegmentType(): void {
    const config = this.segmentTypeConfig[this.data.type];
    this.title = config.title;
    this.subtitle = config.subtitle;
    this.buttonText = config.buttonText;
    this.menuButtonItems[0].label = config.importLabel;
    this.menuButtonItems[1].label = config.exportLabel;
  }

  onAddListClick(appContext: string, segmentId: string) {
    this.dialogService.openAddListModal(appContext, segmentId, this.data.type);
  }

  onMenuButtonItemClick(event, segment: Segment) {
    switch (event) {
      case SEGMENT_LIST_ACTIONS.IMPORT:
        this.onImportList(segment.id);
        break;
      case SEGMENT_LIST_ACTIONS.EXPORT_ALL:
        this.onExportAllLists(segment);
        break;
      default:
        console.log('Unknown action');
    }
  }

  onImportList(segmentId: string) {
    this.dialogService
      .openImportSegmentListModal(segmentId, this.data.type)
      .afterClosed()
      .subscribe(() => this.segmentsService.fetchSegmentById(segmentId));
  }

  onExportAllLists(segment: Segment) {
    this.subscriptions.add(
      this.dialogService
        .openExportSegmentListsDesignModal(this.data.type)
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
    this.dialogService.openEditListModal(rowData, rowData.segment.context, segmentId, this.data.type);
  }

  onDeleteList(segment: Segment): void {
    this.dialogService
      .openDeleteListModal(segment.name, this.data.type)
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
