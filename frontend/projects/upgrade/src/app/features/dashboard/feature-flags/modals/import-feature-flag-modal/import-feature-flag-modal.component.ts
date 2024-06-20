import { ChangeDetectionStrategy, Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { CommonModalComponent } from '../../../../../shared-standalone-component-lib/components';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CommonModalConfig } from '../../../../../shared-standalone-component-lib/components/common-modal/common-modal-config';
import { FeatureFlagsService } from '../../../../../core/feature-flags/feature-flags.service';
import { BehaviorSubject, Observable, Subscription, combineLatest, map } from 'rxjs';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../../../shared/shared.module';

@Component({
  selector: 'app-import-feature-flag-modal',
  standalone: true,
  imports: [CommonModalComponent, CommonModule, SharedModule],
  templateUrl: './import-feature-flag-modal.component.html',
  styleUrl: './import-feature-flag-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportFeatureFlagModalComponent {
  @ViewChild('fileInput') fileInput: ElementRef<HTMLInputElement>;

  isImportActionBtnDisabled = new BehaviorSubject<boolean>(true);
  isDragOver = false;
  fileName: string | null = null;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: CommonModalConfig & { flagName: string; flagId: string },
    public dialog: MatDialog,
    private featureFlagsService: FeatureFlagsService,
    public dialogRef: MatDialogRef<ImportFeatureFlagModalComponent>
  ) {}

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === 'application/json') {
        this.fileName = file.name;
        this.isImportActionBtnDisabled.next(false);
        this.handleFileInput(file);
      } else {
        alert('Please upload a valid JSON file.');
        this.fileName = null;
        this.isImportActionBtnDisabled.next(true);
      }
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (file.type === 'application/json') {
        this.fileName = file.name;
        this.isImportActionBtnDisabled.next(false);
        this.handleFileInput(file);
      } else {
        alert('Please upload a valid JSON file.');
        this.fileName = null;
        this.isImportActionBtnDisabled.next(true);
      }
    }
  }

  handleFileInput(file: File): void {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const jsonContent = e.target.result;
      console.log(JSON.parse(jsonContent));
    };
    reader.readAsText(file);
  }

  closeModal() {
    this.dialogRef.close();
  }
}
