import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { CommonTabbedSectionCardFooterComponent } from '../../../../../../../../shared-standalone-component-lib/components/common-tabbed-section-card-footer/common-tabbed-section-card-footer.component';
import { FeatureFlagsService } from '../../../../../../../../core/feature-flags/feature-flags.service';

@Component({
  selector: 'app-feature-flag-overview-details-footer',
  imports: [CommonTabbedSectionCardFooterComponent],
  templateUrl: './feature-flag-overview-details-footer.component.html',
  styleUrl: './feature-flag-overview-details-footer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureFlagOverviewDetailsFooterComponent implements OnInit {
  tabLabels = [
    { label: 'Participants', disabled: false },
    { label: 'Data', disabled: true }, // Disabled because the Exposures section card is not implemented yet
  ];

  constructor(private featureFlagsService: FeatureFlagsService) {}

  onSelectedTabChange(selectedTabIndex: number): void {
    this.featureFlagsService.setActiveDetailsTab(selectedTabIndex);
  }

  ngOnInit(): void {
    this.featureFlagsService.setActiveDetailsTab(0);
  }
}
