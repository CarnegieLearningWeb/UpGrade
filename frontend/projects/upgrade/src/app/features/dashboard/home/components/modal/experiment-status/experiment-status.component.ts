import { Component, OnInit, Inject } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { MatLegacyDialogRef as MatDialogRef, MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog';
import { EXPERIMENT_STATE } from 'upgrade_types';
import { ExperimentVM, ExperimentStateInfo } from '../../../../../../core/experiments/store/experiments.model';
import { ExperimentService } from '../../../../../../core/experiments/experiments.service';
import { ExperimentFormValidators } from '../../../validators/experiment-form.validators';

@Component({
  selector: 'home-experiment-status',
  templateUrl: './experiment-status.component.html',
  styleUrls: ['./experiment-status.component.scss'],
})
export class ExperimentStatusComponent implements OnInit {
  experimentInfo: ExperimentVM;
  statusForm: UntypedFormGroup;
  experimentStatus = [];
  minDate = new Date();
  showInfoMsg = false;
  showConditionCountErrorMsg = false;

  constructor(
    private _formBuilder: UntypedFormBuilder,
    private experimentService: ExperimentService,
    private dialogRef: MatDialogRef<ExperimentStatusComponent>,
    @Inject(MAT_DIALOG_DATA) private data: any
  ) {
    this.experimentInfo = this.data.experiment;
  }

  get ExperimentStatus() {
    return EXPERIMENT_STATE;
  }

  get newStatusValue() {
    return this.statusForm.get('newStatus').value;
  }

  get isScheduleDateWrong(): boolean {
    const { scheduleDate } = this.statusForm.value;
    return (
      !!this.experimentInfo.endOn &&
      !!scheduleDate &&
      new Date(this.experimentInfo.endOn).getTime() < new Date(new Date(scheduleDate)).getTime()
    );
  }

  onCancelClick(): void {
    this.dialogRef.close();
  }

  ngOnInit() {
    this.statusForm = this._formBuilder.group(
      {
        newStatus: [
          { value: '', disabled: this.experimentInfo.state === EXPERIMENT_STATE.CANCELLED },
          Validators.required,
        ],
        scheduleDate: [null],
      },
      { validators: ExperimentFormValidators.validateExperimentStatusForm }
    );
    switch (this.experimentInfo.state) {
      case EXPERIMENT_STATE.ENROLLING:
      case EXPERIMENT_STATE.ENROLLMENT_COMPLETE:
        this.experimentStatus = [
          { value: EXPERIMENT_STATE.ENROLLING },
          { value: EXPERIMENT_STATE.ENROLLMENT_COMPLETE },
          { value: EXPERIMENT_STATE.CANCELLED },
        ];
        break;
      default:
        this.experimentStatus = [
          { value: EXPERIMENT_STATE.PREVIEW },
          { value: EXPERIMENT_STATE.INACTIVE },
          { value: EXPERIMENT_STATE.SCHEDULED },
          { value: EXPERIMENT_STATE.ENROLLING },
          { value: EXPERIMENT_STATE.CANCELLED },
        ];
    }
    this.statusForm.get('newStatus').valueChanges.subscribe((status) => {
      this.showInfoMsg = status.value === EXPERIMENT_STATE.ENROLLING;
      // set validation flag for condition count less than 2 and not for status as cancelled:
      if (this.data.experiment.conditions.length < 2 && !(status.value === EXPERIMENT_STATE.CANCELLED)) {
        this.showConditionCountErrorMsg = true;
      } else {
        // allow cancelled status for even less than 2 conditions:
        this.showConditionCountErrorMsg = false;
      }
    });
  }

  changeStatus() {
    const { newStatus, scheduleDate } = this.statusForm.value;
    let data: ExperimentStateInfo = {
      newStatus: newStatus.value,
    };
    if (newStatus.value === EXPERIMENT_STATE.SCHEDULED) {
      data = { ...data, scheduleDate };
    }
    this.experimentService.updateExperimentState(this.experimentInfo.id, data);
    this.onCancelClick();
  }
}
