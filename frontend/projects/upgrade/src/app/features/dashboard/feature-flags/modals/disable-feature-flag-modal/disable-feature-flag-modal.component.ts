import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { CommonModalComponent } from '../../../../../shared-standalone-component-lib/components';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CommonModalConfig } from '../../../../../shared-standalone-component-lib/components/common-modal/common-modal-config';
import { TranslateModule } from '@ngx-translate/core';
import { FeatureFlagsService } from '../../../../../core/feature-flags/feature-flags.service';
import { UpdateFeatureFlagStatusRequest } from '../../../../../core/feature-flags/store/feature-flags.model';
import { FEATURE_FLAG_STATUS } from 'upgrade_types';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-disable-feature-flag-modal',
  standalone: true,
  imports: [CommonModalComponent, TranslateModule],
  templateUrl: './disable-feature-flag-modal.component.html',
  styleUrl: './disable-feature-flag-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DisableFeatureFlagModalComponent {
  isLoadingUpdateFeatureFlagStatus$ = this.featureFlagService.isLoadingUpdateFeatureFlagStatus$;
  // isUpdateFeatureFlagStatusSuccess$ = this.featureFlagService.isUpdateFeatureFlagStatusComplete$;
  subscriptions = new Subscription();

  featureFlagName: string;
  featureFlagId: string;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public config: CommonModalConfig,
    public featureFlagService: FeatureFlagsService,
    public dialog: MatDialog,
    public dialogRef: MatDialogRef<DisableFeatureFlagModalComponent>
  ) {
    this.featureFlagName = this.config.payload.flagName as string;
    this.featureFlagId = this.config.payload.flagId as string;
  }

  listenForFeatureFlagStatusChanges(): void {
    this.subscriptions = this.isLoadingUpdateFeatureFlagStatus$.subscribe(() => this.closeModal());
  }

  onPrimaryActionBtnClicked() {
    const updateFeatureFlagStatusRequest: UpdateFeatureFlagStatusRequest = {
      flagId: this.featureFlagId,
      status: FEATURE_FLAG_STATUS.DISABLED,
    };
    this.featureFlagService.disableFeatureFlag(updateFeatureFlagStatusRequest);
  }

  closeModal() {
    this.dialogRef.close('close modal');
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
