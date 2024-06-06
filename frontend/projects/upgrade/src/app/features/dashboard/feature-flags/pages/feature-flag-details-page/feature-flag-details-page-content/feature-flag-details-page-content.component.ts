import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonSectionCardListComponent } from '../../../../../../shared-standalone-component-lib/components';
import { CommonModule } from '@angular/common';
import { FeatureFlagInclusionsSectionCardComponent } from './feature-flag-inclusions-section-card/feature-flag-inclusions-section-card.component';
import { FeatureFlagExclusionsSectionCardComponent } from './feature-flag-exclusions-section-card/feature-flag-exclusions-section-card.component';
import { FeatureFlagExposuresSectionCardComponent } from './feature-flag-exposures-section-card/feature-flag-exposures-section-card.component';
import { FeatureFlagOverviewDetailsSectionCardComponent } from './feature-flag-overview-details-section-card/feature-flag-overview-details-section-card.component';
import { FeatureFlagsService } from '../../../../../../core/feature-flags/feature-flags.service';

@Component({
  selector: 'app-feature-flag-details-page-content',
  standalone: true,
  imports: [
    CommonModule,
    CommonSectionCardListComponent,
    FeatureFlagInclusionsSectionCardComponent,
    FeatureFlagExclusionsSectionCardComponent,
    FeatureFlagExposuresSectionCardComponent,
    FeatureFlagOverviewDetailsSectionCardComponent,
  ],
  templateUrl: './feature-flag-details-page-content.component.html',
  styleUrl: './feature-flag-details-page-content.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureFlagDetailsPageContentComponent {
  activeTabIndex$ = this.featureFlagsService.activeDetailsTabIndex$;

  constructor(private featureFlagsService: FeatureFlagsService) {
    console.log('in the ff content component');
    this.activeTabIndex$.subscribe((activeTabIndex) => {
      console.log('activeTabIndex', activeTabIndex);
    });
  }
}
