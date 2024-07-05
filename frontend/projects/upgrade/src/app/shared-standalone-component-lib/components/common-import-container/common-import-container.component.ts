import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Inject, Input, OnInit, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../shared/shared.module';
import { CommonModalComponent } from '../common-modal/common-modal.component';

/**
 * A reusable component for drag-and-drop file import functionality.
 * This component allows users to drag and drop files or select them via a file input.
 * It supports specifying a file type and emits the selected files to the parent component.
 *
 * The component accepts the following inputs:
 * - `fileType`: A string representing the accepted file type (e.g., '.json'). Only files with this extension can be selected or dropped.
 * - `buttonLabel`: A string representing the label text of the button. Defaults to 'Upload File'.
 *
 * The component emits the following outputs:
 * - `filesSelected`: An event that emits the selected files as an array of `File` objects.
 *
 * Example usage:
 *
 * ```
 * <app-common-drag-and-drop-file-import
 *   fileType=".json"
 *   buttonLabel="Import JSON Files"
 *   (filesSelected)="handleFilesSelected($event)"
 * ></app-common-drag-and-drop-file-import>
 * ```
 */
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
