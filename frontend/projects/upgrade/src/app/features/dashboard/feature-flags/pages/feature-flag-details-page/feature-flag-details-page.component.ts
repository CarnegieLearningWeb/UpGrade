import { Component } from '@angular/core';
import { CommonPageComponent } from '../../../../../shared-standalone-component-lib/components';
import { FeatureFlagDetailsPageHeaderComponent } from './feature-flag-details-page-header/feature-flag-details-page-header.component';

@Component({
  selector: 'app-feature-flag-details-page',
  standalone: true,
  templateUrl: './feature-flag-details-page.component.html',
  styleUrl: './feature-flag-details-page.component.scss',
  imports: [CommonPageComponent, FeatureFlagDetailsPageHeaderComponent],
})
export class FeatureFlagDetailsPageComponent {}
