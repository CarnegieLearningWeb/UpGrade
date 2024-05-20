import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonDetailsPageHeaderComponent } from '../../../../../../shared-standalone-component-lib/components';

@Component({
  selector: 'app-feature-flag-details-page-header',
  standalone: true,
  imports: [CommonDetailsPageHeaderComponent],
  templateUrl: './feature-flag-details-page-header.component.html',
  styleUrl: './feature-flag-details-page-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureFlagDetailsPageHeaderComponent {
  flagName = 'feature flag 1';
}
