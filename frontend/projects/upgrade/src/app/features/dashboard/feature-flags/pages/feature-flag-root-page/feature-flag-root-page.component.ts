import { Component } from '@angular/core';
import {
  CommonRootPageComponent,
  CommonSectionCardListComponent,
} from '../../../../../shared-standalone-component-lib/components';
import { FeatureFlagRootPageHeaderComponent } from './projected-components/feature-flag-root-page-header/feature-flag-root-page-header.component';
import { FeatureFlagRootSectionCardListComponent } from './projected-components/feature-flag-root-section-card-list/feature-flag-root-section-card-list.component';

@Component({
  selector: 'app-feature-flag-root-page',
  standalone: true,
  templateUrl: './feature-flag-root-page.component.html',
  styleUrl: './feature-flag-root-page.component.scss',
  imports: [
    CommonRootPageComponent,
    CommonSectionCardListComponent,
    FeatureFlagRootPageHeaderComponent,
    FeatureFlagRootSectionCardListComponent,
  ],
})
export class FeatureFlagRootPageComponent {}
