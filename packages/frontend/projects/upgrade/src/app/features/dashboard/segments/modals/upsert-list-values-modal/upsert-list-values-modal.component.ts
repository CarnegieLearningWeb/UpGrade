import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { TranslateModule } from '@ngx-translate/core';
import { CommonLearnMoreLinkComponent, CommonModalComponent } from '@shared-component-lib';
import { CommonImportContainerComponent } from '@shared-component-lib/common-import-container/common-import-container.component';
import { FILE_TYPE } from 'upgrade_types';
import {
  containsTabCharacter,
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
    ReactiveFormsModule,
    MatFormFieldModule,
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
export class UpsertListValuesModalComponent implements OnDestroy {
  readonly rawValuesControl = new FormControl('', {
    nonNullable: true,
    validators: [(control) => (containsTabCharacter(control.value) ? { tab: true } : null)],
  });
  importedValues: string[] = [];
  fileName = '';
  errorMessage = '';
  updateMode = LIST_VALUES_UPDATE_MODE.APPEND;
  readonly UPDATE_MODE = LIST_VALUES_UPDATE_MODE;
  readonly FILE_TYPE = FILE_TYPE;
  private activeFileReader?: FileReader;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: UpsertListValuesModalData,
    private dialogRef: MatDialogRef<UpsertListValuesModalComponent, UpsertListValuesModalResult>,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  get title(): string {
    return this.data.importOnly ? 'Import Values from CSV' : 'Add Values';
  }

  get values(): string[] {
    return this.data.importOnly ? this.importedValues : splitListValues(this.rawValuesControl.value);
  }

  get primaryActionLabel(): string {
    return this.data.importOnly ? 'Import' : 'Add';
  }

  get hasUnsupportedTab(): boolean {
    return !this.data.importOnly && this.rawValuesControl.hasError('tab');
  }

  get isPrimaryActionDisabled(): boolean {
    return (
      this.values.length === 0 ||
      this.hasUnsupportedTab ||
      !!this.errorMessage ||
      (this.data.importOnly && !this.fileName)
    );
  }

  onFilesSelected(files: File[]): void {
    this.cancelActiveFileRead();

    const file = files[0];
    this.errorMessage = '';
    this.importedValues = [];
    this.fileName = file?.name ?? '';

    if (!file) {
      return;
    }

    const reader = new FileReader();
    this.activeFileReader = reader;
    reader.onload = () => {
      if (this.activeFileReader !== reader) {
        return;
      }

      try {
        this.importedValues = parseSingleColumnCSV(String(reader.result ?? ''));
      } catch (error) {
        this.errorMessage = error instanceof Error ? error.message : 'Unable to read CSV file';
      } finally {
        this.activeFileReader = undefined;
        this.changeDetectorRef.markForCheck();
      }
    };
    reader.onerror = () => {
      if (this.activeFileReader !== reader) {
        return;
      }

      this.activeFileReader = undefined;
      this.errorMessage = 'Unable to read CSV file';
      this.changeDetectorRef.markForCheck();
    };
    reader.readAsText(file);
  }

  clearImportedFile(): void {
    this.cancelActiveFileRead();
    this.fileName = '';
    this.importedValues = [];
    this.errorMessage = '';
  }

  ngOnDestroy(): void {
    this.cancelActiveFileRead();
  }

  submit(): void {
    if (this.isPrimaryActionDisabled) {
      return;
    }

    this.dialogRef.close({ values: this.values, mode: this.updateMode, fileName: this.fileName });
  }

  private cancelActiveFileRead(): void {
    const reader = this.activeFileReader;
    this.activeFileReader = undefined;

    if (!reader) {
      return;
    }

    reader.onload = null;
    reader.onerror = null;

    if (reader.readyState === FileReader.LOADING) {
      reader.abort();
    }
  }
}
