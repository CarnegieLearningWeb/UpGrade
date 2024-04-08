import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonSectionCardComponent } from '../../../../../../../../../shared-standalone-component-lib/components/common-section-card/common-section-card.component';
import { FeatureFlagRootTableSectionCardHeaderContainerComponent } from './projected-components/feature-flag-root-table-section-card-header-container/feature-flag-root-table-section-card-header-container.component';
import { FeatureFlagRootTableSectionCardContentContainerComponent } from './projected-components/feature-flag-root-table-section-card-content-container/feature-flag-root-table-section-card-content-container.component';

@Component({
  selector: 'app-feature-flag-root-table-section-card',
  standalone: true,
  templateUrl: './feature-flag-root-table-section-card.component.html',
  styleUrl: './feature-flag-root-table-section-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonSectionCardComponent,
    FeatureFlagRootTableSectionCardHeaderContainerComponent,
    FeatureFlagRootTableSectionCardContentContainerComponent,
  ],
})
export class FeatureFlagRootTableSectionCardComponent {}
