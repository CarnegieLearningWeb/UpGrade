import { ChangeDetectionStrategy, Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { CommonModalComponent } from '../../../../../shared-standalone-component-lib/components';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { BehaviorSubject } from 'rxjs';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../../../shared/shared.module';
import { CommonImportContainerComponent } from '../../../../../shared-standalone-component-lib/components/common-import-container/common-import-container.component';
import { CommonModalConfig } from '../../../../../shared-standalone-component-lib/components/common-modal/common-modal.types';

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

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: CommonModalConfig,
    public dialog: MatDialog,
    public dialogRef: MatDialogRef<ImportFeatureFlagModalComponent>
  ) {}

  handleFilesSelected(files: File[]) {
    if (files.length > 0) {
      this.isImportActionBtnDisabled.next(false);
    }
    console.log('Selected files:', files);
    //Send files to validation endpoint to receive data for table
  }

  handleFileInput(file: File) {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const jsonContent = e.target.result;
      console.log(JSON.parse(jsonContent));
    };
    reader.readAsText(file);
  }

  importFiles() {
    console.log('Import feature flags');
  }

  closeModal() {
    this.dialogRef.close();
  }
}
