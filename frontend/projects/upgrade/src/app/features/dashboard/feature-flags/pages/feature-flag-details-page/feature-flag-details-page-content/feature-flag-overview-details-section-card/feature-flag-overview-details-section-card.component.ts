import { ChangeDetectionStrategy, Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
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
import { FEATURE_FLAG_DETAILS_PAGE_ACTIONS, FeatureFlag } from '../../../../../../../core/feature-flags/store/feature-flags.model';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../../../../../core/auth/auth.service';

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
export class FeatureFlagOverviewDetailsSectionCardComponent implements OnInit, OnDestroy {
  isSectionCardExpanded = true;
  @Output() sectionCardExpandChange = new EventEmitter<boolean>();
  featureFlag: FeatureFlag;
  flagSub = new Subscription();
  mailSub = new Subscription();
  emailId = '';
  featureFlag$ = this.featureFlagService.selectedFeatureFlag$;
  flagOverviewDetails$ = this.featureFlagService.selectedFlagOverviewDetails;

  menuButtonItems: IMenuButtonItem[] = [
    { name: FEATURE_FLAG_DETAILS_PAGE_ACTIONS.EDIT, disabled: false },
    { name: FEATURE_FLAG_DETAILS_PAGE_ACTIONS.DUPLICATE, disabled: false },
    { name: FEATURE_FLAG_DETAILS_PAGE_ACTIONS.EXPORT_DESIGN, disabled: false },
    { name: FEATURE_FLAG_DETAILS_PAGE_ACTIONS.EMAIL_DATA, disabled: false },
    { name: FEATURE_FLAG_DETAILS_PAGE_ACTIONS.ARCHIVE, disabled: false },
    { name: FEATURE_FLAG_DETAILS_PAGE_ACTIONS.DELETE, disabled: false },
  ];

  constructor(private dialogService: DialogService, private featureFlagService: FeatureFlagsService, private authService: AuthService,) {}

  ngOnInit(): void {
    this.flagSub = this.featureFlagService.selectedFeatureFlag$.subscribe((flag) => this.featureFlag = flag);
    this.mailSub = this.featureFlagService.currentUserEmailAddress$.subscribe((id) => this.emailId = id);
  }

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

  onMenuButtonItemClick(event: FEATURE_FLAG_DETAILS_PAGE_ACTIONS, flag: FeatureFlag) {
    switch (event) {
      case FEATURE_FLAG_DETAILS_PAGE_ACTIONS.DELETE:
        this.dialogService.openDeleteFeatureFlagModal();
        break;
      case FEATURE_FLAG_DETAILS_PAGE_ACTIONS.EDIT:
        this.dialogService.openEditFeatureFlagModal(flag);
        break;
      case FEATURE_FLAG_DETAILS_PAGE_ACTIONS.DUPLICATE:
        this.dialogService.openDuplicateFeatureFlagModal(flag);
        break;
      case FEATURE_FLAG_DETAILS_PAGE_ACTIONS.ARCHIVE:
        console.log('Archive feature flag');
        break;
      case FEATURE_FLAG_DETAILS_PAGE_ACTIONS.EXPORT_DESIGN:
        this.openConfirmExportDesignModal();
        break;
      case FEATURE_FLAG_DETAILS_PAGE_ACTIONS.EMAIL_DATA:
        this.openConfirmEmailDataModal();
        break;
      default:
        console.log('Unknown action');
    }
  }

  openConfirmExportDesignModal() {
    const confirmMessage = 'feature-flags.export-feature-flag-design.confirmation-text.text';
    this.dialogService.openExportFeatureFlagDesignModal(confirmMessage)
      .afterClosed()
      .subscribe((isExportClicked: boolean) => {
        if (isExportClicked) {
          this.featureFlagService.exportFeatureFlagsData([this.featureFlag.id]);
        }
      });
  }

  openConfirmEmailDataModal() {
    const confirmMessage = 'feature-flags.export-feature-flags-data.confirmation-text.text';
    const emailConfirmationMessage = "The feature flag will be sent to '" + this.emailId + "'." ;
    this.dialogService.openEmailFeatureFlagDataModal(confirmMessage, emailConfirmationMessage)
      .afterClosed()
      .subscribe((isEmailClicked: boolean) => {
        if (isEmailClicked) {
          this.featureFlagService.emailFeatureFlagData(this.featureFlag.id);
        }
      });
  }

  onSectionCardExpandChange(isSectionCardExpanded: boolean) {
    this.isSectionCardExpanded = isSectionCardExpanded;
    this.sectionCardExpandChange.emit(this.isSectionCardExpanded);
  }

  ngOnDestroy(): void {
    this.flagSub.unsubscribe();
    this.mailSub.unsubscribe();
  }
}
