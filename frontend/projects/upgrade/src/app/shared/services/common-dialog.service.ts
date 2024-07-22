import { Injectable } from '@angular/core';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { MatConfirmDialogComponent } from '../components/mat-confirm-dialog/mat-confirm-dialog.component';
import {
  CommonModalConfig,
  SimpleConfirmationModalParams,
} from '../../shared-standalone-component-lib/components/common-modal/common-modal-config';
import { DeleteFeatureFlagModalComponent } from '../../features/dashboard/feature-flags/modals/delete-feature-flag-modal/delete-feature-flag-modal.component';

import { ImportFeatureFlagModalComponent } from '../../features/dashboard/feature-flags/modals/import-feature-flag-modal/import-feature-flag-modal.component';
import { UpdateFlagStatusConfirmationModalComponent } from '../../features/dashboard/feature-flags/modals/update-flag-status-confirmation-modal/update-flag-status-confirmation-modal.component';
import { UpsertFeatureFlagModalComponent } from '../../features/dashboard/feature-flags/modals/upsert-feature-flag-modal/upsert-feature-flag-modal.component';
import {
  FeatureFlag,
  UPSERT_FEATURE_FLAG_ACTION,
  UPSERT_FEATURE_FLAG_LIST_ACTION,
  UpsertFeatureFlagListParams,
  UpsertFeatureFlagParams,
} from '../../core/feature-flags/store/feature-flags.model';
import { UpsertFeatureFlagListModalComponent } from '../../features/dashboard/feature-flags/modals/upsert-feature-flag-list-modal/upsert-feature-flag-list-modal.component';
import { CommonSimpleConfirmationModalComponent } from '../../shared-standalone-component-lib/components/common-simple-confirmation-modal/common-simple-confirmation-modal.component';

@Injectable({
  providedIn: 'root',
})
export class DialogService {
  constructor(private dialog: MatDialog) {}

  // This method is used in the older ui
  openConfirmDialog() {
    return this.dialog.open(MatConfirmDialogComponent, {
      width: 'auto',
      disableClose: true,
    });
  }

  // Common modal flags ---------------------------------------- //
  openAddFeatureFlagModal() {
    const commonModalConfig: CommonModalConfig = {
      title: 'Add Feature Flag',
      primaryActionBtnLabel: 'Create',
      primaryActionBtnColor: 'primary',
      cancelBtnLabel: 'Cancel',
      params: {
        sourceFlag: null,
        action: UPSERT_FEATURE_FLAG_LIST_ACTION.ADD,
      },
    };
    return this.openUpsertFeatureFlagModal(commonModalConfig);
  }

  openEditFeatureFlagModal(sourceFlag: FeatureFlag) {
    const commonModalConfig: CommonModalConfig<UpsertFeatureFlagParams> = {
      title: 'Edit Feature Flag',
      primaryActionBtnLabel: 'Save',
      primaryActionBtnColor: 'primary',
      cancelBtnLabel: 'Cancel',
      params: {
        sourceFlag: { ...sourceFlag },
        action: UPSERT_FEATURE_FLAG_ACTION.EDIT,
      },
    };
    return this.openUpsertFeatureFlagModal(commonModalConfig);
  }

  openDuplicateFeatureFlagModal(sourceFlag: FeatureFlag) {
    const commonModalConfig: CommonModalConfig = {
      title: 'Duplicate Feature Flag',
      primaryActionBtnLabel: 'Add',
      primaryActionBtnColor: 'primary',
      cancelBtnLabel: 'Cancel',
      params: {
        sourceFlag: { ...sourceFlag },
        action: UPSERT_FEATURE_FLAG_ACTION.DUPLICATE,
      },
    };
    return this.openUpsertFeatureFlagModal(commonModalConfig);
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

  openUpsertFeatureFlagModal(commonModalConfig: CommonModalConfig) {
    const config: MatDialogConfig = {
      data: commonModalConfig,
      width: '656px',
      autoFocus: 'first-heading',
      disableClose: true,
    };
    return this.dialog.open(UpsertFeatureFlagModalComponent, config);
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

  openAddIncludeListModal() {
    const commonModalConfig: CommonModalConfig<UpsertFeatureFlagListParams> = {
      title: 'Add Include List',
      primaryActionBtnLabel: 'Create',
      primaryActionBtnColor: 'primary',
      cancelBtnLabel: 'Cancel',
      params: {
        sourceList: null,
        action: UPSERT_FEATURE_FLAG_LIST_ACTION.ADD,
      },
    };
    return this.openAddFeatureFlagListModal(commonModalConfig);
  }

  openAddFeatureFlagListModal(commonModalConfig: CommonModalConfig) {
    const config: MatDialogConfig = {
      data: commonModalConfig,
      width: '656px',
      // height: '460px',
      height: 'auto', // TODO: fixed height or not?
      autoFocus: 'input',
      disableClose: true,
    };
    return this.dialog.open(UpsertFeatureFlagListModalComponent, config);
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
      width: '480px',
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
      width: '656px',
      autoFocus: 'input',
      disableClose: true,
    };
    return this.dialog.open(ImportFeatureFlagModalComponent, config);
  }

  openSimpleCommonConfirmationModal(
    commonModalConfig: CommonModalConfig
  ): MatDialogRef<CommonSimpleConfirmationModalComponent, boolean> {
    const config: MatDialogConfig = {
      data: commonModalConfig,
      width: '656px',
      autoFocus: 'first-heading',
      disableClose: true,
    };

    return this.dialog.open(CommonSimpleConfirmationModalComponent, config);
  }
}
