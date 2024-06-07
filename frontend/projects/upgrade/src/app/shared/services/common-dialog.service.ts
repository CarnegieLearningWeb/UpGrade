import { Injectable } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatConfirmDialogComponent } from '../components/mat-confirm-dialog/mat-confirm-dialog.component';
import { AddFeatureFlagModalComponent } from '../../features/dashboard/feature-flags/modals/add-feature-flag-modal/add-feature-flag-modal.component';
import { CommonModalConfig } from '../../shared-standalone-component-lib/components/common-modal/common-modal-config';
import { EnableFeatureFlagModalContentComponent } from '../../features/dashboard/feature-flags/modals/enable-feature-flag-modal-content/enable-feature-flag-modal-content.component';
import { DisableFeatureFlagModalContentComponent } from '../../features/dashboard/feature-flags/modals/disable-feature-flag-modal-content/disable-feature-flag-modal-content.component';

@Injectable({
  providedIn: 'root',
})
export class DialogService {
  constructor(private dialog: MatDialog) {}

  openConfirmDialog() {
    return this.dialog.open(MatConfirmDialogComponent, {
      width: 'auto',
      disableClose: true,
    });
  }

  openAddFeatureFlagModal() {
    const commonModalConfig: CommonModalConfig = {
      title: 'Add Feature Flag',
      primaryActionBtnLabel: 'Add',
      primaryActionBtnColor: 'primary',
      cancelBtnLabel: 'Cancel',
    };
    const config: MatDialogConfig = {
      data: commonModalConfig,
      width: '656px',
      autoFocus: 'first-heading',
      disableClose: true,
    };
    return this.dialog.open(AddFeatureFlagModalComponent, config);
  }

  openEnableFeatureFlagConfirmModel(payload: { flagName: string; flagId: string }) {
    const commonModalConfig: CommonModalConfig = {
      title: 'Enable Feature Flag',
      primaryActionBtnLabel: 'Enable',
      primaryActionBtnColor: 'primary',
      cancelBtnLabel: 'Cancel',
      payload,
    };
    const config: MatDialogConfig = {
      data: commonModalConfig,
      width: '560px',
      autoFocus: 'first-heading',
      disableClose: true,
    };
    return this.dialog.open(EnableFeatureFlagModalContentComponent, config);
  }

  openDisableFeatureFlagConfirmModel(payload: { flagName: string; flagId: string }) {
    const commonModalConfig: CommonModalConfig = {
      title: 'Disable Feature Flag',
      primaryActionBtnLabel: 'Disable',
      primaryActionBtnColor: 'warning',
      cancelBtnLabel: 'Cancel',
      payload,
    };
    const config: MatDialogConfig = {
      data: commonModalConfig,
      width: '560px',
      autoFocus: 'first-heading',
      disableClose: true,
    };
    return this.dialog.open(DisableFeatureFlagModalContentComponent, config);
  }
}
