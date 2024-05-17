import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonSectionCardListComponent } from '../../../../../../shared-standalone-component-lib/components';

@Component({
  selector: 'app-feature-flag-details-page-content',
  standalone: true,
  imports: [CommonSectionCardListComponent],
  templateUrl: './feature-flag-details-page-content.component.html',
  styleUrl: './feature-flag-details-page-content.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureFlagDetailsPageContentComponent {}
