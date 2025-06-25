import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Experiment } from '../../../../../../core/experiments/store/experiments.model';
import { ExperimentService } from '../../../../../../core/experiments/experiments.service';
import { MatTableDataSource } from '@angular/material/table';
import { ExperimentDataService } from '../../../../../../core/experiments/experiments.data.service';
import { NotificationService } from '../../../../../../core/notifications/notification.service';
import { HomeModule } from '../../../home.module';

export interface ValidateExperimentError {
  fileName: string;
  error: string;
}

export interface ExperimentFile {
  fileName: string;
  fileContent: string | ArrayBuffer;
}

@Component({
  selector: 'app-import-experiment',
  templateUrl: './import-experiment.component.html',
  styleUrls: ['./import-experiment.component.scss'],
  standalone: false,
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
    this.onCancelClick();
    const importResult = (await this.dataService
      .importExperiment(this.allExperiments)
      .toPromise()) as ValidateExperimentError[];
    //this.experimentService.importExperiment(this.allExperiments);
    this.showNotification(importResult);
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
    this.uploadedFileCount = event.target.files.length;
    this.importFileErrors = [];
    this.allExperiments = [];

    if (this.uploadedFileCount === 0) return;

    // Set loading to true before processing the files
    this.isLoadingExperiments$ = true;

    const filesArray = Array.from(event.target.files) as any[];
    await Promise.all(
      filesArray.map((file) => {
        return new Promise<void>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const fileContent = e.target.result;
            this.allExperiments.push({ fileName: file.name, fileContent: fileContent });
            resolve();
          };
          reader.readAsText(file);
        });
      })
    );

    await this.checkValidation();
    this.isLoadingExperiments$ = false;
  }
}
