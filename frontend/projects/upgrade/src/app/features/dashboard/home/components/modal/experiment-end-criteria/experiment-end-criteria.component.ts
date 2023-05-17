import { Component, OnInit, ChangeDetectionStrategy, Inject } from '@angular/core';
import { MatLegacyDialogRef as MatDialogRef, MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ExperimentVM, EndExperimentCondition } from '../../../../../../core/experiments/store/experiments.model';
import { ExperimentService } from '../../../../../../core/experiments/experiments.service';

@Component({
  selector: 'app-experiment-end-criteria',
  templateUrl: './experiment-end-criteria.component.html',
  styleUrls: ['./experiment-end-criteria.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperimentEndCriteriaComponent implements OnInit {
  experiment: ExperimentVM;
  experimentEndForm: UntypedFormGroup;
  minDate = new Date();
  groupSatisfied: number;

  constructor(
    private dialogRef: MatDialogRef<ExperimentEndCriteriaComponent>,
    private _formBuilder: UntypedFormBuilder,
    private experimentService: ExperimentService,
    @Inject(MAT_DIALOG_DATA) private data: any
  ) {
    this.experiment = this.data.experiment;
  }

  get EndExperimentCondition() {
    return EndExperimentCondition;
  }

  get groupTypeValue(): boolean {
    return (
      this.experimentEndForm && this.experimentEndForm.get('endCondition').value === EndExperimentCondition.END_CRITERIA
    );
  }

  ngOnInit() {
    this.experimentEndForm = this._formBuilder.group({
      endExperimentAutomatically: [null],
      endCondition: [{ value: '', disabled: true }, Validators.required],
      dateOfExperimentEnd: [{ value: '', disabled: true }],
      userCount: [{ value: '', disabled: true }],
      groupCount: [{ value: '', disabled: true }],
    });

    this.experimentEndForm.get('endExperimentAutomatically').valueChanges.subscribe((isExperimentEndAutomatically) => {
      if (isExperimentEndAutomatically) {
        this.experimentEndForm.get('endCondition').enable();
      } else {
        Object.keys(this.experimentEndForm.controls).forEach((formControlName) => {
          if (!(formControlName === 'endExperimentAutomatically')) {
            this.experimentEndForm.controls[formControlName].disable();
            this.experimentEndForm.controls[formControlName].reset();
          }
        });
      }
    });

    this.experimentEndForm.get('endCondition').valueChanges.subscribe((endCondition) => {
      if (endCondition === EndExperimentCondition.END_ON_DATE) {
        this.experimentEndForm.get('dateOfExperimentEnd').enable();
        this.experimentEndForm.get('userCount').disable();
        this.experimentEndForm.get('groupCount').disable();
        this.experimentEndForm.get('userCount').setValue(null);
        this.experimentEndForm.get('groupCount').setValue(null);
      } else if (endCondition === EndExperimentCondition.END_CRITERIA) {
        this.experimentEndForm.get('dateOfExperimentEnd').disable();
        this.experimentEndForm.get('userCount').enable();
        this.experimentEndForm.get('groupCount').enable();
        this.experimentEndForm.get('dateOfExperimentEnd').setValue(null);
      }
    });

    // populate values in form to update experiment if experiment data is available
    if (this.experiment) {
      const { enrollmentCompleteCondition, endOn } = this.experiment;
      const isEndAutomaticallyChecked = !!endOn || !!enrollmentCompleteCondition;
      const endCondition = isEndAutomaticallyChecked
        ? endOn
          ? EndExperimentCondition.END_ON_DATE
          : EndExperimentCondition.END_CRITERIA
        : null;
      this.experimentEndForm.patchValue({
        endExperimentAutomatically: isEndAutomaticallyChecked,
        endCondition,
        dateOfExperimentEnd: endOn ? new Date(endOn) : null,
        userCount: enrollmentCompleteCondition ? enrollmentCompleteCondition.userCount : null,
        groupCount: enrollmentCompleteCondition ? enrollmentCompleteCondition.groupCount : null,
        groupSatisfied: this.experiment.groupSatisfied,
      });
    }
  }

  validateScheduleForm() {
    const endExperimentAutomatically = this.experimentEndForm.get('endExperimentAutomatically').value;
    const endCondition = this.experimentEndForm.get('endCondition').value;
    const dateOfExperimentEnd = this.experimentEndForm.get('dateOfExperimentEnd').value;
    const dateOfExperimentStart = this.experiment.startOn;
    const userCount = this.experimentEndForm.get('userCount').value;
    const groupCount = this.experimentEndForm.get('groupCount').value;
    if (endExperimentAutomatically && !!endCondition) {
      if (endCondition === EndExperimentCondition.END_ON_DATE && !dateOfExperimentEnd) {
        this.experimentEndForm.setErrors({ dateOfExperimentEndError: true });
      } else if (endCondition === EndExperimentCondition.END_CRITERIA && !(userCount || groupCount)) {
        this.experimentEndForm.setErrors({ endCriteriaError: true });
      }
    } else if (endExperimentAutomatically && !endCondition) {
      this.experimentEndForm.setErrors({ selectionError: true });
    }
    if (
      dateOfExperimentStart &&
      dateOfExperimentEnd &&
      new Date(dateOfExperimentStart).getTime() >= new Date(dateOfExperimentEnd).getTime()
    ) {
      this.experimentEndForm.setErrors({ wrongDateSelectionError: true });
    }
  }

  onCancelClick(): void {
    this.dialogRef.close();
  }

  updateEndingCriteria() {
    this.validateScheduleForm();
    if (this.experimentEndForm.valid) {
      let scheduleData: any = {
        endOn: null,
        enrollmentCompleteCondition: null,
      };
      const { endExperimentAutomatically, endCondition, dateOfExperimentEnd, userCount, groupCount } =
        this.experimentEndForm.value;
      if (endExperimentAutomatically) {
        switch (endCondition) {
          case EndExperimentCondition.END_ON_DATE:
            scheduleData = {
              ...scheduleData,
              endOn: dateOfExperimentEnd.toISOString(),
            };
            break;
          case EndExperimentCondition.END_CRITERIA:
            scheduleData = {
              ...scheduleData,
              enrollmentCompleteCondition: {
                userCount: userCount || 0,
                groupCount: groupCount || 0,
              },
            };
            break;
        }
      }
      this.experiment = {
        ...this.experiment,
        ...scheduleData,
      };
      this.experimentService.updateExperiment(this.experiment);
      this.onCancelClick();
    }
  }
}
