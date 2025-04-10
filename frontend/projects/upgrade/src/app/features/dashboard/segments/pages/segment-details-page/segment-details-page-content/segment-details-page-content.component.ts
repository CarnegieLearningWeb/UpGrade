import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { CommonSectionCardListComponent } from '../../../../../../shared-standalone-component-lib/components';
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
  activeTabIndex = 0; // 0 for Lists, 1 for Used By

  constructor(private segmentsService: SegmentsService) {}

  ngOnInit() {
    this.segment$ = this.segmentsService.selectedSegment$;
  }

  onSectionCardExpandChange(expanded: boolean) {
    this.isSectionCardExpanded = expanded;
  }

  onTabChange(tabIndex: number) {
    this.activeTabIndex = tabIndex;
  }
}
