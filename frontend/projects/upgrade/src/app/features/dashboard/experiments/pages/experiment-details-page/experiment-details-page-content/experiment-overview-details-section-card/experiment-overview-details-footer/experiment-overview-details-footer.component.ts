import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { CommonTabbedSectionCardFooterComponent } from '../../../../../../../../shared-standalone-component-lib/components/common-tabbed-section-card-footer/common-tabbed-section-card-footer.component';
import { ExperimentService } from '../../../../../../../../core/experiments/experiments.service';

@Component({
  selector: 'app-experiment-overview-details-footer',
  imports: [CommonTabbedSectionCardFooterComponent],
  templateUrl: './experiment-overview-details-footer.component.html',
  styleUrl: './experiment-overview-details-footer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperimentOverviewDetailsFooterComponent implements OnInit {
  tabLabels = ['Design', 'Data'];

  constructor(private experimentService: ExperimentService) {}

  onSelectedTabChange(selectedTabIndex: number): void {
    // this.experimentService.setActiveDetailsTab(selectedTabIndex);
  }

  ngOnInit(): void {
    // this.experimentService.setActiveDetailsTab(0);
  }
}
