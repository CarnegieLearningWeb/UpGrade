import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import {
  CommonModalComponent,
  CommonStatusIndicatorChipComponent,
} from '../../../../../shared-standalone-component-lib/components';
import { BehaviorSubject, Observable, combineLatest, firstValueFrom, map } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../../../shared/shared.module';
import { CommonImportContainerComponent } from '../../../../../shared-standalone-component-lib/components/common-import-container/common-import-container.component';
import { FeatureFlagsDataService } from '../../../../../core/feature-flags/feature-flags.data.service';
import { CommonModalConfig } from '../../../../../shared-standalone-component-lib/components/common-modal/common-modal.types';
import { FeatureFlagsService } from '../../../../../core/feature-flags/feature-flags.service';
import { MatTableDataSource } from '@angular/material/table';
import { ValidateFeatureFlagError } from '../../../../../core/feature-flags/store/feature-flags.model';
import { importError } from '../../../../../core/segments/store/segments.model';
import { NotificationService } from '../../../../../core/notifications/notification.service';
import { IFeatureFlagFile } from 'upgrade_types';

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
  uploadedFileCount = new BehaviorSubject<number>(0);
  isLoadingImportFeatureFlag$ = this.featureFlagsService.isLoadingImportFeatureFlag$;
  isImportActionBtnDisabled$: Observable<boolean> = combineLatest([
    this.uploadedFileCount,
    this.isLoadingImportFeatureFlag$,
  ]).pipe(map(([uploadedCount, isLoading]) => isLoading || uploadedCount === 0));

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: CommonModalConfig,
    public featureFlagsService: FeatureFlagsService,
    public featureFlagsDataService: FeatureFlagsDataService,
    public dialogRef: MatDialogRef<ImportFeatureFlagModalComponent>,
    private notificationService: NotificationService
  ) {}

  async handleFilesSelected(event) {
    if (event.length > 0) {
      this.isImportActionBtnDisabled.next(false);
      this.featureFlagsService.setIsLoadingImportFeatureFlag(true);
    }

    this.uploadedFileCount.next(event.length);
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

    await this.checkValidation(this.fileData);
  }

  async checkValidation(files: IFeatureFlagFile[]) {
    try {
      const validationErrors = (await firstValueFrom(
        this.featureFlagsDataService.validateFeatureFlag({ files: files })
      )) as ValidateFeatureFlagError[];
      this.fileValidationErrors = validationErrors.filter((data) => data.compatibilityType != null) || [];
      this.fileValidationErrorDataSource.data = this.fileValidationErrors;
      this.featureFlagsService.setIsLoadingImportFeatureFlag(false);

      if (this.fileValidationErrors.length > 0) {
        this.fileValidationErrors.forEach((error) => {
          if (error.compatibilityType === 'incompatible') {
            this.isImportActionBtnDisabled.next(true);
          }
        });
      }
    } catch (error) {
      console.error('Error during validation:', error);
      this.featureFlagsService.setIsLoadingImportFeatureFlag(false);
    }
  }

  toggleExpand() {
    this.isDescriptionExpanded = !this.isDescriptionExpanded;
  }

  async importFiles() {
    try {
      this.isImportActionBtnDisabled.next(true);
      const importResult = (await firstValueFrom(
        this.featureFlagsDataService.importFeatureFlag({ files: this.fileData })
      )) as importError[];

      this.showNotification(importResult);
      this.isImportActionBtnDisabled.next(false);
      this.uploadedFileCount.next(0);
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
  }

  closeModal() {
    this.dialogRef.close();
  }
}
