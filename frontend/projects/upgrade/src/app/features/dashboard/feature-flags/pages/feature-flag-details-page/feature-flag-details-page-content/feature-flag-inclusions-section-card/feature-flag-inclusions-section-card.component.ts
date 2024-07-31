import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import {
  CommonSectionCardActionButtonsComponent,
  CommonSectionCardComponent,
  CommonSectionCardTitleHeaderComponent,
} from '../../../../../../../shared-standalone-component-lib/components';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { IMenuButtonItem } from 'upgrade_types';
import { FeatureFlagInclusionsTableComponent } from './feature-flag-inclusions-table/feature-flag-inclusions-table.component';
import { FeatureFlagsService } from '../../../../../../../core/feature-flags/feature-flags.service';
import { DialogService } from '../../../../../../../shared/services/common-dialog.service';

@Component({
  selector: 'app-feature-flag-inclusions-section-card',
  standalone: true,
  imports: [
    CommonSectionCardComponent,
    CommonSectionCardTitleHeaderComponent,
    CommonSectionCardActionButtonsComponent,
    CommonModule,
    FeatureFlagInclusionsTableComponent,
    TranslateModule,
  ],
  templateUrl: './feature-flag-inclusions-section-card.component.html',
  styleUrl: './feature-flag-inclusions-section-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureFlagInclusionsSectionCardComponent {
  @Input() isSectionCardExpanded;
  tableRowCount$ = this.featureFlagService.selectFeatureFlagInclusionsLength$;
  featureFlag$ = this.featureFlagService.selectedFeatureFlag$;

  constructor(private featureFlagService: FeatureFlagsService, private dialogService: DialogService) {}

  menuButtonItems: IMenuButtonItem[] = [
    { name: 'Edit', disabled: false },
    { name: 'Delete', disabled: false },
  ];

  addIncludeListClicked(appContext: string) {
    this.dialogService.openAddIncludeListModal(appContext);
  }

  onMenuButtonItemClick(event) {
    console.log('Menu button Clicked');
    console.log(event);
  }

  onSectionCardExpandChange(isSectionCardExpanded: boolean) {
    this.isSectionCardExpanded = isSectionCardExpanded;
  }
}
