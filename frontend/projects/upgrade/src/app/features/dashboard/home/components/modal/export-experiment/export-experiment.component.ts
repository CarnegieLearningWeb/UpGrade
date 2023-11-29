import { Component, ChangeDetectionStrategy, OnInit, Inject } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatLegacyDialogRef as MatDialogRef, MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog';
import { first } from 'rxjs/operators';
import { EXPORT_METHOD } from 'upgrade_types';
import { AuthService } from '../../../../../../core/auth/auth.service';
import { ExperimentVM } from '../../../../../../core/experiments/store/experiments.model';
import { ExperimentService } from '../../../../../../core/experiments/experiments.service';
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar';

@Component({
  selector: 'experiment-export',
  templateUrl: './export-experiment.component.html',
  styleUrls: ['./export-experiment.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExportModalComponent implements OnInit {
  exportMethod = [];
  emailId: string;
  exportForm: UntypedFormGroup;
  experiments: ExperimentVM[];
  constructor(
    private _formBuilder: UntypedFormBuilder,
    private experimentService: ExperimentService,
    private authService: AuthService,
    private _snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<ExportModalComponent>,
    @Inject(MAT_DIALOG_DATA) private data: any
  ) {
    this.experiments = this.data.experiment;
  }

  onCancelClick(): void {
    this.dialogRef.close();
  }

  ngOnInit() {
    this.exportForm = this._formBuilder.group({
      exportMethod: [{ value: '' }, Validators.required],
      emailId: '',
    });
    this.exportMethod = [{ value: EXPORT_METHOD.DESIGN }, { value: EXPORT_METHOD.DATA }];
    this.authService.currentUser$.pipe(first()).subscribe((userInfo) => {
      if (userInfo.email) {
        this.emailId = userInfo.email;
      }
    });
  }

  openSnackBar(exportType: boolean) {
    this.authService.currentUser$.pipe(first()).subscribe((userInfo) => {
      if (userInfo.email && exportType) {
        this._snackBar.open(`Email will be sent to ${userInfo.email}`, null, { duration: 2000 });
      } else if (!userInfo.email && !exportType) {
        this._snackBar.open('Email will be sent to registered email', null, { duration: 2000 });
      } else {
        this._snackBar.open('Experiment Design JSON downloaded!', null, { duration: 2000 });
      }
    });
  }

  exportExperimentInfo(experimentId: string, experimentName: string) {
    this.experimentService.exportExperimentInfo(experimentId, experimentName);
    this.openSnackBar(true);
  }
  exportExperimentDesign(experimentIds: string[]) {
    this.experimentService.exportExperimentDesign(experimentIds);
    this.openSnackBar(false);
  }

  exportExperiment() {
    const { exportMethod } = this.exportForm.value;
    if (exportMethod === EXPORT_METHOD.DATA && this.experiments[0]) {
      this.exportExperimentInfo(this.experiments[0].id, this.experiments[0].name);
    } else if (exportMethod === EXPORT_METHOD.DESIGN) {
      this.exportExperimentDesign(this.experiments.map((exp) => exp.id));
    }
    this.onCancelClick();
  }
}
