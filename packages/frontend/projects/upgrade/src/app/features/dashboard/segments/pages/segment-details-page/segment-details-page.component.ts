// segment-details-page.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonPageComponent } from '../../../../../shared-standalone-component-lib/components';
import { SegmentDetailsPageHeaderComponent } from './segment-details-page-header/segment-details-page-header.component';
import { SegmentDetailsPageContentComponent } from './segment-details-page-content/segment-details-page-content.component';
import { SegmentsModule } from '../../../segments-legacy/segments.module';
import { SegmentsService } from '../../../../../core/segments/segments.service';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Segment } from '../../../../../core/segments/store/segments.model';
import { combineLatest, Observable, Subscription } from 'rxjs';
import { filter, map, startWith } from 'rxjs/operators';
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

  constructor(private segmentsService: SegmentsService, private router: Router, private route: ActivatedRoute) {}

  ngOnInit() {
    const segmentIdFromRoute$ = this.route.paramMap.pipe(
      map((params) => params.get('segmentId')),
      filter((segmentId) => !!segmentId)
    );

    const navigationComplete$ = this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      startWith(null)
    );

    // Combine both observables to ensure we only fetch after navigation completes
    // This will ensure no weird router behavior when navigating back and forth
    const segmentId$ = combineLatest([segmentIdFromRoute$, navigationComplete$]).pipe(map(([segmentId]) => segmentId));

    this.segmentIdSub = segmentId$.subscribe((segmentId) => {
      this.segmentsService.fetchSegmentById(segmentId);
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
