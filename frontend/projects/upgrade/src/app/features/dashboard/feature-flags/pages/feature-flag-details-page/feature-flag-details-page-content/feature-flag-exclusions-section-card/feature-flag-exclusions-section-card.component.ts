import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonSectionCardComponent } from '../../../../../../../shared-standalone-component-lib/components';

@Component({
  selector: 'app-feature-flag-exclusions-section-card',
  standalone: true,
  imports: [CommonSectionCardComponent],
  templateUrl: './feature-flag-exclusions-section-card.component.html',
  styleUrl: './feature-flag-exclusions-section-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureFlagExclusionsSectionCardComponent {}
