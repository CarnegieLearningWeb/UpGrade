import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonSectionCardComponent } from '../../../../../../shared-standalone-component-lib/components/common-section-card/common-section-card.component';

@Component({
  selector: 'app-feature-flag-details-page-content',
  standalone: true,
  imports: [CommonSectionCardComponent],
  templateUrl: './feature-flag-details-page-content.component.html',
  styleUrl: './feature-flag-details-page-content.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureFlagDetailsPageContentComponent {}
