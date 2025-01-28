import { Component } from '@angular/core';
import { CommonPageComponent } from '../../../../../shared-standalone-component-lib/components';
import { FeatureFlagDetailsPageHeaderComponent } from './feature-flag-details-page-header/feature-flag-details-page-header.component';
import { FeatureFlagDetailsPageContentComponent } from './feature-flag-details-page-content/feature-flag-details-page-content.component';

@Component({
    selector: 'app-feature-flag-details-page',
    templateUrl: './feature-flag-details-page.component.html',
    styleUrl: './feature-flag-details-page.component.scss',
    imports: [CommonPageComponent, FeatureFlagDetailsPageHeaderComponent, FeatureFlagDetailsPageContentComponent]
})
export class FeatureFlagDetailsPageComponent {}
