import { ChangeDetectionStrategy, Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { CommonModalComponent } from '../../../../../shared-standalone-component-lib/components';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CommonModalConfig } from '../../../../../shared-standalone-component-lib/components/common-modal/common-modal-config';
import { BehaviorSubject } from 'rxjs';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../../../shared/shared.module';
import { CommonImportContainerComponent } from '../../../../../shared-standalone-component-lib/components/common-import-container/common-import-container.component';
import { FeatureFlagsDataService } from '../../../../../core/feature-flags/feature-flags.data.service';

export interface FeatureFlagFile {
  fileName: string;
  fileContent: string | ArrayBuffer;
}

export interface ValidateFeatureFlagError {
  fileName: string;
  compatibilityType: string;
}
@Component({
  selector: 'app-import-feature-flag-modal',
  standalone: true,
  imports: [CommonModalComponent, CommonModule, SharedModule, CommonImportContainerComponent],
  templateUrl: './import-feature-flag-modal.component.html',
  styleUrls: ['./import-feature-flag-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportFeatureFlagModalComponent {
  isImportActionBtnDisabled = new BehaviorSubject<boolean>(true);
  importFileErrors: { fileName: string; compatibilityType: string }[] = [];
  allFeatureFlags: FeatureFlagFile[] = [];
  uploadedFileCount = 0;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: CommonModalConfig,
    public dialog: MatDialog,
    public featureFlagsDataService: FeatureFlagsDataService,
    public dialogRef: MatDialogRef<ImportFeatureFlagModalComponent>
  ) {}

  async handleFilesSelected(event) {
    if (event.target.files.length > 0) {
      this.isImportActionBtnDisabled.next(false);
    }
    //Send files to validation endpoint to receive data for table
    this.uploadedFileCount = event.target.files.length;
    this.importFileErrors = [];
    this.allFeatureFlags = [];

    if (this.uploadedFileCount === 0) return;

    // Set loading to true before processing the files
    // this.isLoadingExperiments$ = true;

    const filesArray = Array.from(event.target.files) as any[];
    await Promise.all(
      filesArray.map((file) => {
        return new Promise<void>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const fileContent = e.target.result;
            this.allFeatureFlags.push({ fileName: file.name, fileContent: fileContent });
            resolve();
          };
          reader.readAsText(file);
        });
      })
    );

    await this.checkValidation(this.allFeatureFlags);
    // this.isLoadingFeatureFlag$ = false;
    const compatibility = this.checkValidation(event.target.files);
  }

  async checkValidation(files) {
    this.importFileErrors =
      (
        (await this.featureFlagsDataService.validateFeatureFlag(files).toPromise()) as ValidateFeatureFlagError[]
      ).filter((data) => data.compatibilityType != null) || [];
    console.log('Import file errors', this.importFileErrors);
  }

  importFiles() {
    console.log('Import feature flags');
  }

  closeModal() {
    this.dialogRef.close();
  }
}
