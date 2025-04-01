import { ChangeDetectionStrategy, Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import {
  CommonSectionCardActionButtonsComponent,
  CommonSectionCardComponent,
  CommonSectionCardTitleHeaderComponent,
  CommonSectionCardOverviewDetailsComponent,
} from '../../../../../../../shared-standalone-component-lib/components';
import { Segment, SEGMENT_DETAILS_PAGE_ACTIONS } from '../../../../../../../core/segments/store/segments.model';
import { SEGMENT_STATUS, SEGMENT_SEARCH_KEY, IMenuButtonItem } from 'upgrade_types';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { SegmentOverviewDetailsFooterComponent } from './segment-overview-details-footer/segment-overview-details-footer.component';
import { Router } from '@angular/router';
import { combineLatest, map, Observable, Subscription } from 'rxjs';
import { UserPermission } from '../../../../../../../core/auth/store/auth.models';
import { AuthService } from '../../../../../../../core/auth/auth.service';
import { DialogService } from '../../../../../../../shared/services/common-dialog.service';
import { SegmentsService } from '../../../../../../../core/segments/segments.service';

@Component({
  selector: 'app-segment-overview-details-section-card',
  imports: [
    CommonModule,
    CommonSectionCardComponent,
    CommonSectionCardTitleHeaderComponent,
    CommonSectionCardActionButtonsComponent,
    CommonSectionCardOverviewDetailsComponent,
    SegmentOverviewDetailsFooterComponent,
    TranslateModule,
  ],
  templateUrl: './segment-overview-details-section-card.component.html',
  styleUrl: './segment-overview-details-section-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SegmentOverviewDetailsSectionCardComponent implements OnInit, OnDestroy {
  @Output() sectionCardExpandChange = new EventEmitter<boolean>();
  @Output() tabChange = new EventEmitter<number>();
  permissions$: Observable<UserPermission> = this.authService.userPermissions$;
  segment$ = this.segmentsService.selectedSegment$;
  segmentAndPermissions$: Observable<{ segment: Segment; permissions: UserPermission }> = combineLatest([
    this.segment$,
    this.permissions$,
  ]).pipe(map(([segment, permissions]) => ({ segment, permissions })));

  subscriptions = new Subscription();
  segmentOverviewDetails$ = this.segmentsService.selectedSegmentOverviewDetails;
  menuButtonItems$: Observable<IMenuButtonItem[]>;
  isSectionCardExpanded = true;

  constructor(
    private dialogService: DialogService,
    private segmentsService: SegmentsService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.menuButtonItems$ = this.segmentAndPermissions$.pipe(
      map(({ segment, permissions }) => [
        {
          label: 'segments.details.menu-button.edit-segment.text',
          action: SEGMENT_DETAILS_PAGE_ACTIONS.EDIT,
          disabled: !permissions?.segments?.update,
        },
        {
          label: 'segments.details.menu-button.duplicate-segment.text',
          action: SEGMENT_DETAILS_PAGE_ACTIONS.DUPLICATE,
          disabled: !permissions?.segments?.create,
        },
        {
          label: 'segments.details.menu-button.export-segment-design.text',
          action: SEGMENT_DETAILS_PAGE_ACTIONS.EXPORT,
          disabled: false,
        },
        {
          label: 'segments.details.menu-button.delete-segment.text',
          action: SEGMENT_DETAILS_PAGE_ACTIONS.DELETE,
          disabled:
            !permissions?.segments?.delete || [SEGMENT_STATUS.USED, SEGMENT_STATUS.GLOBAL].includes(segment?.status),
        },
      ])
    );
  }

  onMenuButtonItemClick(action: SEGMENT_DETAILS_PAGE_ACTIONS, segment: Segment) {
    switch (action) {
      case SEGMENT_DETAILS_PAGE_ACTIONS.EDIT:
        // this.dialogService.openEditSegmentModal(segment);
        break;
      case SEGMENT_DETAILS_PAGE_ACTIONS.DUPLICATE:
        // this.dialogService.openDuplicateSegmentModal(segment);
        break;
      case SEGMENT_DETAILS_PAGE_ACTIONS.DELETE:
        // this.dialogService.openDeleteSegmentModal(segment);
        break;
      case SEGMENT_DETAILS_PAGE_ACTIONS.EXPORT:
        // this.dialogService.openExportSegmentModal(segment.id);
        break;
      default:
        console.log('Unknown action');
    }
  }

  onSectionCardExpandChange(isSectionCardExpanded: boolean) {
    this.isSectionCardExpanded = isSectionCardExpanded;
    this.sectionCardExpandChange.emit(this.isSectionCardExpanded);
  }

  filterSegmentsByChips(tagValue: string) {
    this.segmentsService.setSearchKey(SEGMENT_SEARCH_KEY.TAG);
    this.segmentsService.setSearchString(tagValue);
    this.router.navigate(['/segments']);
  }

  onSelectedTabChange(tabIndex: number) {
    this.tabChange.emit(tabIndex);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
