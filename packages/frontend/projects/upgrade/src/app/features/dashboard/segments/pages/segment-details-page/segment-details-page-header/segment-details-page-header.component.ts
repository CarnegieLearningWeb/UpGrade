import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonDetailsPageHeaderComponent } from '@shared-component-lib';
import { SegmentsService } from '../../../../../../core/segments/segments.service';
import { CommonModule } from '@angular/common';
import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-segment-details-page-header',
  imports: [CommonDetailsPageHeaderComponent, CommonModule],
  templateUrl: './segment-details-page-header.component.html',
  styleUrl: './segment-details-page-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SegmentDetailsPageHeaderComponent {
  // Suppress the cached segment name while the details page shows its error state,
  // so the breadcrumb doesn't display a stale name next to "not found"
  detailsName$: Observable<string> = combineLatest([
    this.segmentsService.selectedSegment$,
    this.segmentsService.segmentDetailsPageError$,
  ]).pipe(map(([segment, detailsPageError]) => (detailsPageError ? '' : segment?.name ?? '')));

  constructor(private segmentsService: SegmentsService) {}
}
