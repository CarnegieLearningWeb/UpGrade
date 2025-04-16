// segment-details-page.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonPageComponent } from '../../../../../shared-standalone-component-lib/components';
import { SegmentDetailsPageHeaderComponent } from './segment-details-page-header/segment-details-page-header.component';
import { SegmentDetailsPageContentComponent } from './segment-details-page-content/segment-details-page-content.component';
import { SegmentsModule } from '../../../segments-legacy/segments.module';
import { SegmentsService } from '../../../../../core/segments/segments.service';
import { Observable } from 'rxjs';
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
export class SegmentDetailsPageComponent implements OnInit {
  shouldUseLegacyView$: Observable<boolean>;

  constructor(private segmentsService: SegmentsService) {}

  ngOnInit() {
    this.shouldUseLegacyView$ = this.segmentsService.shouldUseLegacyView$;
  }
}
