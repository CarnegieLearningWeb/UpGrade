import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  forwardRef,
  Input,
  OnDestroy,
  Output,
} from '@angular/core';
import { FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule, ControlValueAccessor } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { CommonImportContainerComponent } from '../common-import-container/common-import-container.component';
import { CommonLearnMoreLinkComponent } from '../common-learn-more-link/common-learn-more-link.component';
import { mergeUniqueListValues, parseSingleColumnCSV, splitListValues } from './common-list-values-input.helpers';

interface ListValueRow {
  id: number;
  value: string;
}

@Component({
  selector: 'app-common-list-values-input',
  templateUrl: './common-list-values-input.component.html',
  styleUrl: './common-list-values-input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CommonListValuesInputComponent),
      multi: true,
    },
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatTableModule,
    MatTooltipModule,
    TranslateModule,
    CommonImportContainerComponent,
    CommonLearnMoreLinkComponent,
  ],
})
export class CommonListValuesInputComponent implements ControlValueAccessor, OnDestroy {
  @Input() label = '';
  @Input() placeholder = '';
  @Input() loading = false;
  @Input() loadingCount: number | null = null;
  @Output() downloadRequested = new EventEmitter<string[]>();
  @Output() pendingStateChanged = new EventEmitter<boolean>();

  readonly displayedColumns = ['value', 'actions'];

  pendingValueControl = new FormControl('', { nonNullable: true });
  searchControl = new FormControl('', { nonNullable: true });
  editValueControl = new FormControl('', { nonNullable: true });

  rows: ListValueRow[] = [];
  filteredRows: ListValueRow[] = [];
  editingRowId: number | null = null;
  showImportHelper = false;
  importFailed = false;
  feedbackMessage = '';
  editErrorMessage = '';
  isDisabled = false;

  private nextRowId = 0;
  private lastPendingState = false;
  private subscriptions = new Subscription();
  private onChange: (values: string[]) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  constructor(private translate: TranslateService, private changeDetectorRef: ChangeDetectorRef) {
    this.subscriptions.add(this.pendingValueControl.valueChanges.subscribe(() => this.emitPendingState()));
    this.subscriptions.add(this.searchControl.valueChanges.subscribe(() => this.updateFilteredRows()));
  }

  get hasPendingValue(): boolean {
    return this.pendingValueControl.value.trim().length > 0;
  }

  get displayedValueCount(): number {
    return this.loading && this.loadingCount !== null ? this.loadingCount : this.rows.length;
  }

  get hasPendingChanges(): boolean {
    return this.hasPendingValue || this.showImportHelper || this.editingRowId !== null;
  }

  writeValue(values: string[] | null): void {
    this.pendingValueControl.setValue('', { emitEvent: false });
    this.showImportHelper = false;
    this.importFailed = false;
    this.feedbackMessage = '';
    this.rows = (values ?? []).map((value) => this.createRow(value));
    this.cancelEdit();
    this.emitPendingState();
    this.updateFilteredRows();
  }

