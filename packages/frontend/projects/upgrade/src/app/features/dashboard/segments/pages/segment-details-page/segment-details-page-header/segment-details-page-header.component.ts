import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonDetailsPageHeaderComponent } from '../../../../../../shared-standalone-component-lib/components';
import { SegmentsService } from '../../../../../../core/segments/segments.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-segment-details-page-header',
  imports: [CommonDetailsPageHeaderComponent, CommonModule],
  templateUrl: './segment-details-page-header.component.html',
  styleUrl: './segment-details-page-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SegmentDetailsPageHeaderComponent {
  selectedSegment$ = this.segmentsService.selectedSegment$;

  constructor(private segmentsService: SegmentsService) {}
}
