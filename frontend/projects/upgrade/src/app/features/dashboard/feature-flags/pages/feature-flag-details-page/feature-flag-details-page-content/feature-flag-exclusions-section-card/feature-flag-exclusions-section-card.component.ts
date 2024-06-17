import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import {
  CommonSectionCardActionButtonsComponent,
  CommonSectionCardComponent,
  CommonSectionCardTitleHeaderComponent,
} from '../../../../../../../shared-standalone-component-lib/components';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { FeatureFlag } from '../../../../../../../core/feature-flags/store/feature-flags.model';
import { IMenuButtonItem } from 'upgrade_types';
import { FeatureFlagExclusionsTableComponent } from './feature-flag-exclusions-table/feature-flag-exclusions-table.component';
import { FeatureFlagsService } from '../../../../../../../core/feature-flags/feature-flags.service';

@Component({
  selector: 'app-feature-flag-exclusions-section-card',
  standalone: true,
  imports: [
    CommonSectionCardComponent,
    CommonSectionCardTitleHeaderComponent,
    CommonSectionCardActionButtonsComponent,
    CommonModule,
    FeatureFlagExclusionsTableComponent,
    TranslateModule,
  ],
  templateUrl: './feature-flag-exclusions-section-card.component.html',
  styleUrl: './feature-flag-exclusions-section-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureFlagExclusionsSectionCardComponent {
  featureFlag$ = this.featureFlagService.selectedFeatureFlag$;
  tableRowCount$ = this.featureFlagService.selectFeatureFlagExclusionsLength$;

  constructor(private featureFlagService: FeatureFlagsService) {}

  menuButtonItems: IMenuButtonItem[] = [
    { name: 'Edit', disabled: false },
    { name: 'Delete', disabled: false },
  ];

  isSectionCardExpanded = true;

  addExcludeListClicked() {
    console.log('add Exclude List Clicked');
  }

  onMenuButtonItemClick(event) {
    console.log('Menu button Clicked');
    console.log(event);
  }

  onSectionCardExpandChange(isSectionCardExpanded: boolean) {
    this.isSectionCardExpanded = isSectionCardExpanded;
  }
}
