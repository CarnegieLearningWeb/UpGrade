import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonSectionCardComponent } from '../../../../../../../shared-standalone-component-lib/components';

@Component({
  selector: 'app-feature-flag-exposures-section-card',
  standalone: true,
  imports: [CommonSectionCardComponent],
  templateUrl: './feature-flag-exposures-section-card.component.html',
  styleUrl: './feature-flag-exposures-section-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureFlagExposuresSectionCardComponent {}
