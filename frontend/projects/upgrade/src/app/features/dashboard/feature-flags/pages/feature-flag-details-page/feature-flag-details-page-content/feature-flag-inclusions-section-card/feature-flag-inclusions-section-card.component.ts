import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonSectionCardComponent } from '../../../../../../../shared-standalone-component-lib/components';

@Component({
  selector: 'app-feature-flag-inclusions-section-card',
  standalone: true,
  imports: [CommonSectionCardComponent],
  templateUrl: './feature-flag-inclusions-section-card.component.html',
  styleUrl: './feature-flag-inclusions-section-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureFlagInclusionsSectionCardComponent {}
