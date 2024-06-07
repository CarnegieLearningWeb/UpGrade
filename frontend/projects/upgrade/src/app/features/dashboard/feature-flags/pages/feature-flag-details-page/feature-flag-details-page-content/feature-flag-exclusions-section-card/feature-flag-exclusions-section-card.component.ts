import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import {
  CommonSectionCardComponent,
  CommonSectionCardTitleHeaderComponent,
} from '../../../../../../../shared-standalone-component-lib/components';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { FeatureFlag } from '../../../../../../../core/feature-flags/store/feature-flags.model';

@Component({
  selector: 'app-feature-flag-exclusions-section-card',
  standalone: true,
  imports: [CommonSectionCardComponent, CommonSectionCardTitleHeaderComponent, CommonModule, TranslateModule],
  templateUrl: './feature-flag-exclusions-section-card.component.html',
  styleUrl: './feature-flag-exclusions-section-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureFlagExclusionsSectionCardComponent {
  @Input() data: FeatureFlag;
  tableRowCount$ = of(1);
}
