import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonDetailsPageHeaderContainerComponent } from '../../../../../../shared-standalone-component-lib/components/';

@Component({
  selector: 'app-feature-flag-details-page-header',
  standalone: true,
  imports: [CommonDetailsPageHeaderContainerComponent],
  templateUrl: './feature-flag-details-page-header.component.html',
  styleUrl: './feature-flag-details-page-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureFlagDetailsPageHeaderComponent {
  flagName = 'feature flag 1';
}
