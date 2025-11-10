import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output, SimpleChanges } from '@angular/core';
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
  selectedIndex = 0;
  tabLabels = [
    { label: 'Lists', disabled: false },
    { label: 'Used By', disabled: false },
  ];
  @Output() tabChange = new EventEmitter<number>();

  ngOnInit(): void {
    this.resetTabs();
  }

  ngOnChanges(): void {
    this.resetTabs();
  }

  private resetTabs(): void {
    if (this.segment?.type === SEGMENT_TYPE.GLOBAL_EXCLUDE) {
      this.tabLabels = [{ label: 'Exclude Lists', disabled: false }];
    }
    // Reset the selected index to the first tab
    this.onSelectedTabChange(0);
  }

  onSelectedTabChange(selectedTabIndex: number): void {
    this.selectedIndex = selectedTabIndex; // Update the selected index
    this.tabChange.emit(selectedTabIndex);
  }
}
