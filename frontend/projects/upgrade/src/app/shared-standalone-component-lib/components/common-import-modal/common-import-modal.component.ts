import { BehaviorSubject, combineLatest, firstValueFrom, map, Observable, Subscription } from 'rxjs';
import {
  ImportModalConfig,
  ImportResult,
  ImportServiceAdapter,
  ImportType,
  ValidationResult,
} from './common-import.types';
import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, Inject, Injector } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { TranslateModule } from '@ngx-translate/core';
import { NotificationService } from '../../../core/core.module';
import { SharedModule } from '../../../shared/shared.module';
import { CommonImportContainerComponent } from '../common-import-container/common-import-container.component';
import { CommonModalComponent } from '../common-modal/common-modal.component';
import { CommonStatusIndicatorChipComponent } from '../common-status-indicator-chip/common-status-indicator-chip.component';
import { ImportServiceFactory } from './common-import-adapter.factory';
import { CommonModalConfig } from '../common-modal/common-modal.types';
import { ImportModalParams } from '../../../shared/services/common-dialog.service';

// common-import-modal.component.ts
@Component({
  selector: 'app-common-import-modal',
  templateUrl: './common-import-modal.component.html',
  styleUrls: ['./common-import-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModalComponent,
    CommonModule,
    SharedModule,
    CommonImportContainerComponent,
    CommonStatusIndicatorChipComponent,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    TranslateModule,
  ],
})
export class CommonImportModalComponent implements OnInit, OnDestroy {
  private importAdapter: ImportServiceAdapter;
  private subscriptions = new Subscription();

  isDescriptionExpanded = false;
  displayedColumns: string[] = ['actions', 'fileName', 'compatibilityType'];
  isImportActionBtnDisabled = new BehaviorSubject<boolean>(true);
  fileValidationErrorDataSource = new MatTableDataSource<ValidationResult>();
  fileValidationErrors: ValidationResult[] = [];
  fileData: any[] = [];
  uploadedFileCount = new BehaviorSubject<number>(0);
  isLoadingImport$: Observable<boolean>;
  isImportActionBtnDisabled$: Observable<boolean>;

  ImportType = ImportType;

  constructor(
    @Inject(MAT_DIALOG_DATA) public config: CommonModalConfig<ImportModalParams>,
    public injector: Injector,
    private notificationService: NotificationService,
    public dialogRef: MatDialogRef<CommonImportModalComponent>
  ) {
    this.importAdapter = this.injector.get(this.config.params.importTypeAdapterToken);
  }

  ngOnInit() {
    this.isLoadingImport$ = this.importAdapter.getLoadingState();

    this.isImportActionBtnDisabled$ = combineLatest([this.uploadedFileCount, this.isLoadingImport$]).pipe(
      map(([uploadedCount, isLoading]) => isLoading || uploadedCount === 0)
    );

    this.subscriptions.add(this.isImportActionBtnDisabled$.subscribe());
  }

  async handleFilesSelected(event: File[]) {
    if (event.length > 0) {
      this.isImportActionBtnDisabled.next(false);
      this.importAdapter.setLoadingState(true);
    }

    this.uploadedFileCount.next(event.length);
    this.fileValidationErrors = [];
    this.fileData = [];

    if (event.length === 0) return;

    const filesArray = Array.from(event) as File[];
    await Promise.all(
      filesArray.map((file) => {
        return new Promise<void>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const fileContent = e.target?.result;
            this.fileData.push({ fileName: file.name, fileContent: fileContent });
            resolve();
          };
          reader.readAsText(file);
        });
      })
    );

    await this.checkValidation(this.fileData);
  }

  async checkValidation(files: any[]) {
    try {
      const validationErrors = await firstValueFrom(this.importAdapter.validateFiles(files, this.config.params));

      this.fileValidationErrors = validationErrors.filter((data) => data.compatibilityType != null) || [];
      this.fileValidationErrorDataSource.data = this.fileValidationErrors;
      this.importAdapter.setLoadingState(false);

      if (this.fileValidationErrors.length > 0) {
        this.fileValidationErrors.forEach((error) => {
          if (error.compatibilityType === 'incompatible') {
            this.isImportActionBtnDisabled.next(true);
          }
        });
      }
    } catch (error) {
      console.error('Error during validation:', error);
      this.importAdapter.setLoadingState(false);
    }
  }

  toggleExpand() {
    this.isDescriptionExpanded = !this.isDescriptionExpanded;
  }

  async importFiles() {
    try {
      this.isImportActionBtnDisabled.next(true);
      const importResult = await firstValueFrom(this.importAdapter.importFiles(this.fileData, this.config.params));

      this.showNotification(importResult);
      this.isImportActionBtnDisabled.next(false);
      this.uploadedFileCount.next(0);
      this.fileData = [];
    } catch (error) {
      console.error('Error during import:', error);
      this.isImportActionBtnDisabled.next(false);
    }
  }

  showNotification(importResult: ImportResult[]) {
    const importSuccessFiles = importResult.filter((data) => data.error == null).map((data) => data.fileName);

    let importSuccessMsg = '';
    if (importSuccessFiles.length > 0) {
      importSuccessMsg = `Successfully imported ${importSuccessFiles.length} file/s: ${importSuccessFiles.join(', ')}`;
      this.closeModal();
      if (this.importAdapter.fetchData) {
        this.importAdapter.fetchData(true);
      }
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

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
