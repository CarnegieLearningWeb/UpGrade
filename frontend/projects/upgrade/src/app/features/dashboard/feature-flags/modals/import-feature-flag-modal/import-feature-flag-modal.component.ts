import { ChangeDetectionStrategy, Component, computed, effect, Inject, signal } from '@angular/core';
import {
  CommonModalComponent,
  CommonStatusIndicatorChipComponent,
} from '../../../../../shared-standalone-component-lib/components';
import { BehaviorSubject } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../../../shared/shared.module';
import { CommonImportContainerComponent } from '../../../../../shared-standalone-component-lib/components/common-import-container/common-import-container.component';
import { CommonModalConfig } from '../../../../../shared-standalone-component-lib/components/common-modal/common-modal.types';
import { MatTableDataSource } from '@angular/material/table';
import { ValidateFeatureFlagError } from '../../../../../core/feature-flags/store/feature-flags.model';
import { importError, ImportListParams, MODEL_TYPE } from '../../../../../core/segments/store/segments.model';
import { NotificationService } from '../../../../../core/notifications/notification.service';
import { IFeatureFlagFile } from 'upgrade_types';
import { FeatureFlagsStore } from './feature-flag.signal.store';

@Component({
  selector: 'app-import-feature-flag-modal',
  standalone: true,
  imports: [
    CommonModalComponent,
    CommonModule,
    SharedModule,
    CommonImportContainerComponent,
    CommonStatusIndicatorChipComponent,
  ],
  templateUrl: './import-feature-flag-modal.component.html',
  styleUrls: ['./import-feature-flag-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportFeatureFlagModalComponent {
  isDescriptionExpanded = false;
  compatibilityDescription = '';
  displayedColumns: string[] = ['actions', 'fileName', 'compatibilityType'];
  isImportActionBtnDisabled = new BehaviorSubject<boolean>(true);
  fileValidationErrorDataSource = new MatTableDataSource<ValidateFeatureFlagError>();
  fileValidationErrors: ValidateFeatureFlagError[] = [];
  fileData: IFeatureFlagFile[] = [];
  uploadedFileCount = signal(0);
  isLoadingImportFeatureFlag$ = this.featureFlagStore.isLoadingImportFeatureFlag;
  isImportActionBtnDisabled$ = computed(() => {
    const uploadedCount = this.uploadedFileCount();
    const isLoading = this.isLoadingImportFeatureFlag$();
    return isLoading || uploadedCount === 0;
  });

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: CommonModalConfig<ImportListParams>,
    public dialogRef: MatDialogRef<ImportFeatureFlagModalComponent>,
    private notificationService: NotificationService,
    private featureFlagStore: FeatureFlagsStore
  ) {
    effect(
      () => {
        if (this.featureFlagStore.importResults().length > 0) {
          this.showNotification(this.featureFlagStore.importResults());
        }
        if (this.featureFlagStore.validationErrors().length > 0) {
          this.checkValidation(this.featureFlagStore.validationErrors());
        }
      },
      { allowSignalWrites: true }
    );
  }

  async handleFilesSelected(event) {
    if (event.length > 0) {
      this.isImportActionBtnDisabled.next(false);
      this.featureFlagStore.setLoadingImportFeatureFlag(true);
    }

    this.uploadedFileCount.set(event.length);
    this.fileValidationErrors = [];
    this.fileData = [];

    if (event.length === 0) return;

    const filesArray = Array.from(event) as any[];
    await Promise.all(
      filesArray.map((file) => {
        return new Promise<void>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const fileContent = e.target.result;
            this.fileData.push({ fileName: file.name, fileContent: fileContent });
            resolve();
          };
          reader.readAsText(file);
        });
      })
    );

    if (this.data.params.modelType === MODEL_TYPE.FEATURE_FLAG) {
      this.featureFlagStore.validateFeatureFlags(this.fileData);
    } else if (this.data.params.modelType === MODEL_TYPE.LIST) {
      this.featureFlagStore.validateFeatureFlagList({
        fileData: this.fileData,
        flagId: this.data.params.flagId,
        listType: this.data.params.listType,
      });
    }
  }

  async checkValidation(validationErrors: ValidateFeatureFlagError[]) {
    try {
      this.fileValidationErrors = validationErrors.filter((data) => data.compatibilityType != null) || [];
      this.fileValidationErrorDataSource.data = this.fileValidationErrors;
      this.featureFlagStore.setLoadingImportFeatureFlag(false);

      if (this.fileValidationErrors.length > 0) {
        this.fileValidationErrors.forEach((error) => {
          if (error.compatibilityType === 'incompatible') {
            this.isImportActionBtnDisabled.next(true);
          }
        });
      }
    } catch (error) {
      console.error('Error during validation:', error);
      this.featureFlagStore.setLoadingImportFeatureFlag(false);
    }
    this.featureFlagStore.setValidationErrors([]);
  }

  toggleExpand() {
    this.isDescriptionExpanded = !this.isDescriptionExpanded;
  }

  async importFiles() {
    try {
      this.isImportActionBtnDisabled.next(true);

      if (this.data.params.modelType === MODEL_TYPE.FEATURE_FLAG) {
        this.featureFlagStore.importFeatureFlags({ files: this.fileData });
      } else if (this.data.params.modelType === MODEL_TYPE.LIST) {
        this.featureFlagStore.importFeatureFlagList({
          fileData: this.fileData,
          flagId: this.data.params.flagId,
          listType: this.data.params.listType,
        });
      }

      this.isImportActionBtnDisabled.next(false);
      this.fileData = [];
    } catch (error) {
      console.error('Error during import:', error);
      this.isImportActionBtnDisabled.next(false);
    }
  }

  showNotification(importResult: importError[]) {
    const importSuccessFiles = importResult.filter((data) => data.error == null).map((data) => data.fileName);

    let importSuccessMsg = '';
    if (importSuccessFiles.length > 0) {
      importSuccessMsg = `Successfully imported ${importSuccessFiles.length} file/s: ${importSuccessFiles.join(', ')}`;
      this.closeModal();
    }

    this.notificationService.showSuccess(importSuccessMsg);

    const importFailedFiles = importResult.filter((data) => data.error != null);
    importFailedFiles.forEach((data) => {
      this.notificationService.showError(`Failed to import ${data.fileName}: ${data.error}`);
    });

    this.featureFlagStore.setImportResults([]);
  }

  closeModal() {
    this.dialogRef.close();
  }
}
