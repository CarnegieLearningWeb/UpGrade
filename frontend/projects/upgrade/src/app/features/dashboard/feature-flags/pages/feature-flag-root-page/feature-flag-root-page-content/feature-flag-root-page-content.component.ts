import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonSectionCardComponent } from '../../../../../../shared-standalone-component-lib/components';

@Component({
  selector: 'app-feature-flag-root-page-content',
  standalone: true,
  imports: [CommonSectionCardComponent],
  templateUrl: './feature-flag-root-page-content.component.html',
  styleUrl: './feature-flag-root-page-content.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureFlagRootPageContentComponent {}
