import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { CommonModalComponent } from '../../../../../shared-standalone-component-lib/components';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CommonModalConfig } from '../../../../../shared-standalone-component-lib/components/common-modal/common-modal-config';
import { TranslateModule } from '@ngx-translate/core';
import { FeatureFlagsService } from '../../../../../core/feature-flags/feature-flags.service';
import { UpdateFeatureFlagStatusRequest } from '../../../../../core/feature-flags/store/feature-flags.model';
import { FEATURE_FLAG_STATUS } from '../../../../../../../../../../types/src';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-enable-feature-flag-modal-content',
  standalone: true,
  imports: [CommonModalComponent, TranslateModule, CommonModule],
  templateUrl: './enable-feature-flag-modal.component.html',
  styleUrl: './enable-feature-flag-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnableFeatureFlagModalComponent {
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
    public dialogRef: MatDialogRef<EnableFeatureFlagModalComponent>
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
    this.featureFlagService.enableFeatureFlag(updateFeatureFlagStatusRequest);
  }

  closeModal() {
    this.dialogRef.close('close modal');
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
