import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonRootPageHeaderComponent } from '../../../../../../shared-standalone-component-lib/components';

@Component({
    selector: 'app-feature-flag-root-page-header',
    imports: [CommonRootPageHeaderComponent],
    templateUrl: './feature-flag-root-page-header.component.html',
    styleUrl: './feature-flag-root-page-header.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeatureFlagRootPageHeaderComponent {}
