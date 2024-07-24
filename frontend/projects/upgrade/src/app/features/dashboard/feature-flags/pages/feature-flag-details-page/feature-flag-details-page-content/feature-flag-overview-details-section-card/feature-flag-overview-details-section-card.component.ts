import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
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
import { TranslateModule } from '@ngx-translate/core';
import { CommonSectionCardOverviewDetailsComponent } from '../../../../../../../shared-standalone-component-lib/components/common-section-card-overview-details/common-section-card-overview-details.component';
import { DialogService } from '../../../../../../../shared/services/common-dialog.service';
import { FeatureFlag } from '../../../../../../../core/feature-flags/store/feature-flags.model';
import { MatDialogRef } from '@angular/material/dialog';
import { CommonSimpleConfirmationModalComponent } from '../../../../../../../shared-standalone-component-lib/components/common-simple-confirmation-modal/common-simple-confirmation-modal.component';
import { Subscription } from 'rxjs';
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
    TranslateModule,
  ],
  templateUrl: './feature-flag-overview-details-section-card.component.html',
  styleUrl: './feature-flag-overview-details-section-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureFlagOverviewDetailsSectionCardComponent {
  isSectionCardExpanded = true;
  @Output() sectionCardExpandChange = new EventEmitter<boolean>();
  featureFlag$ = this.featureFlagService.selectedFeatureFlag$;
  flagOverviewDetails$ = this.featureFlagService.selectedFlagOverviewDetails;
  subscriptions = new Subscription();

  menuButtonItems: IMenuButtonItem[] = [
    { name: 'Edit', disabled: false },
    { name: 'Delete', disabled: false },
    { name: 'Duplicate', disabled: false },
  ];

  confirmStatusChangeDialogRef: MatDialogRef<CommonSimpleConfirmationModalComponent>;

  constructor(private dialogService: DialogService, private featureFlagService: FeatureFlagsService) {}

  get FEATURE_FLAG_STATUS() {
    return FEATURE_FLAG_STATUS;
  }

  viewLogsClicked(event) {
    console.log('viewLogs Clicked');
    console.log(event);
  }

  onSlideToggleChange(event: MatSlideToggleChange, flag: FeatureFlag) {
    const slideToggleEvent = event.source;
    const newStatus = slideToggleEvent.checked ? FEATURE_FLAG_STATUS.ENABLED : FEATURE_FLAG_STATUS.DISABLED;

    if (slideToggleEvent.checked) {
      this.confirmStatusChangeDialogRef = this.openEnableConfirmModel(flag.name);
    } else {
      this.confirmStatusChangeDialogRef = this.openDisableConfirmModel(flag.name);
    }

    this.listenForConfirmStatusChangeDialogClose(flag, newStatus);

    // Note: we don't want the toggle to visibly change state immediately because we have to pop a confirmation modal first, so we need override the default and flip it back. I unfortunately couldn't find a better way to do this.
    slideToggleEvent.checked = !slideToggleEvent.checked;
  }

  listenForConfirmStatusChangeDialogClose(flag: FeatureFlag, newStatus: FEATURE_FLAG_STATUS): void {
    this.subscriptions.add(
      this.confirmStatusChangeDialogRef.afterClosed().subscribe((confirmClicked) => {
        this.handleDialogClose(confirmClicked, flag, newStatus);
      })
    );
  }

  handleDialogClose(confirmClicked: boolean, flag: FeatureFlag, newStatus: FEATURE_FLAG_STATUS): void {
    if (confirmClicked) {
      this.featureFlagService.updateFeatureFlagStatus({
        flagId: flag.id,
        status: newStatus,
      });
    }
  }

  openEnableConfirmModel(flagName: string): MatDialogRef<CommonSimpleConfirmationModalComponent> {
    return this.dialogService.openEnableFeatureFlagConfirmModel(flagName);
  }

  openDisableConfirmModel(flagName: string): MatDialogRef<CommonSimpleConfirmationModalComponent> {
    return this.dialogService.openDisableFeatureFlagConfirmModel(flagName);
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
    this.sectionCardExpandChange.emit(this.isSectionCardExpanded);
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
