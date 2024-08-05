import { Injectable } from '@angular/core';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { MatConfirmDialogComponent } from '../components/mat-confirm-dialog/mat-confirm-dialog.component';
import { DeleteFeatureFlagModalComponent } from '../../features/dashboard/feature-flags/modals/delete-feature-flag-modal/delete-feature-flag-modal.component';
import { ImportFeatureFlagModalComponent } from '../../features/dashboard/feature-flags/modals/import-feature-flag-modal/import-feature-flag-modal.component';
import { UpsertFeatureFlagModalComponent } from '../../features/dashboard/feature-flags/modals/upsert-feature-flag-modal/upsert-feature-flag-modal.component';
import { UpsertPrivateSegmentListModalComponent } from '../../features/dashboard/segments/modals/upsert-private-segment-list-modal/upsert-private-segment-list-modal.component';
import {
  UPSERT_PRIVATE_SEGMENT_LIST_ACTION,
  UpsertPrivateSegmentListParams,
} from '../../core/segments/store/segments.model';
import {
  FEATURE_FLAG_DETAILS_PAGE_ACTIONS,
  FeatureFlag,
  ParticipantListTableRow,
  UPSERT_FEATURE_FLAG_ACTION,
  UPSERT_FEATURE_FLAG_LIST_ACTION,
  UpsertFeatureFlagParams,
} from '../../core/feature-flags/store/feature-flags.model';
import { CommonSimpleConfirmationModalComponent } from '../../shared-standalone-component-lib/components/common-simple-confirmation-modal/common-simple-confirmation-modal.component';
import {
  CommonModalConfig,
  SimpleConfirmationModalParams,
} from '../../shared-standalone-component-lib/components/common-modal/common-modal.types';

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

  openEnableFeatureFlagConfirmModel(flagName: string) {
    const enableFlagStatusModalConfig: CommonModalConfig<SimpleConfirmationModalParams> = {
      title: 'Enable Feature Flag',
      primaryActionBtnLabel: 'Enable',
      primaryActionBtnColor: 'primary',
      cancelBtnLabel: 'Cancel',
      params: {
        message: `Are you sure you want to enable "${flagName}"?`,
        subMessage: '* Only the enabled include lists will be affected.',
        subMessageClass: 'info',
      },
    };

    return this.CommonSimpleConfirmationModalComponent(enableFlagStatusModalConfig);
  }

  openDisableFeatureFlagConfirmModel(flagName: string) {
    const disableFlagStatusModalConfig: CommonModalConfig<SimpleConfirmationModalParams> = {
      title: 'Disable Feature Flag',
      primaryActionBtnLabel: 'Disable',
      primaryActionBtnColor: 'warn',
      cancelBtnLabel: 'Cancel',
      params: {
        message: `Are you sure you want to disable "${flagName}"?`,
        subMessage: '* All enabled include lists will be disabled.',
        subMessageClass: 'warn',
      },
    };

    return this.CommonSimpleConfirmationModalComponent(disableFlagStatusModalConfig);
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

  openAddIncludeListModal(appContext: string, flagId: string) {
    const commonModalConfig: CommonModalConfig<UpsertPrivateSegmentListParams> = {
      title: 'Add Include List',
      primaryActionBtnLabel: 'Create',
      primaryActionBtnColor: 'primary',
      cancelBtnLabel: 'Cancel',
      params: {
        sourceList: null,
        sourceAppContext: appContext,
        action: UPSERT_PRIVATE_SEGMENT_LIST_ACTION.ADD_FLAG_INCLUDE_LIST,
        flagId: flagId,
      },
    };
    return this.openUpsertPrivateSegmentListModal(commonModalConfig);
  }

  openEditIncludeListModal(sourceList: ParticipantListTableRow, appContext: string, flagId: string) {
    const commonModalConfig: CommonModalConfig<UpsertPrivateSegmentListParams> = {
      title: 'Edit Include List',
      primaryActionBtnLabel: 'Save',
      primaryActionBtnColor: 'primary',
      cancelBtnLabel: 'Cancel',
      params: {
        sourceList,
        sourceAppContext: appContext,
        action: UPSERT_PRIVATE_SEGMENT_LIST_ACTION.EDIT_FLAG_INCLUDE_LIST,
        flagId: flagId,
      },
    };
    return this.openUpsertPrivateSegmentListModal(commonModalConfig);
  }

  openUpsertPrivateSegmentListModal(commonModalConfig: CommonModalConfig) {
    const config: MatDialogConfig = {
      data: commonModalConfig,
      width: '656px',
      height: 'auto',
      autoFocus: 'first-heading',
      disableClose: true,
    };
    return this.dialog.open(UpsertPrivateSegmentListModalComponent, config);
  }

  openEnableIncludeListModal(segmentName: string) {
    const enableIncludeListModalConfig: CommonModalConfig<SimpleConfirmationModalParams> = {
      title: 'Enable Include List',
      primaryActionBtnLabel: 'Enable',
      primaryActionBtnColor: 'primary',
      cancelBtnLabel: 'Cancel',
      params: {
        message: `Are you sure you want to enable "${segmentName}"?`,
      },
    };

    return this.openSimpleCommonConfirmationModal(enableIncludeListModalConfig);
  }

  openDisableIncludeListModal(segmentName: string) {
    const disableIncludeListModalConfig: CommonModalConfig<SimpleConfirmationModalParams> = {
      title: 'Disable Include List',
      primaryActionBtnLabel: 'Disable',
      primaryActionBtnColor: 'warn',
      cancelBtnLabel: 'Cancel',
      params: {
        message: `Are you sure you want to disable "${segmentName}"?`,
      },
    };

    return this.openSimpleCommonConfirmationModal(disableIncludeListModalConfig);
  }

  openDeleteIncludeListModal(segmentName: string) {
    const deleteIncludeListModalConfig: CommonModalConfig<SimpleConfirmationModalParams> = {
      title: 'Delete Include List',
      primaryActionBtnLabel: 'Delete',
      primaryActionBtnColor: 'warn',
      cancelBtnLabel: 'Cancel',
      params: {
        message: `Are you sure you want to delete "${segmentName}"?`,
      },
    };

    return this.openSimpleCommonConfirmationModal(deleteIncludeListModalConfig);
  }

  openDeleteFeatureFlagModal() {
    const commonModalConfig: CommonModalConfig = {
      title: 'Delete Feature Flag',
      primaryActionBtnLabel: 'Delete',
      primaryActionBtnColor: 'warn',
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

  openExportAllFeatureFlagsModal(warning: string): MatDialogRef<CommonSimpleConfirmationModalComponent, boolean> {
    const commonModalConfig: CommonModalConfig = {
      title: 'Export All Feature Flag Designs',
      primaryActionBtnLabel: 'Export',
      primaryActionBtnColor: 'primary',
      cancelBtnLabel: 'Cancel',
      params: {
        message: warning,
      },
    };
    return this.openCommonConfirmationModal(commonModalConfig);
  }

  openExportFeatureFlagDesignModal(warning: string): MatDialogRef<CommonSimpleConfirmationModalComponent, boolean> {
    const commonModalConfig: CommonModalConfig = {
      title: FEATURE_FLAG_DETAILS_PAGE_ACTIONS.EXPORT_DESIGN,
      primaryActionBtnLabel: 'Export',
      primaryActionBtnColor: 'primary',
      cancelBtnLabel: 'Cancel',
      params: {
        message: warning,
      },
    };
    return this.openCommonConfirmationModal(commonModalConfig);
  }

  openEmailFeatureFlagDataModal(warning: string, subtext: string): MatDialogRef<CommonSimpleConfirmationModalComponent, boolean> {
    const commonModalConfig: CommonModalConfig = {
      title: FEATURE_FLAG_DETAILS_PAGE_ACTIONS.EMAIL_DATA,
      primaryActionBtnLabel: 'Email',
      primaryActionBtnColor: 'primary',
      cancelBtnLabel: 'Cancel',
      params: {
        message: warning,
        subMessage: subtext,
        subMessageClass: 'info',
      },
    };
    return this.openCommonConfirmationModal(commonModalConfig);
  }

  openCommonConfirmationModal(commonModalConfig: CommonModalConfig): MatDialogRef<CommonSimpleConfirmationModalComponent, boolean> {
    const config: MatDialogConfig = {
      data: commonModalConfig,
      width: '656px',
      autoFocus: 'first-heading',
      disableClose: true,
    };

    return this.dialog.open(CommonSimpleConfirmationModalComponent, config);
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

  CommonSimpleConfirmationModalComponent(
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
