import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonSectionCardComponent } from '../../../../../../../shared-standalone-component-lib/components';
import { FeatureFlag } from '../../../../../../../core/feature-flags/store/feature-flags.model';

@Component({
  selector: 'app-feature-flag-exposures-section-card',
  standalone: true,
  imports: [CommonSectionCardComponent],
  templateUrl: './feature-flag-exposures-section-card.component.html',
  styleUrl: './feature-flag-exposures-section-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureFlagExposuresSectionCardComponent {
  @Input() data: FeatureFlag;
}
