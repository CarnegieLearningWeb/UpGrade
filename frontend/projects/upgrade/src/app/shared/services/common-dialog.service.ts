import { Injectable } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatConfirmDialogComponent } from '../components/mat-confirm-dialog/mat-confirm-dialog.component';
import { AddFeatureFlagModalComponent } from '../../features/dashboard/feature-flags/modals/add-feature-flag-modal/add-feature-flag-modal.component';
import { CommonModalConfig } from '../../shared-standalone-component-lib/components/common-modal/common-modal-config';
import { DeleteFeatureFlagModalComponent } from '../../features/dashboard/feature-flags/modals/delete-feature-flag-modal/delete-feature-flag-modal.component';

import { ImportFeatureFlagModalComponent } from '../../features/dashboard/feature-flags/modals/import-feature-flag-modal/import-feature-flag-modal.component';
import { UpdateFlagStatusConfirmationModalComponent } from '../../features/dashboard/feature-flags/modals/update-flag-status-confirmation-modal/update-flag-status-confirmation-modal.component';
import { EditFeatureFlagModalComponent } from '../../features/dashboard/feature-flags/modals/edit-feature-flag-modal/edit-feature-flag-modal.component';

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

  openEditFeatureFlagModal() {
    const commonModalConfig: CommonModalConfig = {
      title: 'Edit Feature Flag',
      primaryActionBtnLabel: 'Save',
      primaryActionBtnColor: 'primary',
      cancelBtnLabel: 'Cancel',
    };
    const config: MatDialogConfig = {
      data: commonModalConfig,
      width: '656px',
      autoFocus: 'first-heading',
      disableClose: true,
    };
    return this.dialog.open(EditFeatureFlagModalComponent, config);
  }

  openEnableFeatureFlagConfirmModel() {
    const enableFlagStatusModalConfig: CommonModalConfig = {
      title: 'Enable Feature Flag',
      primaryActionBtnLabel: 'Enable',
      primaryActionBtnColor: 'primary',
      cancelBtnLabel: 'Cancel',
    };

    return this.openUpdateFlagStatusConfirmationModal(enableFlagStatusModalConfig);
  }

  openDisableFeatureFlagConfirmModel() {
    const disableFlagStatusModalConfig: CommonModalConfig = {
      title: 'Disable Feature Flag',
      primaryActionBtnLabel: 'Disable',
      primaryActionBtnColor: 'warn',
      cancelBtnLabel: 'Cancel',
    };

    return this.openUpdateFlagStatusConfirmationModal(disableFlagStatusModalConfig);
  }

  openUpdateFlagStatusConfirmationModal(commonModalConfig: CommonModalConfig) {
    const config: MatDialogConfig = {
      data: commonModalConfig,
      width: '560px',
      autoFocus: 'first-heading',
      disableClose: true,
    };

    return this.dialog.open(UpdateFlagStatusConfirmationModalComponent, config);
  }

  openDeleteFeatureFlagModal() {
    const commonModalConfig: CommonModalConfig = {
      title: 'Delete Feature Flag',
      primaryActionBtnLabel: 'Delete',
      primaryActionBtnColor: 'primary',
      cancelBtnLabel: 'Cancel',
    };
    const config: MatDialogConfig = {
      data: commonModalConfig,
      width: '670px',
      height: '390px',
      autoFocus: 'input',
      disableClose: true,
    };
    return this.dialog.open(DeleteFeatureFlagModalComponent, config);
  }

  openImportFeatureFlagModal() {
    const commonModalConfig: CommonModalConfig = {
      title: 'Import Feature Flag',
      primaryActionBtnLabel: 'Import',
      primaryActionBtnColor: 'primary',
      cancelBtnLabel: 'Cancel',
    };
    const config: MatDialogConfig = {
      data: commonModalConfig,
      width: '670px',
      height: '460px',
      autoFocus: 'input',
      disableClose: true,
    };
    return this.dialog.open(ImportFeatureFlagModalComponent, config);
  }
}
