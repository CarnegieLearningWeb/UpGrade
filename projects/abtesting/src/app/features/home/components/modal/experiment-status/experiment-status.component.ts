import { Component, OnInit, ChangeDetectionStrategy, Inject } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { EXPERIMENT_STATE } from 'ees_types';
import { Experiment } from '../../../../../core/experiments/store/experiments.model';
import { ExperimentService } from '../../../../../core/experiments/experiments.service';

@Component({
  selector: 'app-experiment-status',
  templateUrl: './experiment-status.component.html',
  styleUrls: ['./experiment-status.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExperimentStatusComponent implements OnInit {

  experimentInfo: Experiment;
  statusForm: FormGroup;
  experimentStatus = [
    { value: EXPERIMENT_STATE.DEMO },
    { value: EXPERIMENT_STATE.INACTIVE },
    { value: EXPERIMENT_STATE.SCHEDULED },
    { value: EXPERIMENT_STATE.ENROLLING },
    { value: EXPERIMENT_STATE.ENROLLMENT_COMPLETE },
    { value: EXPERIMENT_STATE.CANCELLED },
  ];
  constructor(
    private _formBuilder: FormBuilder,
    private experimentService: ExperimentService,
    private dialogRef: MatDialogRef<ExperimentStatusComponent>,
    @Inject(MAT_DIALOG_DATA) private data: any
  ) {
    this.experimentInfo = this.data.experiment;
   }

  onCancelClick(): void {
    this.dialogRef.close();
  }

  ngOnInit() {
    this.statusForm = this._formBuilder.group({
      newStatus: ['', Validators.required]
    });
  }

  changeStatus() {
    const { newStatus } = this.statusForm.value;
    this.experimentService.updateExperiment({ ...this.experimentInfo, state: newStatus.value });
    this.onCancelClick();
  }
}
