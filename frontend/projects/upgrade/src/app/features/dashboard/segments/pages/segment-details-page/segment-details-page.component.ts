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
    this.shouldUseLegacyView$ = this.segmentsService.shouldUseLegacyView$;
  }

  ngOnDestroy() {
    if (this.segmentIdSub) {
      this.segmentIdSub.unsubscribe();
    }
  }
}
