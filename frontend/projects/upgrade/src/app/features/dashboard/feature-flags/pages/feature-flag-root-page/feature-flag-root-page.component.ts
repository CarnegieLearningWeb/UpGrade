import { Component } from '@angular/core';
import { CommonRootPageComponent } from '../../../../../shared-standalone-component-lib/components';
import { FeatureFlagRootPageHeaderComponent } from './feature-flag-root-page-header/feature-flag-root-page-header.component';
import { FeatureFlagOverviewSectionCardComponent } from './feature-flag-overview-section-card/feature-flag-overview-section-card.component';

@Component({
  selector: 'app-feature-flag-root-page',
  standalone: true,
  imports: [CommonRootPageComponent, FeatureFlagRootPageHeaderComponent, FeatureFlagOverviewSectionCardComponent],
  templateUrl: './feature-flag-root-page.component.html',
  styleUrl: './feature-flag-root-page.component.scss',
})
export class FeatureFlagRootPageComponent {}
