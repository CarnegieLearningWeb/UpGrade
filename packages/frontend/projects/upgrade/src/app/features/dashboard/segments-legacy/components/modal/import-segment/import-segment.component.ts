import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SegmentsService } from '../../../../../../core/segments/segments.service';
import { Segment, SegmentFile, importError } from '../../../../../../core/segments/store/segments.model';
import { MatTableDataSource } from '@angular/material/table';
import { TranslateService } from '@ngx-translate/core';
import { SegmentsDataService } from '../../../../../../core/segments/segments.data.service';
import { NotificationService } from '../../../../../../core/notifications/notification.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-import-segment',
  templateUrl: './import-segment.component.html',
  styleUrls: ['./import-segment.component.scss'],
  standalone: false,
})
export class ImportSegmentComponent {
  file: any;
  segmentInfo: Segment;
  uploadedFileCount = 0;
  isLoadingSegments$ = false;
  fileData: SegmentFile[] = [];
  nonErrorSegments: number;
  importFileErrorsDataSource = new MatTableDataSource<importError>();
  importFileErrors: importError[] = [];
  displayedColumns: string[] = ['File Name', 'Error'];

  constructor(
    private segmentsService: SegmentsService,
    private translate: TranslateService,
    private notificationService: NotificationService,
    private segmentDataService: SegmentsDataService,
    public dialogRef: MatDialogRef<ImportSegmentComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  onCancelClick(): void {
    this.dialogRef.close();
  }

  async importSegments() {
    try {
      this.onCancelClick();
      const importResult = (await firstValueFrom(
        this.segmentDataService.importSegments(this.fileData)
      )) as importError[];
      this.showNotification(importResult);
    } catch (error) {
      console.error('Error during segment import:', error);
    }
  }

  showNotification(importResult: importError[]) {
    const importSuccessFiles = importResult
      .filter((data) => data.error == null || data.error.startsWith('warning'))
      .map((data) => data.fileName);

    const importSuccessMsg =
      importSuccessFiles.length > 0
        ? `Successfully imported ${importSuccessFiles.length} file/s: ${importSuccessFiles.join(', ')}`
        : '';
    this.notificationService.showSuccess(importSuccessMsg);

    const importFailedFiles = importResult.filter((data) => data.error != null && !data.error.startsWith('warning'));
    importFailedFiles.forEach((data) => {
      this.notificationService.showError(`Failed to import ${data.fileName}: ${data.error}`);
    });
  }

  uploadFile(event) {
    // Get the input element from the event
    // Get the FileList from the input element
    const fileList = Array.from(event.target.files) as any[];
    this.uploadedFileCount = fileList.length;
    this.importFileErrors = [];
    this.fileData = [];

    if (this.uploadedFileCount === 0) return;
    this.isLoadingSegments$ = true;

    fileList.forEach((file) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const fileContent = e.target?.result;
        this.fileData.push({ fileName: file.name, fileContent: fileContent });
        // Check if this is the last file and validate
        if (this.fileData.length === this.uploadedFileCount) {
          await this.validateFiles();
          this.isLoadingSegments$ = false;
        }
      };
      reader.readAsText(file);
    });
  }

  async validateFiles() {
    this.importFileErrors =
      ((await this.segmentDataService.validateSegments(this.fileData).toPromise()) as importError[]) || [];
    this.importFileErrorsDataSource.data = this.importFileErrors;

    this.nonErrorSegments = this.uploadedFileCount - this.importFileErrors.length;
  }
}
