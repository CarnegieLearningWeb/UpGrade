import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonSectionCardComponent } from '../../../../../../shared-standalone-component-lib/components/common-section-card/common-section-card.component';
import { FeatureFlagOverviewSectionCardHeaderContainerComponent } from './feature-flag-overview-section-card-header-container/feature-flag-overview-section-card-header-container.component';
import { FeatureFlagOverviewSectionCardContentContainerComponent } from './feature-flag-overview-section-card-content-container/feature-flag-overview-section-card-content-container.component';

@Component({
  selector: 'app-feature-flag-overview-section-card',
  standalone: true,
  templateUrl: './feature-flag-overview-section-card.component.html',
  styleUrl: './feature-flag-overview-section-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonSectionCardComponent,
    FeatureFlagOverviewSectionCardHeaderContainerComponent,
    FeatureFlagOverviewSectionCardContentContainerComponent,
  ],
})
export class FeatureFlagOverviewSectionCardComponent {}
