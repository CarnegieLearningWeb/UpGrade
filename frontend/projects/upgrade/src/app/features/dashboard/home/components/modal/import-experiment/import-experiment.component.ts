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

@Component({
  selector: 'app-import-experiment',
  templateUrl: './import-experiment.component.html',
  styleUrls: ['./import-experiment.component.scss'],
})
export class ImportExperimentComponent implements OnInit {
  experimentInfo: Experiment;
  allExperiments: ExperimentFile[] = [];
  nonErrorExperiments: ExperimentFile[] = [];
  importFileErrorsDataSource = new MatTableDataSource<{ fileName: string; error: string }>();
  importFileErrors: { fileName: string; error: string }[] = [];
  displayedColumns: string[] = ['File Name', 'Error'];
  uploadedFileCount = 0;

  isLoadingExperiments$ = false;

  constructor(
    private experimentService: ExperimentService,
    public dialogRef: MatDialogRef<ImportExperimentComponent>,
    private dataService: ExperimentDataService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  ngOnInit() {}

  onCancelClick(): void {
    this.dialogRef.close();
  }

  importExperiment() {
    this.experimentService.importExperiment(this.nonErrorExperiments);
    this.onCancelClick();
  }

  async checkValidation() {
    this.importFileErrors =
      ((await this.dataService.validateExperiment(this.allExperiments).toPromise()) as ValidateExperimentError[]) || [];
    this.importFileErrorsDataSource.data = this.importFileErrors;

    this.nonErrorExperiments = this.allExperiments.filter((file) => {
      // removes experiment from allExperiments if fileName present in importFileErrors
      const errorEntry = this.importFileErrors.find((errorFile) => errorFile.fileName === file.fileName);
      // if error starts with Warning is should pass
      return !errorEntry || errorEntry.error.startsWith('Warning');
    });
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
