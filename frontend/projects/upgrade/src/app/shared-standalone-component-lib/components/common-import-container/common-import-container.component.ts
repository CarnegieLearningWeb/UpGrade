import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../shared/shared.module';
import { CommonModalComponent } from '../common-modal/common-modal.component';
import { BehaviorSubject } from 'rxjs';
import { FILE_TYPE } from 'upgrade_types';

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
  @Input() fileType!: FILE_TYPE;
  @Input() buttonLabel!: string;
  @Input() showParseFailedError?: boolean;
  @Output() filesSelected = new EventEmitter<File[]>();

  isDragOver = new BehaviorSubject<boolean>(false);

  onDragOver(event: DragEvent) {
    this.handleDragState(event, true);
  }

  onDragLeave(event: DragEvent) {
    this.handleDragState(event, false);
  }

  onDrop(event: DragEvent) {
    this.handleDragState(event, false);
    this.handleFileSelection(event.dataTransfer?.files);
  }

  getFileTypeSubstring(): string {
    return this.fileType.substring(1).toUpperCase();
  }

  private handleDragState(event: DragEvent, isOver: boolean) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.next(isOver);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    this.handleFileSelection(input.files);
  }

  private handleFileSelection(files: FileList | null) {
    if (files && files.length > 0) {
      const validFiles = Array.from(files).filter((file) => file.name.endsWith(this.fileType));
      if (validFiles.length > 0) {
        this.filesSelected.emit(validFiles);
      } else {
        console.error('Invalid file types...');
      }
    }
  }
}
