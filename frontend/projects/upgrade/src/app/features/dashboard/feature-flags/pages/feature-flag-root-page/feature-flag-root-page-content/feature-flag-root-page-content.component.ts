import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonSectionCardListComponent } from '../../../../../../shared-standalone-component-lib/components';
import { FeatureFlagRootSectionCardComponent } from './feature-flag-root-section-card/feature-flag-root-section-card.component';

@Component({
  selector: 'app-feature-flag-root-page-content',
  imports: [CommonSectionCardListComponent, FeatureFlagRootSectionCardComponent],
  templateUrl: './feature-flag-root-page-content.component.html',
  styleUrl: './feature-flag-root-page-content.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureFlagRootPageContentComponent {}
