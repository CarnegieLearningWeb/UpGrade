import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { CommonModalComponent, CommonStatusIndicatorChipComponent } from '../../../../../shared-standalone-component-lib/components';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { BehaviorSubject, Observable, combineLatest, map } from 'rxjs';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../../../shared/shared.module';
import { CommonImportContainerComponent } from '../../../../../shared-standalone-component-lib/components/common-import-container/common-import-container.component';
import { FeatureFlagsDataService } from '../../../../../core/feature-flags/feature-flags.data.service';
import { CommonModalConfig } from '../../../../../shared-standalone-component-lib/components/common-modal/common-modal.types';
import { FeatureFlagsService } from '../../../../../core/feature-flags/feature-flags.service';
import { MatTableDataSource } from '@angular/material/table';

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
  imports: [CommonModalComponent, CommonModule, SharedModule, CommonImportContainerComponent, CommonStatusIndicatorChipComponent],
  templateUrl: './import-feature-flag-modal.component.html',
  styleUrls: ['./import-feature-flag-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportFeatureFlagModalComponent {
  isDescriptionExpanded = false;
  compatibilityDescription = '';
  displayedColumns: string[] = ['actions', 'fileName', 'compatibilityType'];
  isImportActionBtnDisabled = new BehaviorSubject<boolean>(true);
  importFileErrorsDataSource = new MatTableDataSource<ValidateFeatureFlagError>();
  importFileErrors: ValidateFeatureFlagError[] = [];
  fileData: FeatureFlagFile[] = [];
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
    public dialogRef: MatDialogRef<ImportFeatureFlagModalComponent>
  ) {}

  async handleFilesSelected(event) {
    if (event.target.files.length > 0) {
      this.isImportActionBtnDisabled.next(false);
      this.featureFlagsService.setIsLoadingImportFeatureFlag(true);
    }

    this.uploadedFileCount.next(event.target.files.length);
    this.importFileErrors = [];
    this.fileData = [];

    if (event.target.files.length === 0) return;

    const filesArray = Array.from(event.target.files) as any[];
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

  async checkValidation(files: FeatureFlagFile[]) {
    this.importFileErrors =
      (
        (await this.featureFlagsDataService.validateFeatureFlag(files).toPromise()) as ValidateFeatureFlagError[]
      ).filter((data) => data.compatibilityType != null) || [];
    this.importFileErrorsDataSource.data = this.importFileErrors;
    this.featureFlagsService.setIsLoadingImportFeatureFlag(false);
    if (this.importFileErrors.length > 0) {
      this.importFileErrors.forEach(error => {
        if (error.compatibilityType === 'incompatible') {
          this.isImportActionBtnDisabled.next(true);
        };
      });
    }
  }

  toggleExpand() {
    this.isDescriptionExpanded = !this.isDescriptionExpanded;
  }

  importFiles() {
    console.log('Import feature flags');
  }

  closeModal() {
    this.dialogRef.close();
  }
}
