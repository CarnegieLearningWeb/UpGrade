import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonDetailsPageHeaderComponent } from '../../../../../../shared-standalone-component-lib/components';
import { FeatureFlagsService } from '../../../../../../core/feature-flags/feature-flags.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-feature-flag-details-page-header',
  standalone: true,
  imports: [CommonDetailsPageHeaderComponent, CommonModule],
  templateUrl: './feature-flag-details-page-header.component.html',
  styleUrl: './feature-flag-details-page-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureFlagDetailsPageHeaderComponent {
  selectedFeatureFlag$ = this.featureFlagService.selectedFeatureFlag$;

  constructor(private featureFlagService: FeatureFlagsService) {}
}
