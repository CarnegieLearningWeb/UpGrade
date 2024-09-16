import { ChangeDetectionStrategy, Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import {
  CommonSectionCardActionButtonsComponent,
  CommonSectionCardComponent,
  CommonSectionCardTitleHeaderComponent,
} from '../../../../../../../shared-standalone-component-lib/components';
import { FeatureFlagOverviewDetailsFooterComponent } from './feature-flag-overview-details-footer/feature-flag-overview-details-footer.component';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { FeatureFlagsService } from '../../../../../../../core/feature-flags/feature-flags.service';
import { FEATURE_FLAG_STATUS, FILTER_MODE, FLAG_SEARCH_KEY, IMenuButtonItem } from 'upgrade_types';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { CommonSectionCardOverviewDetailsComponent } from '../../../../../../../shared-standalone-component-lib/components/common-section-card-overview-details/common-section-card-overview-details.component';
import { DialogService } from '../../../../../../../shared/services/common-dialog.service';
import {
  FEATURE_FLAG_DETAILS_PAGE_ACTIONS,
  FeatureFlag,
} from '../../../../../../../core/feature-flags/store/feature-flags.model';
import { Subscription } from 'rxjs';
import { MatDialogRef } from '@angular/material/dialog';
import { CommonSimpleConfirmationModalComponent } from '../../../../../../../shared-standalone-component-lib/components/common-simple-confirmation-modal/common-simple-confirmation-modal.component';
import { Router } from '@angular/router';
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
export class FeatureFlagOverviewDetailsSectionCardComponent implements OnInit, OnDestroy {
  isSectionCardExpanded = true;
  @Output() sectionCardExpandChange = new EventEmitter<boolean>();
  emailId = '';
  featureFlag$ = this.featureFlagService.selectedFeatureFlag$;
  flagOverviewDetails$ = this.featureFlagService.selectedFlagOverviewDetails;
  shouldShowWarning$ = this.featureFlagService.shouldShowWarningForSelectedFlag$;
  subscriptions = new Subscription();
  confirmStatusChangeDialogRef: MatDialogRef<CommonSimpleConfirmationModalComponent>;
  menuButtonItems: IMenuButtonItem[] = [
    { name: FEATURE_FLAG_DETAILS_PAGE_ACTIONS.EDIT, disabled: false },
    { name: FEATURE_FLAG_DETAILS_PAGE_ACTIONS.DUPLICATE, disabled: false },
    { name: FEATURE_FLAG_DETAILS_PAGE_ACTIONS.EXPORT_DESIGN, disabled: false },
    { name: FEATURE_FLAG_DETAILS_PAGE_ACTIONS.EMAIL_DATA, disabled: true },
    { name: FEATURE_FLAG_DETAILS_PAGE_ACTIONS.ARCHIVE, disabled: true },
    { name: FEATURE_FLAG_DETAILS_PAGE_ACTIONS.DELETE, disabled: false },
  ];

  constructor(
    private dialogService: DialogService,
    private featureFlagService: FeatureFlagsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(this.featureFlagService.currentUserEmailAddress$.subscribe((id) => (this.emailId = id)));
  }

  get FEATURE_FLAG_STATUS() {
    return FEATURE_FLAG_STATUS;
  }

  get FILTER_MODE() {
    return FILTER_MODE;
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
        this.openConfirmExportDesignModal(flag.id);
        break;
      case FEATURE_FLAG_DETAILS_PAGE_ACTIONS.EMAIL_DATA:
        this.openConfirmEmailDataModal(flag.id);
        break;
      default:
        console.log('Unknown action');
    }
  }

  openConfirmExportDesignModal(id: string) {
    const confirmMessage = 'feature-flags.export-feature-flag-design.confirmation-text.text';
    this.dialogService
      .openExportFeatureFlagDesignModal(confirmMessage)
      .afterClosed()
      .subscribe((isExportClicked: boolean) => {
        if (isExportClicked) {
          this.featureFlagService.exportFeatureFlagsData(id);
        }
      });
  }

  openConfirmEmailDataModal(id: string) {
    const confirmMessage = 'feature-flags.export-feature-flags-data.confirmation-text.text';
    const emailConfirmationMessage = "The feature flag will be sent to '" + this.emailId + "'.";
    this.dialogService
      .openEmailFeatureFlagDataModal(confirmMessage, emailConfirmationMessage)
      .afterClosed()
      .subscribe((isEmailClicked: boolean) => {
        if (isEmailClicked) {
          this.featureFlagService.emailFeatureFlagData(id);
        }
      });
  }

  onSectionCardExpandChange(isSectionCardExpanded: boolean) {
    this.isSectionCardExpanded = isSectionCardExpanded;
    this.sectionCardExpandChange.emit(this.isSectionCardExpanded);
  }

  filterFeatureFlagByChips(tagValue: string) {
    this.featureFlagService.setSearchKey(FLAG_SEARCH_KEY.TAG);
    this.featureFlagService.setSearchString(tagValue);
    this.router.navigate(['/featureflags']);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
