import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import {
  CommonSectionCardComponent,
  CommonSectionCardTitleHeaderComponent,
  CommonSectionCardActionButtonsComponent,
} from '../../../../../../../shared-standalone-component-lib/components';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { SegmentsService } from '../../../../../../../core/segments/segments.service';
import { Segment } from '../../../../../../../core/segments/store/segments.model';
import { SegmentUsedByTableComponent } from './segment-used-by-table/segment-used-by-table.component';

@Component({
  selector: 'app-segment-used-by-section-card',
  imports: [
    CommonModule,
    CommonSectionCardComponent,
    CommonSectionCardTitleHeaderComponent,
    CommonSectionCardActionButtonsComponent,
    TranslateModule,
    SegmentUsedByTableComponent,
  ],
  templateUrl: './segment-used-by-section-card.component.html',
  styleUrl: './segment-used-by-section-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SegmentUsedBySectionCardComponent {
  @Input() data: Segment;
  @Input() isSectionCardExpanded: boolean;
  selectedSegment$ = this.segmentsService.selectedSegment$;

  constructor(private segmentsService: SegmentsService) {}

  onSectionCardExpandChange(isSectionCardExpanded: boolean) {
    this.isSectionCardExpanded = isSectionCardExpanded;
  }
}
