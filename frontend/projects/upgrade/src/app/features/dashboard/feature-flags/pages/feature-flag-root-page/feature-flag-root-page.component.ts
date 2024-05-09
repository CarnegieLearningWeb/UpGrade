import { Component } from '@angular/core';
import { CommonRootPageComponent } from '../../../../../shared-standalone-component-lib/components';
import { FeatureFlagRootPageHeaderComponent } from './feature-flag-root-page-header/feature-flag-root-page-header.component';
import { FeatureFlagRootPageContentComponent } from './feature-flag-root-page-content/feature-flag-root-page-content.component';

@Component({
  selector: 'app-feature-flag-root-page',
  standalone: true,
  templateUrl: './feature-flag-root-page.component.html',
  styleUrl: './feature-flag-root-page.component.scss',
  imports: [CommonRootPageComponent, FeatureFlagRootPageHeaderComponent, FeatureFlagRootPageContentComponent],
})
export class FeatureFlagRootPageComponent {}
