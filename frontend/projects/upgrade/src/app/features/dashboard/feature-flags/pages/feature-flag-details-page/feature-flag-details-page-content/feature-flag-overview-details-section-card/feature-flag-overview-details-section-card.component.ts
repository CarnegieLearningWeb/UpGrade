import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  CommonSectionCardActionButtonsComponent,
  CommonSectionCardComponent,
  CommonSectionCardTitleHeaderComponent,
} from '../../../../../../../shared-standalone-component-lib/components';
import { FeatureFlagOverviewDetailsFooterComponent } from './feature-flag-overview-details-footer/feature-flag-overview-details-footer.component';

import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { FeatureFlagsService } from '../../../../../../../core/feature-flags/feature-flags.service';
import { FEATURE_FLAG_STATUS, IMenuButtonItem } from 'upgrade_types';
import { CommonModule } from '@angular/common';
import { CommonSectionCardOverviewDetailsComponent } from '../../../../../../../shared-standalone-component-lib/components/common-section-card-overview-details/common-section-card-overview-details.component';
import { DialogService } from '../../../../../../../shared/services/common-dialog.service';
import { FeatureFlag } from '../../../../../../../core/feature-flags/store/feature-flags.model';
@Component({
  selector: 'app-feature-flag-overview-details-section-card',
  standalone: true,
  imports: [
    CommonModule,
    CommonSectionCardComponent,
    CommonSectionCardTitleHeaderComponent,
    CommonSectionCardActionButtonsComponent,
    CommonSectionCardOverviewDetailsComponent,
    FeatureFlagOverviewDetailsFooterComponent,
  ],
  templateUrl: './feature-flag-overview-details-section-card.component.html',
  styleUrl: './feature-flag-overview-details-section-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureFlagOverviewDetailsSectionCardComponent {
  featureFlag$ = this.featureFlagService.selectedFeatureFlag$;
  flagOverviewDetails$ = this.featureFlagService.selectedFlagOverviewDetails;

  menuButtonItems: IMenuButtonItem[] = [
    { name: 'Edit', disabled: false },
    { name: 'Delete', disabled: false },
    { name: 'Duplicate', disabled: false },
  ];
  isSectionCardExpanded = true;

  constructor(private dialogService: DialogService, private featureFlagService: FeatureFlagsService) {}

  get FEATURE_FLAG_STATUS() {
    return FEATURE_FLAG_STATUS;
  }

  viewLogsClicked(event) {
    console.log('viewLogs Clicked');
    console.log(event);
  }

  onSlideToggleChange(event: MatSlideToggleChange) {
    const slideToggleEvent = event.source;

    if (slideToggleEvent.checked) {
      this.openEnableConfirmModel();
    } else {
      this.openDisableConfirmModel();
    }

    // Note: we don't want the toggle to visibly change state immediately because we have to pop a confirmation modal first, so we need override the default and flip it back. I unfortunately couldn't find a better way to do this.
    slideToggleEvent.checked = !slideToggleEvent.checked;
  }

  openEnableConfirmModel(): void {
    this.dialogService.openEnableFeatureFlagConfirmModel();
  }

  openDisableConfirmModel(): void {
    this.dialogService.openDisableFeatureFlagConfirmModel();
  }

  onMenuButtonItemClick(event: 'Edit' | 'Delete' | 'Duplicate', flag: FeatureFlag) {
    if (event === 'Delete') {
      this.dialogService.openDeleteFeatureFlagModal();
    } else if (event === 'Edit') {
      this.dialogService.openEditFeatureFlagModal(flag);
    } else if (event === 'Duplicate') {
      this.dialogService.openDuplicateFeatureFlagModal(flag);
    }
  }

  onSectionCardExpandChange(isSectionCardExpanded: boolean) {
    this.isSectionCardExpanded = isSectionCardExpanded;
  }
}
