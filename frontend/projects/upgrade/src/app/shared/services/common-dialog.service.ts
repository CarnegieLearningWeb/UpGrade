import { Injectable } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatConfirmDialogComponent } from '../components/mat-confirm-dialog/mat-confirm-dialog.component';
import { AddFeatureFlagModalComponent } from '../../features/dashboard/feature-flags/modals/add-feature-flag-modal/add-feature-flag-modal.component';
import { CommonModalConfig } from '../../shared-standalone-component-lib/components/common-modal/common-modal-config';
import { DeleteFeatureFlagModalComponent } from '../../features/dashboard/feature-flags/modals/delete-feature-flag-modal/delete-feature-flag-modal.component';

import { ImportFeatureFlagModalComponent } from '../../features/dashboard/feature-flags/modals/import-feature-flag-modal/import-feature-flag-modal.component';
import { UpdateFlagStatusConfirmationModalComponent } from '../../features/dashboard/feature-flags/modals/update-flag-status-confirmation-modal/update-flag-status-confirmation-modal.component';
import { EditFeatureFlagModalComponent } from '../../features/dashboard/feature-flags/modals/edit-feature-flag-modal/edit-feature-flag-modal.component';
import {
  EXPORT_MODAL_ACTION,
  FEATURE_FLAG_DETAILS_PAGE_ACTIONS,
  UPSERT_FEATURE_FLAG_LIST_ACTION,
  UpsertFeatureFlagListParams,
} from '../../core/feature-flags/store/feature-flags.model';
import { UpsertFeatureFlagListModalComponent } from '../../features/dashboard/feature-flags/modals/upsert-feature-flag-list-modal/upsert-feature-flag-list-modal.component';


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
      width: '670px',
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
      width: '670px',
      height: '390px',
      autoFocus: 'input',
      disableClose: true,
    };
    return this.dialog.open(DeleteFeatureFlagModalComponent, config);
  }

  openExportAllFeatureFlagsModal(flags: FeatureFlag[]) {
    const commonModalConfig: CommonModalConfig = {
      title: 'Export All Feature Flag Designs',
      primaryActionBtnLabel: 'Export',
      primaryActionBtnColor: 'primary',
      cancelBtnLabel: 'Cancel',
      params: {
        sourceFlags: flags,
        action: EXPORT_MODAL_ACTION.EXPORT,
      },
    };
    return this.openExportConfirmationModal(commonModalConfig);
  }

  openExportFeatureFlagDesignModal(flag: FeatureFlag) {
    const commonModalConfig: CommonModalConfig = {
      title: FEATURE_FLAG_DETAILS_PAGE_ACTIONS.EXPORT_DESIGN,
      primaryActionBtnLabel: 'Export',
      primaryActionBtnColor: 'primary',
      cancelBtnLabel: 'Cancel',
      params: {
        sourceFlags: [flag],
        action: EXPORT_MODAL_ACTION.EXPORT,
      },
    };
    return this.openExportConfirmationModal(commonModalConfig);
  }

  openEmailFeatureFlagDataModal(flag: FeatureFlag) {
    const commonModalConfig: CommonModalConfig = {
      title: FEATURE_FLAG_DETAILS_PAGE_ACTIONS.EMAIL_DATA,
      primaryActionBtnLabel: 'Email',
      primaryActionBtnColor: 'primary',
      cancelBtnLabel: 'Cancel',
      params: {
        sourceFlags: [flag],
        action: EXPORT_MODAL_ACTION.MAIL,
      },
    };
    return this.openExportConfirmationModal(commonModalConfig);
  }

  openExportConfirmationModal(commonModalConfig: CommonModalConfig) {
    const config: MatDialogConfig = {
      data: commonModalConfig,
      width: '670px',
      autoFocus: 'first-heading',
      disableClose: true,
    };

    return this.dialog.open(ExportConfirmationDialogComponent, config);
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
