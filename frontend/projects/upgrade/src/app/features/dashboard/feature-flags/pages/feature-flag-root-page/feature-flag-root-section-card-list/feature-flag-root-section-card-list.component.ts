import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FeatureFlagRootTableSectionCardComponent } from './feature-flag-root-table-section-card/feature-flag-root-table-section-card.component';
import { CommonSectionCardListComponent } from '../../../../../../shared-standalone-component-lib/components';

@Component({
  selector: 'app-feature-flag-root-section-card-list',
  standalone: true,
  templateUrl: './feature-flag-root-section-card-list.component.html',
  styleUrl: './feature-flag-root-section-card-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonSectionCardListComponent, FeatureFlagRootTableSectionCardComponent],
})
export class FeatureFlagRootSectionCardListComponent {}
