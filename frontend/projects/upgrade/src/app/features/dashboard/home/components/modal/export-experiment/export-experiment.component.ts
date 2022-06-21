import { Component, ChangeDetectionStrategy, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { first } from 'rxjs/operators';
import { EXPORT_METHOD } from '../../../../../../../../../../../types/src/Experiment/enums';
import { AuthService } from '../../../../../../core/auth/auth.service';
import { ExperimentVM } from '../../../../../../core/experiments/store/experiments.model';
import { ExperimentService } from '../../../../../../core/experiments/experiments.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'experiment-export',
  templateUrl: './export-experiment.component.html',
  styleUrls: ['./export-experiment.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExportModalComponent implements OnInit {
  exportMethod = [];
  emailId: string;
  exportForm: FormGroup;
  experiment: ExperimentVM;
  constructor(
    private _formBuilder: FormBuilder,
    private experimentService: ExperimentService,
    private authService: AuthService,
    private _snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<ExportModalComponent>,
    @Inject(MAT_DIALOG_DATA) private data: any
    ) {
      this.experiment = this.data.experiment;
    }
  
  onCancelClick(): void {
    this.dialogRef.close();
  }

  ngOnInit() {
    this.exportForm = this._formBuilder.group(
      {
        exportMethod: [
          { value: ''},
          Validators.required
        ],
        emailId: ''
      }
    );
    this.exportMethod = [
      { value: EXPORT_METHOD.DESIGN },
      { value: EXPORT_METHOD.DATA }
    ];
    this.authService.currentUser$.pipe(
      first()
    ).subscribe(userInfo => {
      if (userInfo.email) {
        this.emailId = userInfo.email;
      }
    });
  }

  openSnackBar(exportType: boolean) {
    this.authService.currentUser$.pipe(
      first()
    ).subscribe(userInfo => {
      if (userInfo.email && exportType) {
        this._snackBar.open(`Email will be sent to ${userInfo.email}`, null, { duration: 2000 });
      } else if (!userInfo.email && !exportType) {
        this._snackBar.open(`Email will be sent to registered email`, null, { duration: 2000 });
      } else {
        this._snackBar.open(`Experiment Design JSON downloaded!`, null, { duration: 2000 });
      }
    });
  }

  exportExperimentInfo(experimentId: string, experimentName: string) {
    this.experimentService.exportExperimentInfo(experimentId, experimentName);
    this.openSnackBar(true);
  }
  exportExperimentDesign(experimentId: string) {
    this.experimentService.exportExperimentDesign(experimentId);
    this.openSnackBar(false);
  }

  exportExperiment() {
    const { exportMethod } = this.exportForm.value;
    if (exportMethod == EXPORT_METHOD.DATA) {
      this.exportExperimentInfo(this.experiment.id, this.experiment.name)
    } else {
      this.exportExperimentDesign(this.experiment.id)
    }
    this.onCancelClick();
  }
}
