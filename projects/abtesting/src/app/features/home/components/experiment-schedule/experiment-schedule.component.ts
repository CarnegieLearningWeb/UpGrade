import { Component, OnInit, ChangeDetectionStrategy, Output, EventEmitter, Input } from '@angular/core';
import { FormGroup, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { NewExperimentDialogEvents, NewExperimentDialogData, ASSIGNMENT_UNIT, NewExperimentPaths } from '../../../../core/experiments/store/experiments.model';

enum EndExperimentCondition {
  END_ON_DATE = 'End on Date',
  END_CRITERIA = 'End Criteria'
}

@Component({
  selector: 'home-experiment-schedule',
  templateUrl: './experiment-schedule.component.html',
  styleUrls: ['./experiment-schedule.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExperimentScheduleComponent implements OnInit {

  @Input() assignmentUnit: ASSIGNMENT_UNIT;
  @Output() emitExperimentDialogEvent = new EventEmitter<NewExperimentDialogData>();
  experimentScheduleForm: FormGroup;
  minDate = new Date();
  constructor(private _formBuilder: FormBuilder) { }

  ngOnInit() {
    this.experimentScheduleForm = this._formBuilder.group({
      endExperimentAutomatically: [null],
      endCondition: [{ value: '', disabled: true } , Validators.required],
      dateOfExperimentEnd: [{ value: '', disabled: true }],
      userCount: [{ value: '', disabled: true }, Validators.min(1)],
      groupCount: [{ value: '', disabled: true }, Validators.min(1)]
    }, { validators: this.validateScheduleForm });

    this.experimentScheduleForm.get('endExperimentAutomatically').valueChanges.subscribe((isExperimentEndAutomatically) => {
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
  }

  validateScheduleForm(controls: AbstractControl): { [key: string]: any } | null {
    const endExperimentAutomatically = controls.get('endExperimentAutomatically').value;
    const endCondition = controls.get('endCondition').value;
    const dateOfExperimentEnd = controls.get('dateOfExperimentEnd').value;
    const userCount = controls.get('userCount').value;
    const groupCount = controls.get('groupCount').value;
    if (endExperimentAutomatically && !!endCondition) {
      if ((endCondition === EndExperimentCondition.END_ON_DATE && !!dateOfExperimentEnd) ||
        (endCondition === EndExperimentCondition.END_CRITERIA && (!!userCount || !!groupCount))) {
        return null;
      } else {
        return { formValidationError: true };
      }
    }
    return null;
  }

  emitEvent(eventType: NewExperimentDialogEvents) {
    if (eventType === NewExperimentDialogEvents.CLOSE_DIALOG) {
      this.emitExperimentDialogEvent.emit({ type: eventType });
    } else {
      let scheduleData = {
        endOn: null,
        enrollmentCompleteCondition: {
          userCount: 0,
          groupCount: 0
        }
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
        type: eventType,
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
