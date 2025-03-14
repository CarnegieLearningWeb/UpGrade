import { ChangeDetectionStrategy, Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonTabbedSectionCardFooterComponent } from '../../../../../../../../shared-standalone-component-lib/components/common-tabbed-section-card-footer/common-tabbed-section-card-footer.component';

@Component({
  selector: 'app-segment-overview-details-footer',
  imports: [CommonTabbedSectionCardFooterComponent],
  templateUrl: './segment-overview-details-footer.component.html',
  styleUrl: './segment-overview-details-footer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SegmentOverviewDetailsFooterComponent implements OnInit {
  tabLabels = ['Lists', 'Used By'];
  @Output() tabChange = new EventEmitter<number>();

  ngOnInit(): void {
    // Initialize to the first tab (Lists)
    this.tabChange.emit(0);
  }

  onSelectedTabChange(selectedTabIndex: number): void {
    this.tabChange.emit(selectedTabIndex);
  }
}
