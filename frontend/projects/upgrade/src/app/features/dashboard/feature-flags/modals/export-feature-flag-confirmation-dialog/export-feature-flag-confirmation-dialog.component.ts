import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { Subscription, filter, first } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { FeatureFlagsService } from '../../../../../core/feature-flags/feature-flags.service';
import { CommonModalConfig } from '../../../../../shared-standalone-component-lib/components/common-modal/common-modal-config';
import { CommonModalComponent } from '../../../../../shared-standalone-component-lib/components/common-modal/common-modal.component';
import { EXPORT_MODAL_ACTION, ExportModalParams, FEATURE_FLAG_DETAILS_PAGE_ACTIONS, FeatureFlag } from '../../../../../core/feature-flags/store/feature-flags.model';
import { AuthService } from '../../../../../core/auth/auth.service';

@Component({
  selector: 'app-add-feature-flag-modal',
  standalone: true,
  imports: [
    CommonModalComponent,
    MatInputModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    FormsModule,
    TranslateModule,
    CommonModule,
  ],
  templateUrl: './export-feature-flag-confirmation-dialog.component.html',
  styleUrl: './export-feature-flag-confirmation-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExportConfirmationDialogComponent{
  FEATURE_FLAG_DETAILS_PAGE_ACTIONS = FEATURE_FLAG_DETAILS_PAGE_ACTIONS;
  isLoadingFeatureFlagExport$ = this.featureFlagsService.isLoadingFeatureFlagExport$;
  exportFeatureFlagSuccessFlag$ = this.featureFlagsService.exportFeatureFlagSuccessFlag$;
  subscriptions = new Subscription();
  userSub = new Subscription();
  featureFlags: FeatureFlag[];
  action: EXPORT_MODAL_ACTION;
  confirmationMessage: string = "";
  emailId: string = "";
  emailConfirmationMessage: string = "";


  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: CommonModalConfig<ExportModalParams>,
    public dialog: MatDialog,
    private featureFlagsService: FeatureFlagsService,
    private authService:AuthService,
    public dialogRef: MatDialogRef<ExportConfirmationDialogComponent>
  ) {}

  ngOnInit(): void {
    this.userSub = this.authService.currentUser$.pipe(first()).subscribe((userInfo) => {
      if (userInfo.email) {
        this.emailId = userInfo.email;
      }
    });
    this.listenToExportComplete();
    this.selectConfirmationMessages();
  }

  listenToExportComplete(): void {
    this.subscriptions = this.exportFeatureFlagSuccessFlag$.subscribe((flag) => {
      if (flag) {
        this.closeModal();
        this.featureFlagsService.setExportFeatureFlagsSuccessFlag(false);
      }
    });
  }

  selectConfirmationMessages(): void {
    switch (this.data.title) {
      case "Export All Feature Flag Designs":
        this.confirmationMessage = 'feature-flags.export-all-feature-flags.confirmation-text.text';
        break;
      case FEATURE_FLAG_DETAILS_PAGE_ACTIONS.EXPORT_DESIGN:
        this.confirmationMessage = 'feature-flags.export-feature-flag-design.confirmation-text.text';
        break;
      case FEATURE_FLAG_DETAILS_PAGE_ACTIONS.EMAIL_DATA:
        this.emailConfirmationMessage = "The feature flag will be sent to '" + this.emailId + "'."
        this.confirmationMessage = 'feature-flags.export-feature-flags-data.confirmation-text.text';
        break;
      default:
        console.log('Unknown action');
    }
  }

  onPrimaryActionBtnClicked() {
    const { sourceFlags, action } = this.data.params;
    const flagIds = sourceFlags.map((flag) => flag.id);
    if (action === EXPORT_MODAL_ACTION.EXPORT) {
      this.featureFlagsService.exportFeatureFlagsData(flagIds);
    } else if (action === EXPORT_MODAL_ACTION.MAIL) {
      this.featureFlagsService.emailFeatureFlagData(flagIds[0]);
    }
  }

  closeModal() {
    this.dialogRef.close();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
