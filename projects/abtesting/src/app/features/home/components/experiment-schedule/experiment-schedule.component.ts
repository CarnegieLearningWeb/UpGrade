import { Component, OnInit, ChangeDetectionStrategy, Output, EventEmitter, Input } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import {
  NewExperimentDialogEvents,
  NewExperimentDialogData,
  ASSIGNMENT_UNIT,
  NewExperimentPaths,
  Experiment,
  EndExperimentCondition
} from '../../../../core/experiments/store/experiments.model';
import { ExperimentFormValidators } from '../../validators/experiment-form.validators';

@Component({
  selector: 'home-experiment-schedule',
  templateUrl: './experiment-schedule.component.html',
  styleUrls: ['./experiment-schedule.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExperimentScheduleComponent implements OnInit {

  @Input() assignmentUnit: ASSIGNMENT_UNIT;
  @Input() experimentInfo: Experiment;
  @Output() emitExperimentDialogEvent = new EventEmitter<NewExperimentDialogData>();
  experimentScheduleForm: FormGroup;
  minDate = new Date();
  constructor(private _formBuilder: FormBuilder) { }

  ngOnInit() {
    this.experimentScheduleForm = this._formBuilder.group({
      endExperimentAutomatically: [null],
      endCondition: [{ value: '', disabled: true } , Validators.required],
      dateOfExperimentEnd: [{ value: '', disabled: true }],
      userCount: [{ value: '', disabled: true }],
      groupCount: [{ value: '', disabled: true }]
    }, { validators: ExperimentFormValidators.validateScheduleForm });

    this.experimentScheduleForm.get('endExperimentAutomatically').valueChanges.subscribe(
      (isExperimentEndAutomatically) => {
        if (isExperimentEndAutomatically) {
          Object.keys(this.experimentScheduleForm.controls).forEach(formControlName => {
            if (formControlName !== 'endExperimentAutomatically') {
              this.experimentScheduleForm.controls[formControlName].enable();
            }
          });
        } else {
          Object.keys(this.experimentScheduleForm.controls).forEach(formControlName => {
            if (formControlName !== 'endExperimentAutomatically') {
              this.experimentScheduleForm.controls[formControlName].disable();
            }
          });
        }
      });

    // populate values in form to update experiment if experiment data is available
    if (this.experimentInfo) {
      const { enrollmentCompleteCondition, endOn } = this.experimentInfo;
      const isEndAutomaticallyChecked = !!endOn || !!enrollmentCompleteCondition;
      const endCondition = isEndAutomaticallyChecked
      ? (endOn ? EndExperimentCondition.END_ON_DATE : EndExperimentCondition.END_CRITERIA)
      : null;
      this.experimentScheduleForm.patchValue({
        endExperimentAutomatically: isEndAutomaticallyChecked,
        endCondition,
        dateOfExperimentEnd: endOn ? new Date(endOn) : null,
        userCount: enrollmentCompleteCondition ? enrollmentCompleteCondition.userCount : null,
        groupCount: enrollmentCompleteCondition ? enrollmentCompleteCondition.groupCount : null
      });
    }
  }

  emitEvent(eventType: NewExperimentDialogEvents) {
    if (eventType === NewExperimentDialogEvents.CLOSE_DIALOG) {
      this.emitExperimentDialogEvent.emit({ type: eventType });
    } else {
      let scheduleData = {
        endOn: null,
        enrollmentCompleteCondition: null
      };
      const { endExperimentAutomatically, endCondition, dateOfExperimentEnd, userCount, groupCount } = this.experimentScheduleForm.value;
      if (endExperimentAutomatically) {
        switch (endCondition) {
          case EndExperimentCondition.END_ON_DATE:
            scheduleData = {
              ...scheduleData,
              endOn: dateOfExperimentEnd.toISOString()
            };
            break;

          case EndExperimentCondition.END_CRITERIA:
            scheduleData = {
              ...scheduleData,
              enrollmentCompleteCondition: {
                userCount: userCount || 0,
                groupCount: groupCount || 0
              }
            };
            break;
        }
      }
      this.emitExperimentDialogEvent.emit({
        type: this.experimentInfo ? NewExperimentDialogEvents.UPDATE_EXPERIMENT : eventType,
        formData: scheduleData,
        path: NewExperimentPaths.EXPERIMENT_SCHEDULE
      });
    }
  }

  get NewExperimentDialogEvents() {
    return NewExperimentDialogEvents;
  }

  get AssignmentUnit() {
    return ASSIGNMENT_UNIT;
  }

  get EndExperimentCondition() {
    return EndExperimentCondition;
  }
}
