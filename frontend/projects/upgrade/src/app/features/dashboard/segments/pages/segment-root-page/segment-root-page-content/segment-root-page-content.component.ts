import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonSectionCardListComponent } from '../../../../../../shared-standalone-component-lib/components';
import { SegmentRootSectionCardComponent } from './segment-root-section-card/segment-root-section-card.component';
import { SegmentGlobalSectionCardComponent } from './segment-global-section-card/segment-global-section-card.component';

@Component({
  selector: 'app-segment-root-page-content',
  imports: [CommonSectionCardListComponent, SegmentRootSectionCardComponent, SegmentGlobalSectionCardComponent],
  templateUrl: './segment-root-page-content.component.html',
  styleUrl: './segment-root-page-content.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SegmentRootPageContentComponent {}
