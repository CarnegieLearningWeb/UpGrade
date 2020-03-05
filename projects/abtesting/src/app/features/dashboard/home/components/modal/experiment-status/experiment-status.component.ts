import { Component, OnInit, ChangeDetectionStrategy, Inject } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { EXPERIMENT_STATE } from 'ees_types';
import { ExperimentVM } from '../../../../../../core/experiments/store/experiments.model';
import { ExperimentService } from '../../../../../../core/experiments/experiments.service';
import { ExperimentFormValidators } from '../../../validators/experiment-form.validators';

@Component({
  selector: 'home-experiment-status',
  templateUrl: './experiment-status.component.html',
  styleUrls: ['./experiment-status.component.scss']
})
export class ExperimentStatusComponent implements OnInit {

  experimentInfo: ExperimentVM;
  statusForm: FormGroup;
  experimentStatus = [];
  minDate = new Date();
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
      newStatus: [{ value: '', disabled: this.experimentInfo.state === EXPERIMENT_STATE.CANCELLED }, Validators.required],
      scheduleDate: [null],
    }, { validators: ExperimentFormValidators.validateExperimentStatusForm });
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

  get ExperimentStatus() {
    return EXPERIMENT_STATE;
  }

  get newStatusValue() {
    return this.statusForm.get('newStatus').value;
  }

  changeStatus() {
    const { newStatus, scheduleDate } = this.statusForm.value;
    // TODO:  Add schedule date in request

    // let data = {
    //   newStatus: newStatus.value
    // };
    // if (newStatus.value === EXPERIMENT_STATE.SCHEDULED) {
    //   data = { ...data, scheduleDate }
    // }
    this.experimentService.updateExperimentState(this.experimentInfo.id, newStatus.value);
    this.onCancelClick();
  }
}
