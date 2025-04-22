import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonTabbedSectionCardFooterComponent } from '../../../../../../../../shared-standalone-component-lib/components/common-tabbed-section-card-footer/common-tabbed-section-card-footer.component';
import { Segment } from '../../../../../../../../core/segments/store/segments.model';
import { SEGMENT_TYPE } from 'upgrade_types';

@Component({
  selector: 'app-segment-overview-details-footer',
  imports: [CommonTabbedSectionCardFooterComponent],
  templateUrl: './segment-overview-details-footer.component.html',
  styleUrl: './segment-overview-details-footer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SegmentOverviewDetailsFooterComponent implements OnInit {
  @Input() segment: Segment;
  tabLabels = ['Lists', 'Used By'];
  @Output() tabChange = new EventEmitter<number>();

  ngOnInit(): void {
    if (this.segment?.type === SEGMENT_TYPE.GLOBAL_EXCLUDE) {
      this.tabLabels = ['Exclude Lists'];
    }
    // Initialize to the first tab (Lists)
    this.tabChange.emit(0);
  }

  onSelectedTabChange(selectedTabIndex: number): void {
    this.tabChange.emit(selectedTabIndex);
  }
}
