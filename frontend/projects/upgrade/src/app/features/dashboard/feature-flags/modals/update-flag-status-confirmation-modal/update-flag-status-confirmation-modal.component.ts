import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { CommonModalComponent } from '../../../../../shared-standalone-component-lib/components';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CommonModalConfig } from '../../../../../shared-standalone-component-lib/components/common-modal/common-modal-config';
import { TranslateModule } from '@ngx-translate/core';
import { FeatureFlagsService } from '../../../../../core/feature-flags/feature-flags.service';
import {
  FeatureFlag,
  UpdateFeatureFlagStatusRequest,
} from '../../../../../core/feature-flags/store/feature-flags.model';
import { FEATURE_FLAG_STATUS } from 'upgrade_types';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-update-flag-status-confirmation-modal',
  standalone: true,
  imports: [CommonModalComponent, TranslateModule, CommonModule],
  templateUrl: './update-flag-status-confirmation-modal.component.html',
  styleUrls: ['./update-flag-status-confirmation-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpdateFlagStatusConfirmationModalComponent {
  subscriptions = new Subscription();
  selectedFlag$ = this.featureFlagService.selectedFeatureFlag$;
  isLoadingUpdateFeatureFlagStatus$ = this.featureFlagService.isLoadingUpdateFeatureFlagStatus$;
  selectedFlagStatusChange$ = this.featureFlagService.selectedFeatureFlagStatusChange$;

  get FEATURE_FLAG_STATUS() {
    return FEATURE_FLAG_STATUS;
  }

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public config: CommonModalConfig,
    public featureFlagService: FeatureFlagsService,
    public dialog: MatDialog,
    public dialogRef: MatDialogRef<UpdateFlagStatusConfirmationModalComponent>
  ) {}

  ngOnInit() {
    this.listenForFeatureFlagStatusChanges();
  }

  listenForFeatureFlagStatusChanges(): void {
    this.subscriptions = this.selectedFlagStatusChange$.subscribe(() => {
      this.closeModal();
    });
  }

  onPrimaryActionBtnClicked(updateFeatureFlagStatusRequest: UpdateFeatureFlagStatusRequest) {
    this.featureFlagService.updateFeatureFlagStatus(updateFeatureFlagStatusRequest);
  }

  toggleFlagStatus(flag: FeatureFlag): FEATURE_FLAG_STATUS {
    return flag.status === FEATURE_FLAG_STATUS.DISABLED ? FEATURE_FLAG_STATUS.ENABLED : FEATURE_FLAG_STATUS.DISABLED;
  }

  closeModal() {
    this.dialogRef.close('close modal');
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
