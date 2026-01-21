import { ChangeDetectionStrategy, Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonTabbedSectionCardFooterComponent } from '../../../../../../../../shared-standalone-component-lib/components/common-tabbed-section-card-footer/common-tabbed-section-card-footer.component';

@Component({
  selector: 'app-experiment-overview-details-footer',
  imports: [CommonTabbedSectionCardFooterComponent],
  templateUrl: './experiment-overview-details-footer.component.html',
  styleUrl: './experiment-overview-details-footer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperimentOverviewDetailsFooterComponent implements OnInit {
  @Output() tabChange = new EventEmitter<number>();

  tabLabels = [
    { label: 'Design', disabled: false },
    { label: 'Data', disabled: false },
  ];

  onSelectedTabChange(selectedTabIndex: number): void {
    this.tabChange.emit(selectedTabIndex);
  }

  ngOnInit(): void {
    // Initialize with the first tab
  }
}
