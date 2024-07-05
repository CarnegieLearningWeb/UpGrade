import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Inject, Input, OnInit, Output, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { BehaviorSubject } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ImportFeatureFlagModalComponent } from '../../../features/dashboard/feature-flags/modals/import-feature-flag-modal/import-feature-flag-modal.component';
import { SharedModule } from '../../../shared/shared.module';
import { CommonModalConfig } from '../common-modal/common-modal-config';
import { CommonModalComponent } from '../common-modal/common-modal.component';

@Component({
  selector: 'app-common-import-container',
  standalone: true,
  imports: [CommonModalComponent, CommonModule, SharedModule],
  templateUrl: './common-import-container.component.html',
  styleUrls: ['./common-import-container.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommonImportContainerComponent {
  @Input() fileType!: string;
  @Input() buttonLabel!: string;
  @Output() filesSelected = new EventEmitter<File[]>();

  isDragOver = false;

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const validFiles = Array.from(files).filter(file => this.isValidFileType(file));
      if (validFiles.length > 0) {
        this.filesSelected.emit(validFiles);
      } else {
        console.error('Invalid file types.');
      }
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (files && files.length > 0) {
      const validFiles = Array.from(files).filter(file => this.isValidFileType(file));
      if (validFiles.length > 0) {
        this.filesSelected.emit(validFiles);
      } else {
        console.error('Invalid file types.');
      }
    }
  }

  private isValidFileType(file: File): boolean {
    const acceptedTypes = this.fileType.split(',').map(type => type.trim());
    return acceptedTypes.some(type => file.name.endsWith(type));
  }
}
