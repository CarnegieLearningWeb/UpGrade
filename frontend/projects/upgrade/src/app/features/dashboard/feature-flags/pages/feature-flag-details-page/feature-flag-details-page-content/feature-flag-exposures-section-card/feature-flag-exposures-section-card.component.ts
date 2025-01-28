import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import {
  CommonSectionCardActionButtonsComponent,
  CommonSectionCardComponent,
  CommonSectionCardTitleHeaderComponent,
} from '../../../../../../../shared-standalone-component-lib/components';
import { FeatureFlag } from '../../../../../../../core/feature-flags/store/feature-flags.model';
import { TranslateModule } from '@ngx-translate/core';
import { FeatureFlagExposuresDataComponent } from './feature-flag-exposures-data/feature-flag-exposures-data.component';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-feature-flag-exposures-section-card',
    imports: [
        CommonSectionCardComponent,
        CommonSectionCardTitleHeaderComponent,
        CommonSectionCardActionButtonsComponent,
        CommonModule,
        TranslateModule,
        FeatureFlagExposuresDataComponent,
    ],
    templateUrl: './feature-flag-exposures-section-card.component.html',
    styleUrl: './feature-flag-exposures-section-card.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeatureFlagExposuresSectionCardComponent {
  @Input() data: FeatureFlag;
  @Input() isSectionCardExpanded;

  onSectionCardExpandChange(isSectionCardExpanded: boolean) {
    this.isSectionCardExpanded = isSectionCardExpanded;
  }
}
