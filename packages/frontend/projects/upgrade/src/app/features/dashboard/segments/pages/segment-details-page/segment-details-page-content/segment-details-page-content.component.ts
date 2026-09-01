import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { CommonPageErrorComponent, CommonSectionCardListComponent } from '@shared-component-lib';
import {
  CommonPageErrorConfig,
  DetailsPageError,
} from '@shared-component-lib/common-page-error/common-page-error.model';
import { CommonModule } from '@angular/common';
import { SegmentOverviewDetailsSectionCardComponent } from './segment-overview-details-section-card/segment-overview-details-section-card.component';
import { SegmentListsSectionCardComponent } from './segment-lists-section-card/segment-lists-section-card.component';
import { SegmentUsedBySectionCardComponent } from './segment-used-by-section-card/segment-used-by-section-card.component';
import { SegmentsService } from '../../../../../../core/segments/segments.service';
import { Observable } from 'rxjs';
import { Segment } from '../../../../../../core/segments/store/segments.model';
import { SharedModule } from '../../../../../../shared/shared.module';

@Component({
  selector: 'app-segment-details-page-content',
  imports: [
    CommonModule,
    CommonPageErrorComponent,
    CommonSectionCardListComponent,
    SegmentOverviewDetailsSectionCardComponent,
    SegmentListsSectionCardComponent,
    SegmentUsedBySectionCardComponent,
    SharedModule,
  ],
  templateUrl: './segment-details-page-content.component.html',
  styleUrl: './segment-details-page-content.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SegmentDetailsPageContentComponent implements OnInit {
  isSectionCardExpanded = true;
  segment$: Observable<Segment>;
  detailsPageError$: Observable<DetailsPageError | null>;
  activeTabIndex = 0; // 0 for Lists, 1 for Used By

  readonly pageErrorConfig: CommonPageErrorConfig = {
    notFoundTitleKey: 'segments.details-page-error.not-found.title.text',
    notFoundSubtitleKey: 'segments.details-page-error.not-found.subtitle.text',
    loadFailedTitleKey: 'global.details-page-error.load-failed.title.text',
    loadFailedSubtitleKey: 'segments.details-page-error.load-failed.subtitle.text',
    backButtonKey: 'segments.details-page-error.back-button.text',
    backRoute: '/segments',
  };

  constructor(private segmentsService: SegmentsService) {}

  ngOnInit() {
    this.segment$ = this.segmentsService.selectedSegment$;
    this.detailsPageError$ = this.segmentsService.segmentDetailsPageError$;
    this.segmentsService.fetchAllSegmentListOptions();
  }

  onRetry(segmentId: string): void {
    this.segmentsService.fetchSegmentById(segmentId);
  }

  onSectionCardExpandChange(expanded: boolean) {
    this.isSectionCardExpanded = expanded;
  }

  onTabChange(tabIndex: number) {
    this.activeTabIndex = tabIndex;
  }
}
