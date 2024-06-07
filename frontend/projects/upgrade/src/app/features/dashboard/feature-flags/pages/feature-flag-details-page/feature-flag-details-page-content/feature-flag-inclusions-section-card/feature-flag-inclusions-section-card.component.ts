import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import {
  CommonSectionCardComponent,
  CommonSectionCardTitleHeaderComponent,
} from '../../../../../../../shared-standalone-component-lib/components';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { of } from 'rxjs';
import { FeatureFlag } from '../../../../../../../core/feature-flags/store/feature-flags.model';

@Component({
  selector: 'app-feature-flag-inclusions-section-card',
  standalone: true,
  imports: [CommonSectionCardComponent, CommonSectionCardTitleHeaderComponent, CommonModule, TranslateModule],
  templateUrl: './feature-flag-inclusions-section-card.component.html',
  styleUrl: './feature-flag-inclusions-section-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureFlagInclusionsSectionCardComponent {
  @Input() data: FeatureFlag;
  tableRowCount$ = of(1);
}
