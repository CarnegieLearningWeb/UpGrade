// segment-details-page.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonPageComponent } from '../../../../../shared-standalone-component-lib/components';
import { SegmentDetailsPageHeaderComponent } from './segment-details-page-header/segment-details-page-header.component';
import { SegmentDetailsPageContentComponent } from './segment-details-page-content/segment-details-page-content.component';
import { SegmentsModule } from '../../../segments-legacy/segments.module';
import { SegmentsService } from '../../../../../core/segments/segments.service';
import { ActivatedRoute } from '@angular/router';
import { Segment } from '../../../../../core/segments/store/segments.model';
import { SEGMENT_TYPE } from 'upgrade_types';
import { Observable, Subscription } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-segment-details-page',
  templateUrl: './segment-details-page.component.html',
  styleUrl: './segment-details-page.component.scss',
  imports: [
    CommonModule,
    CommonPageComponent,
    SegmentDetailsPageHeaderComponent,
    SegmentDetailsPageContentComponent,
    SegmentsModule,
  ],
})
export class SegmentDetailsPageComponent implements OnInit, OnDestroy {
  segment$: Observable<Segment>;
  segmentIdSub: Subscription;
  shouldUseLegacyView$: Observable<boolean>;

  constructor(private segmentsService: SegmentsService, private route: ActivatedRoute) {}

  ngOnInit() {
    this.segmentIdSub = this.route.paramMap.subscribe((params) => {
      const segmentId = params.get('segmentId');
      if (segmentId) {
        this.segmentsService.fetchSegmentById(segmentId);
      }
    });

    this.segment$ = this.segmentsService.selectedSegment$;

    // Determine if we should use the legacy view based on segment structure
    this.shouldUseLegacyView$ = this.segment$.pipe(map((segment) => this.shouldUseLegacyUI(segment)));
  }

  // Logic to determine if we should use the legacy UI
  private shouldUseLegacyUI(segment: Segment): boolean {
    if (segment.type === SEGMENT_TYPE.PUBLIC) {
      // Check if the segment has individuals, groups, or non-private subsegments
      const hasIndividuals = segment.individualForSegment?.length > 0;
      const hasGroups = segment.groupForSegment?.length > 0;

      // Filter for non-private subsegments
      const hasNonPrivateSubsegments = segment.subSegments?.some(
        (subsegment) => subsegment.type !== SEGMENT_TYPE.PRIVATE
      );

      return hasIndividuals || hasGroups || hasNonPrivateSubsegments;
    }
    return false;
  }

  ngOnDestroy() {
    if (this.segmentIdSub) {
      this.segmentIdSub.unsubscribe();
    }
  }
}
