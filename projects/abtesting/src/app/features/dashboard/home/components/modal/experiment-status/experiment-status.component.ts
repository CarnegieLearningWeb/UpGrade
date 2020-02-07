import { Component, OnInit, ChangeDetectionStrategy, Inject } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { EXPERIMENT_STATE } from 'ees_types';
import { ExperimentVM } from '../../../../../../core/experiments/store/experiments.model';
import { ExperimentService } from '../../../../../../core/experiments/experiments.service';

@Component({
  selector: 'home-experiment-status',
  templateUrl: './experiment-status.component.html',
  styleUrls: ['./experiment-status.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExperimentStatusComponent implements OnInit {

  experimentInfo: ExperimentVM;
  statusForm: FormGroup;
  experimentStatus = [];
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
    switch (this.experimentInfo.state) {
      case EXPERIMENT_STATE.ENROLLING:
      case EXPERIMENT_STATE.ENROLLMENT_COMPLETE:
        this.experimentStatus = [
          { value: EXPERIMENT_STATE.ENROLLING },
          { value: EXPERIMENT_STATE.ENROLLMENT_COMPLETE },
          { value: EXPERIMENT_STATE.CANCELLED }
        ];
        break;
      default:
        this.experimentStatus = [
          { value: EXPERIMENT_STATE.PREVIEW },
          { value: EXPERIMENT_STATE.INACTIVE },
          { value: EXPERIMENT_STATE.SCHEDULED },
          { value: EXPERIMENT_STATE.ENROLLING },
          { value: EXPERIMENT_STATE.ENROLLMENT_COMPLETE },
          { value: EXPERIMENT_STATE.CANCELLED }
        ];
    }
  }

  changeStatus() {
    const { newStatus } = this.statusForm.value;
    this.experimentService.updateExperimentState(this.experimentInfo.id, newStatus.value);
    this.onCancelClick();
  }
}
