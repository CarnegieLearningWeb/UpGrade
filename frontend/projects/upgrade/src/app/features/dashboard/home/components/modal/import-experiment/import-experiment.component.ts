import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  Experiment,
  ValidateExperimentError,
  ExperimentFile,
} from '../../../../../../core/experiments/store/experiments.model';
import { ExperimentService } from '../../../../../../core/experiments/experiments.service';
import { MatTableDataSource } from '@angular/material/table';
import { ExperimentDataService } from '../../../../../../core/experiments/experiments.data.service';
import { NotificationService } from '../../../../../../core/notifications/notification.service';

@Component({
  selector: 'app-import-experiment',
  templateUrl: './import-experiment.component.html',
  styleUrls: ['./import-experiment.component.scss'],
})
export class ImportExperimentComponent implements OnInit {
  experimentInfo: Experiment;
  allExperiments: ExperimentFile[] = [];
  nonErrorExperiments: number;
  importFileErrorsDataSource = new MatTableDataSource<{ fileName: string; error: string }>();
  importFileErrors: { fileName: string; error: string }[] = [];
  displayedColumns: string[] = ['File Name', 'Error'];
  uploadedFileCount = 0;

  isLoadingExperiments$ = false;

  constructor(
    private experimentService: ExperimentService,
    public dialogRef: MatDialogRef<ImportExperimentComponent>,
    private dataService: ExperimentDataService,
    private notificationService: NotificationService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  ngOnInit() {}

  onCancelClick(): void {
    this.dialogRef.close();
  }

  async importExperiment() {
    const importResult = (await this.dataService
      .importExperiment(this.allExperiments)
      .toPromise()) as ValidateExperimentError[];
    //this.experimentService.importExperiment(this.allExperiments);
    this.showNotification(importResult);
    this.onCancelClick();

    this.experimentService.loadExperiments(true);
  }

  showNotification(importResult: ValidateExperimentError[]) {
    const importSuccessFiles = importResult
      .filter((data) => data.error == null || data.error.startsWith('Warning'))
      .map((data) => data.fileName);

    const importSuccessMsg =
      importSuccessFiles.length > 0
        ? `Successfully imported ${importSuccessFiles.length} files: ${importSuccessFiles.join(', ')}`
        : '';
    this.notificationService.showSuccess(importSuccessMsg);

    const importFailedFiles = importResult.filter((data) => data.error != null && !data.error.startsWith('Warning'));
    importFailedFiles.forEach((data) => {
      this.notificationService.showError(`Failed to import ${data.fileName}: ${data.error}`);
    });
  }

  async checkValidation() {
    this.importFileErrors =
      (
        (await this.dataService.validateExperiment(this.allExperiments).toPromise()) as ValidateExperimentError[]
      ).filter((data) => data.error != null) || [];
    this.importFileErrorsDataSource.data = this.importFileErrors;
    this.nonErrorExperiments =
      this.uploadedFileCount - this.importFileErrors.filter((data) => !data.error.startsWith('Warning')).length;
  }

  async uploadFile(event) {
    const index = 0;
    const reader = new FileReader();
    this.uploadedFileCount = event.target.files.length;
    this.importFileErrors = [];
    this.allExperiments = [];

    if (this.uploadedFileCount === 0) return;

    // Set loading to true before processing the files
    this.isLoadingExperiments$ = true;

    const readFile = (fileIndex) => {
      if (fileIndex >= event.target.files.length) {
        // Check if this is the last file
        if (fileIndex >= this.uploadedFileCount) {
          this.checkValidation();
          this.isLoadingExperiments$ = false;
        }
        return;
      }
      const file = event.target.files[fileIndex];
      const fileName = file.name;
      reader.onload = (e) => {
        const fileContent = e.target.result;
        this.allExperiments.push({ fileName: fileName, fileContent: fileContent });
        readFile(fileIndex + 1);
      };
      reader.readAsText(file);
    };

    readFile(index);
  }
}
