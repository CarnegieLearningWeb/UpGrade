import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SegmentsService } from '../../../../../../core/segments/segments.service';
import { Segment, SegmentFile, SegmentImportError } from '../../../../../../core/segments/store/segments.model';
import { MatTableDataSource } from '@angular/material/table';
import { TranslateService } from '@ngx-translate/core';
import { SegmentsDataService } from '../../../../../../core/segments/segments.data.service';
import { NotificationService } from '../../../../../../core/notifications/notification.service';

@Component({
  selector: 'app-import-segment',
  templateUrl: './import-segment.component.html',
  styleUrls: ['./import-segment.component.scss'],
})
export class ImportSegmentComponent {
  file: any;
  segmentInfo: Segment;
  uploadedFileCount = 0;
  isLoadingSegments$ = false;
  fileData: SegmentFile[] = [];
  nonErrorSegments: number;
  importFileErrorsDataSource = new MatTableDataSource<SegmentImportError>();
  importFileErrors: SegmentImportError[] = [];
  displayedColumns: string[] = ['File Name', 'Error'];

  constructor(
    private segmentsService: SegmentsService,
    private translate: TranslateService,
    private notificationService: NotificationService,
    private segmentdataService: SegmentsDataService,
    public dialogRef: MatDialogRef<ImportSegmentComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  onCancelClick(): void {
    this.dialogRef.close();
  }

  async importSegments() {
    const importResult = (await this.segmentdataService
      .importSegments(this.fileData)
      .toPromise()) as SegmentImportError[];

    this.showNotification(importResult);
    this.onCancelClick();

    this.segmentsService.fetchSegments(true);
  }

  showNotification(importResult: SegmentImportError[]) {
    const importSuccessFiles = importResult.filter((data) => data.error == null).map((data) => data.fileName);

    const importSuccessMsg =
      importSuccessFiles.length > 0
        ? `Successfully imported ${importSuccessFiles.length} file/s: ${importSuccessFiles.join(', ')}`
        : '';
    this.notificationService.showSuccess(importSuccessMsg);

    const importFailedFiles = importResult.filter((data) => data.error != null);
    importFailedFiles.forEach((data) => {
      this.notificationService.showError(`Failed to import ${data.fileName}: ${data.error}`);
    });
  }

  uploadFile(event) {
    // Get the input element from the event
    // Get the FileList from the input element
    const index = 0;
    const fileList = event.target.files;
    this.uploadedFileCount = fileList.length;
    const reader = new FileReader();
    this.importFileErrors = [];
    this.fileData = [];

    if (this.uploadedFileCount === 0) return;
    this.isLoadingSegments$ = true;

    const readFile = (fileIndex) => {
      if (fileIndex >= this.uploadedFileCount) {
        // Check if this is the last file
        this.validateFiles();
        this.isLoadingSegments$ = false;
        return;
      }
      const file = fileList.item(fileIndex);
      reader.onload = (e) => {
        const fileContent = e.target?.result as any;
        this.fileData.push({ fileName: file.name, fileContent: fileContent });
        readFile(fileIndex + 1);
      };
      reader.readAsText(file);
    };

    readFile(index);
  }

  async validateFiles() {
    this.importFileErrors =
      ((await this.segmentdataService.validateSegments(this.fileData).toPromise()) as SegmentImportError[]) || [];
    this.importFileErrorsDataSource.data = this.importFileErrors;

    this.nonErrorSegments = this.uploadedFileCount - this.importFileErrors.length;
  }
}
