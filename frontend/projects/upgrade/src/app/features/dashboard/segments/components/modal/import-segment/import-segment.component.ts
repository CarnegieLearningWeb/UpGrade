import { Component, Inject } from '@angular/core';
import {
  MatLegacyDialogRef as MatDialogRef,
  MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA,
} from '@angular/material/legacy-dialog';
import { SegmentsService } from '../../../../../../core/segments/segments.service';
import { Segment, SegmentFile } from '../../../../../../core/segments/store/segments.model';

@Component({
  selector: 'app-import-segment',
  templateUrl: './import-segment.component.html',
  styleUrls: ['./import-segment.component.scss'],
})
export class ImportSegmentComponent {
  file: any;
  segmentInfo: Segment;
  uploadedFileCount = 0;
  fileData: SegmentFile[] = [];

  constructor(
    private segmentsService: SegmentsService,
    public dialogRef: MatDialogRef<ImportSegmentComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  onCancelClick(): void {
    this.dialogRef.close();
  }

  importSegments() {
    // TODO: improve the logic here
    this.segmentsService.importSegments(this.fileData);
    this.onCancelClick();
  }

  uploadFile(event) {
    // let fileName = '';
    // Get the input element from the event
    const inputElement = event.target as HTMLInputElement;
    // Get the FileList from the input element
    const fileList = inputElement.files;
    this.uploadedFileCount = fileList.length;

    if (fileList) {
      // Loop through the files in the FileList
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList.item(i);
        if (file) {
          // Process the file (e.g., upload to server, read its contents, etc.)
          // For demonstration purposes, we will simply log the file name
          // If you want to read the contents of the file, you can use the FileReader API
          const reader = new FileReader();
          reader.onload = (e) => {
            const fileContent = e.target?.result as any;
            this.fileData.push({ fileName: file.name, fileContent: fileContent });
          };
          reader.readAsText(file);
        }
      }
    }
  }
}
