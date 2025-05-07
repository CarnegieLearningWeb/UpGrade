import { BehaviorSubject, combineLatest, finalize, map, Observable, Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, Inject, Injector } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { NotificationService } from '../../../core/core.module';
import { SharedModule } from '../../../shared/shared.module';
import { CommonImportContainerComponent } from '../common-import-container/common-import-container.component';
import { CommonModalComponent } from '../common-modal/common-modal.component';
import { CommonStatusIndicatorChipComponent } from '../common-status-indicator-chip/common-status-indicator-chip.component';
import { CommonModalConfig } from '../common-modal/common-modal.types';
import { IMPORT_COMPATIBILITY_TYPE, ValidatedImportResponse } from 'upgrade_types';
import { ImportServiceAdapter } from './common-import-type-adapters';
import { ImportModalParams } from '../../../shared/services/common-dialog.service';

/**
 * CommonImportModalComponent
 *
 * A reusable modal component for handling file imports of various types.
 * This component is composed with CommonModalComponent to provide a UI for uploading,
 * validating, and importing files.
 *
 * @description
 * This component is designed to be type-agnostic for imports by using an adapter pattern.
 * It requires an implementation of ImportServiceAdapter to be provided via dependency injection.
 * This allows the component to work with different import types without changing its core logic.
 *
 * The component handles:
 * - File selection and upload
 * - File validation
 * - Displaying validation results
 * - Importing validated files
 * - Displaying success/error notifications
 *
 * @usage
 * This component is launched through CommonDialogService with ImportModalParams.
 * The service injects the appropriate ImportServiceAdapter based on the import type.
 *
 * Example:
 * ```typescript
 * this.dialogService.openImportModal({
 *   importTypeAdapterToken: SOME_IMPORT_ADAPTER_TOKEN,
 *   messageKey: 'import.message',
 *   warningMessageKey: 'import.warning',
 *   incompatibleMessageKey: 'import.incompatible'
 * });
 * ```
 *
 * @interface ImportServiceAdapter
 * The adapter interface that must be implemented by services:
 * ```typescript
 * export interface ImportServiceAdapter {
 *   validateFiles(files: any[], params?: any): Observable<ValidatedImportResponse[]>;
 *   importFiles(files: any[], params?: any): Observable<ValidatedImportResponse[]>;
 *   getLoadingState(): Observable<boolean>;
 *   setLoadingState(isLoading: boolean): void;
 *   fetchData(): void;
 * }
 * ```
 *
 * @interface ImportModalParams
 * The parameters needed to configure the import modal:
 * ```typescript
 * interface ImportModalParams {
 *   importTypeAdapterToken: InjectionToken<ImportServiceAdapter>;
 *   messageKey: string;              // Translation key for import message
 *   warningMessageKey: string;       // Translation key for warning message
 *   incompatibleMessageKey: string;  // Translation key for incompatible message
 *   flagId?: string;                 // Optional: for feature flag list import
 *   listType?: FEATURE_FLAG_LIST_FILTER_MODE; // Optional: for feature flag list import
 * }
 * ```
 *
 * @see CommonModalComponent
 * @see ImportServiceAdapter
 * @see CommonDialogService
 */

@Component({
  selector: 'app-common-import-modal',
  templateUrl: './common-import-modal.component.html',
  styleUrl: './common-import-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModalComponent,
    CommonModule,
    SharedModule,
    CommonImportContainerComponent,
    CommonStatusIndicatorChipComponent,
  ],
})
export class CommonImportModalComponent implements OnInit, OnDestroy {
  private importAdapter: ImportServiceAdapter;
  subscriptions = new Subscription();

  expandedRows = new Set<number>();
  displayedColumns: string[] = ['actions', 'fileName', 'compatibilityType'];
  fileValidationErrorDataSource: MatTableDataSource<ValidatedImportResponse>;
  fileData: { fileName: string; fileContent: string | ArrayBuffer }[] = [];
  uploadedFileCount = new BehaviorSubject<number>(0);
  isLoadingImport$: Observable<boolean>;
  isImportActionBtnDisabled$: Observable<boolean>;
  validationResponse$ = new BehaviorSubject<ValidatedImportResponse[]>([]);
  importableFiles$ = new BehaviorSubject<{ fileName: string; fileContent: string | ArrayBuffer }[]>([]);
  mixedCompatibilityMessage$: Observable<string>;

