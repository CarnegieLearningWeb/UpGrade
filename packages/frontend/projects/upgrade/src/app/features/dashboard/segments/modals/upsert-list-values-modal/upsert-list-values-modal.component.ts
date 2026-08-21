import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { CommonLearnMoreLinkComponent, CommonModalComponent } from '@shared-component-lib';
import { CommonImportContainerComponent } from '@shared-component-lib/common-import-container/common-import-container.component';
import { FILE_TYPE } from 'upgrade_types';
import {
  mergeUniqueListValues,
  parseSingleColumnCSV,
  splitListValues,
} from '../../../../../core/segments/list-values.utils';

export enum LIST_VALUES_UPDATE_MODE {
  APPEND = 'append',
  REPLACE = 'replace',
}

export interface UpsertListValuesModalData {
  importOnly?: boolean;
}

export interface UpsertListValuesModalResult {
  values: string[];
  mode: LIST_VALUES_UPDATE_MODE;
  fileName?: string;
}

@Component({
  selector: 'app-upsert-list-values-modal',
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatRadioModule,
    TranslateModule,
    CommonImportContainerComponent,
    CommonLearnMoreLinkComponent,
    CommonModalComponent,
  ],
  templateUrl: './upsert-list-values-modal.component.html',
  styleUrl: './upsert-list-values-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpsertListValuesModalComponent {
  rawValues = '';
  importedValues: string[] = [];
  importDuplicateCount = 0;
  fileName = '';
  errorMessage = '';
  updateMode = LIST_VALUES_UPDATE_MODE.APPEND;
  readonly UPDATE_MODE = LIST_VALUES_UPDATE_MODE;
  readonly FILE_TYPE = FILE_TYPE;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: UpsertListValuesModalData,
    private dialogRef: MatDialogRef<UpsertListValuesModalComponent, UpsertListValuesModalResult>,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  get title(): string {
    return this.data.importOnly ? 'Import Values from CSV' : 'Add Values';
  }

  get values(): string[] {
    return this.data.importOnly ? this.importedValues : splitListValues(this.rawValues);
  }

  get primaryActionLabel(): string {
    return this.data.importOnly ? 'Import' : 'Add';
  }

  get isPrimaryActionDisabled(): boolean {
    return this.values.length === 0 || !!this.errorMessage;
  }

  onFilesSelected(files: File[]): void {
    const file = files[0];
    this.errorMessage = '';
    this.importedValues = [];
    this.importDuplicateCount = 0;
    this.fileName = file?.name ?? '';

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsedValues = parseSingleColumnCSV(String(reader.result ?? ''));
        const mergeResult = mergeUniqueListValues([], parsedValues);
        this.importedValues = mergeResult.values;
        this.importDuplicateCount = mergeResult.duplicateValues.length;
      } catch (error) {
        this.errorMessage = error instanceof Error ? error.message : 'Unable to read CSV file';
      }
      this.changeDetectorRef.markForCheck();
    };
    reader.onerror = () => {
      this.errorMessage = 'Unable to read CSV file';
      this.changeDetectorRef.markForCheck();
    };
    reader.readAsText(file);
  }

  clearImportedFile(): void {
    this.fileName = '';
    this.importedValues = [];
    this.importDuplicateCount = 0;
    this.errorMessage = '';
  }

  submit(): void {
    if (this.isPrimaryActionDisabled) {
      return;
    }

    this.dialogRef.close({ values: this.values, mode: this.updateMode, fileName: this.fileName });
  }
}