  registerOnChange(fn: (values: string[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
    this.changeDetectorRef.markForCheck();
  }

  openImportHelper(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.feedbackMessage = '';
    this.importFailed = false;
    this.showImportHelper = true;
    this.emitPendingState();
  }

  closeImportHelper(event?: MouseEvent): void {
    event?.preventDefault();
    this.showImportHelper = false;
    this.importFailed = false;
    this.emitPendingState();
    this.changeDetectorRef.markForCheck();
  }

  onPendingValueKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter') {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    this.commitPendingValues();
  }

  onPendingValuePaste(event: ClipboardEvent): void {
    const pastedValue = event.clipboardData?.getData('text') ?? '';
    if (!/[,\t\r\n]/.test(pastedValue)) {
      return;
    }

    event.preventDefault();
    const input = event.target as HTMLInputElement | null;
    const currentValue = this.pendingValueControl.value;
    const selectionStart = input?.selectionStart ?? currentValue.length;
    const selectionEnd = input?.selectionEnd ?? selectionStart;
    const normalizedPastedValue = pastedValue.replace(/\r\n?/g, '\n').replace(/[\t\n]+/g, ',');
    const nextValue = `${currentValue.slice(0, selectionStart)}${normalizedPastedValue}${currentValue.slice(
      selectionEnd
    )}`;

    this.pendingValueControl.setValue(nextValue);
  }

  commitPendingValues(): void {
    this.addRawValues(this.pendingValueControl.value);
    this.pendingValueControl.setValue('');
  }

  commitPendingChanges(): boolean {
    if (!this.hasPendingChanges) {
      return true;
    }

    this.feedbackMessage = this.translate.instant('lists.values.pending-action-required.text');
    this.changeDetectorRef.markForCheck();
    return false;
  }

  startEdit(row: ListValueRow): void {
    this.editingRowId = row.id;
    this.editValueControl.setValue(row.value);
    this.editErrorMessage = '';
    this.markAsTouched();
    this.emitPendingState();
    this.changeDetectorRef.markForCheck();
  }

  saveEdit(row: ListValueRow): void {
    const nextValue = this.editValueControl.value.trim();
    if (!nextValue) {
      this.editErrorMessage = this.translate.instant('lists.values.edit-empty-error.text');
      this.changeDetectorRef.markForCheck();
      return;
    }

    if (this.rows.some((currentRow) => currentRow.id !== row.id && currentRow.value === nextValue)) {
      this.editErrorMessage = this.translate.instant('lists.values.edit-duplicate-error.text');
      this.changeDetectorRef.markForCheck();
      return;
    }

    this.rows = this.rows.map((currentRow) =>
      currentRow.id === row.id ? { ...currentRow, value: nextValue } : currentRow
    );
    this.editingRowId = null;
    this.editErrorMessage = '';
    this.feedbackMessage = '';
    this.emitPendingState();
    this.emitValues();
  }

  cancelEdit(): void {
    this.editingRowId = null;
    this.editValueControl.setValue('');
    this.editErrorMessage = '';
    this.emitPendingState();
    this.changeDetectorRef.markForCheck();
  }

  deleteValue(row: ListValueRow): void {
    this.rows = this.rows.filter((currentRow) => currentRow.id !== row.id);
    if (this.editingRowId === row.id) {
      this.cancelEdit();
    }
    this.feedbackMessage = '';
    this.markAsTouched();
    this.emitValues();
  }

  exportValues(): void {
    this.downloadRequested.emit(this.getValues());
  }

  refreshSearch(): void {
    this.updateFilteredRows();
  }

  async handleFilesSelected(files: File[]): Promise<void> {
    try {
      const fileContents = await Promise.all(files.map((file) => this.readFile(file)));
      const importedValues = fileContents.flatMap((content) => parseSingleColumnCSV(content));

      this.pendingValueControl.setValue(importedValues.join(', '));
      this.showImportHelper = false;
      this.importFailed = false;
      this.feedbackMessage = '';
      this.emitPendingState();
      this.changeDetectorRef.markForCheck();
    } catch {
      this.importFailed = true;
      this.emitPendingState();
      this.changeDetectorRef.markForCheck();
    }
  }

  trackByRowId(_index: number, row: ListValueRow): number {
    return row.id;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private addRawValues(rawValue: string): void {
    const incomingValues = splitListValues(rawValue);
    if (!incomingValues.length) {
      return;
    }

    const result = mergeUniqueListValues(this.getValues(), incomingValues);
    result.addedValues.forEach((value) => this.rows.push(this.createRow(value)));
    this.setDuplicateFeedback(result.duplicateValues.length);
    this.markAsTouched();
    this.emitValues();
  }

  private setDuplicateFeedback(duplicateCount: number): void {
    this.feedbackMessage = duplicateCount
      ? this.translate.instant('lists.values.duplicates-not-added.text', { count: duplicateCount })
      : '';
  }

  private emitValues(): void {
    this.onChange(this.getValues());
    this.updateFilteredRows();
  }

  private emitPendingState(): void {
    const hasPendingChanges = this.hasPendingChanges;
    if (hasPendingChanges === this.lastPendingState) {
      return;
    }

    this.lastPendingState = hasPendingChanges;
    this.pendingStateChanged.emit(hasPendingChanges);
  }

  private updateFilteredRows(): void {
    const searchValue = this.searchControl.value.trim().toLocaleLowerCase();
    this.filteredRows = searchValue
      ? this.rows.filter((row) => row.value.toLocaleLowerCase().includes(searchValue))
      : [...this.rows];
    this.changeDetectorRef.markForCheck();
  }

  private getValues(): string[] {
    return this.rows.map((row) => row.value);
  }

  private createRow(value: string): ListValueRow {
    return { id: this.nextRowId++, value };
  }

  markAsTouched(): void {
    this.onTouched();
  }

  private readFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }
}