  // Add an isImporting flag to track when the import is in progress
  private isImportingSubject = new BehaviorSubject<boolean>(false);
  isImporting$ = this.isImportingSubject.asObservable();

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

    this.isImportActionBtnDisabled$ = combineLatest([
      this.isLoadingImport$,
      this.importableFiles$,
      this.isImporting$,
    ]).pipe(
      map(([isLoading, importableFiles, isImporting]) => {
        return isLoading || importableFiles.length === 0 || isImporting;
      })
    );

    this.mixedCompatibilityMessage$ = this.validationResponse$.pipe(
      map((validationResponse) => {
        const message = 'common-import-modal.incompatible-import-warning.text';
        const incompatibleFiles = validationResponse.filter(
          (item) => item.compatibilityType === IMPORT_COMPATIBILITY_TYPE.INCOMPATIBLE
        );

        // if we have more than one file, and some are incompatible, but not all, then show this message
        if (validationResponse.length > 1 && incompatibleFiles.length !== validationResponse.length) {
          return message;
        } else {
          return '';
        }
      })
    );
  }

  async handleFilesSelected(event: []) {
    if (event.length === 0) return;

    this.importAdapter.setLoadingState(true);
    this.uploadedFileCount.next(event.length);
    this.validationResponse$.next([]);

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

    this.checkValidation(this.fileData);
  }

  checkValidation(files: any[]) {
    const validatedFilesSubscription = this.importAdapter
      .validateFiles(files, this.config.params)
      .subscribe((validationResponse) => {
        this.importAdapter.setLoadingState(false);
        this.validationResponse$.next(validationResponse);
        this.fileValidationErrorDataSource = new MatTableDataSource(validationResponse);
        const importableFiles = this.fileData.filter((file) => {
          const validationItem = validationResponse.find((item) => {
            return file.fileName.includes(item.fileName);
          });
          return validationItem?.compatibilityType !== IMPORT_COMPATIBILITY_TYPE.INCOMPATIBLE;
        });
        this.importableFiles$.next(importableFiles);
      });

    this.subscriptions.add(validatedFilesSubscription);
  }

  importFiles() {
    const filesToImport = this.importableFiles$.getValue();
    this.isImportingSubject.next(true);

    const importSubscription = this.importAdapter
      .importFiles(filesToImport, this.config.params)
      .pipe(
        finalize(() => {
          this.isImportingSubject.next(false);
        })
      )
      .subscribe((importResult) => {
        this.showNotification(importResult);
      });

    this.subscriptions.add(importSubscription);
  }

  toggleExpand(rowIndex: number) {
    if (this.expandedRows.has(rowIndex)) {
      this.expandedRows.delete(rowIndex);
    } else {
      this.expandedRows.add(rowIndex);
    }
  }

  showNotification(importResult: ValidatedImportResponse[]) {
    const importSuccessFiles = importResult
      .filter((data) => data.error == null || data.error.startsWith('warning'))
      .map((data) => data.fileName);

    let importSuccessMsg = '';
    if (importSuccessFiles.length > 0) {
      importSuccessMsg = `Successfully imported ${importSuccessFiles.length} file/s: ${importSuccessFiles.join(', ')}`;
      if (this.importAdapter.fetchData) {
        this.importAdapter.fetchData(true);
      }
    }

    this.notificationService.showSuccess(importSuccessMsg);

    const importFailedFiles = importResult.filter((data) => data.error != null && !data.error.startsWith('warning'));
    importFailedFiles.forEach((data) => {
      this.notificationService.showError(`Failed to import ${data.fileName}: ${data.error}`);
    });

    this.closeModal();
  }

  closeModal() {
    this.dialogRef.close();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
