import { Component, OnInit, ChangeDetectionStrategy, Output, EventEmitter, Input } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import {
  NewExperimentDialogEvents,
  NewExperimentDialogData,
  NewExperimentPaths,
  EndExperimentCondition,
  ExperimentVM,
  EXPERIMENT_STATE,
} from '../../../../../core/experiments/store/experiments.model';
import { DialogService } from '../../../../../shared/services/dialog.service';
import { ExperimentDesignStepperService } from '../../../../../core/experiment-design-stepper/experiment-design-stepper.service';
@Component({
  selector: 'home-experiment-schedule',
  templateUrl: './experiment-schedule.component.html',
  styleUrls: ['./experiment-schedule.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperimentScheduleComponent implements OnInit {
  @Input() groupType: string;
  @Input() experimentInfo: ExperimentVM;
  @Output() emitExperimentDialogEvent = new EventEmitter<NewExperimentDialogData>();
  experimentScheduleForm: UntypedFormGroup;
  minDate = new Date();

  constructor(
    private _formBuilder: UntypedFormBuilder,
    private dialogService: DialogService,
    private experimentDesignStepperService: ExperimentDesignStepperService
  ) {}

  get NewExperimentDialogEvents() {
    return NewExperimentDialogEvents;
  }

  get EndExperimentCondition() {
    return EndExperimentCondition;
  }

  get groupTypeValue(): boolean {
    return (
      this.experimentScheduleForm &&
      this.experimentScheduleForm.get('endCondition').value === EndExperimentCondition.END_CRITERIA
    );
  }

  get ExperimentState() {
    return EXPERIMENT_STATE;
  }

  ngOnInit() {
    this.experimentScheduleForm = this._formBuilder.group({
      startExperimentAutomatically: [null],
      dateOfExperimentStart: [{ value: '', disabled: true }],
      endExperimentAutomatically: [null],
      endCondition: [{ value: '', disabled: true }, Validators.required],
      dateOfExperimentEnd: [{ value: '', disabled: true }],
      userCount: [{ value: '', disabled: true }],
      groupCount: [{ value: '', disabled: true }],
    });

    this.experimentScheduleForm
      .get('startExperimentAutomatically')
      .valueChanges.subscribe((isExperimentStartAutomatically) => {
        if (isExperimentStartAutomatically) {
          this.experimentScheduleForm.get('dateOfExperimentStart').enable();
        } else {
          this.experimentScheduleForm.get('dateOfExperimentStart').disable();
          this.experimentScheduleForm.get('dateOfExperimentStart').reset();
        }
      });

    this.experimentScheduleForm
      .get('endExperimentAutomatically')
      .valueChanges.subscribe((isExperimentEndAutomatically) => {
        if (isExperimentEndAutomatically) {
          this.experimentScheduleForm.get('endCondition').enable();
        } else {
          Object.keys(this.experimentScheduleForm.controls).forEach((formControlName) => {
            if (
              !(
                formControlName === 'endExperimentAutomatically' ||
                formControlName === 'startExperimentAutomatically' ||
                formControlName === 'dateOfExperimentStart'
              )
            ) {
              this.experimentScheduleForm.controls[formControlName].disable();
              this.experimentScheduleForm.controls[formControlName].reset();
            }
          });
        }
      });

    this.experimentScheduleForm.get('endCondition').valueChanges.subscribe((endCondition) => {
      if (endCondition === EndExperimentCondition.END_ON_DATE) {
        this.experimentScheduleForm.get('dateOfExperimentEnd').enable();
        this.experimentScheduleForm.get('userCount').disable();
        this.experimentScheduleForm.get('groupCount').disable();
      } else if (endCondition === EndExperimentCondition.END_CRITERIA) {
        if (this.experimentInfo && this.experimentInfo.state === this.ExperimentState.ENROLLMENT_COMPLETE) {
          this.experimentScheduleForm.get('dateOfExperimentEnd').disable();
          this.experimentScheduleForm.get('userCount').disable();
          this.experimentScheduleForm.get('groupCount').disable();
        } else {
          this.experimentScheduleForm.get('dateOfExperimentEnd').disable();
          this.experimentScheduleForm.get('userCount').enable();
          this.experimentScheduleForm.get('groupCount').enable();
        }
      }
    });

    // populate values in form to update experiment if experiment data is available
    if (this.experimentInfo) {
      // disable control on edit:
      if (this.experimentInfo.state === this.ExperimentState.ENROLLMENT_COMPLETE) {
        this.experimentScheduleForm.get('userCount').disable();
        this.experimentScheduleForm.get('groupCount').disable();
      }
      const { enrollmentCompleteCondition, endOn, startOn } = this.experimentInfo;
      const isEndAutomaticallyChecked = !!endOn || !!enrollmentCompleteCondition;
      const endCondition = isEndAutomaticallyChecked
        ? endOn
          ? EndExperimentCondition.END_ON_DATE
          : EndExperimentCondition.END_CRITERIA
        : null;
      this.experimentScheduleForm.patchValue({
        startExperimentAutomatically: !!startOn,
        dateOfExperimentStart: startOn ? new Date(startOn) : null,
        endExperimentAutomatically: isEndAutomaticallyChecked,
        endCondition,
        dateOfExperimentEnd: endOn ? new Date(endOn) : null,
        userCount: enrollmentCompleteCondition ? enrollmentCompleteCondition.userCount : null,
        groupCount: enrollmentCompleteCondition ? enrollmentCompleteCondition.groupCount : null,
      });
    }
  }

  validateScheduleForm() {
    const startExperimentAutomatically = this.experimentScheduleForm.get('startExperimentAutomatically').value;
    const endExperimentAutomatically = this.experimentScheduleForm.get('endExperimentAutomatically').value;
    const endCondition = this.experimentScheduleForm.get('endCondition').value;
    const dateOfExperimentEnd = this.experimentScheduleForm.get('dateOfExperimentEnd').value;
    const dateOfExperimentStart = this.experimentScheduleForm.get('dateOfExperimentStart').value;
    const userCount = this.experimentScheduleForm.get('userCount').value;
    const groupCount = this.experimentScheduleForm.get('groupCount').value;
    if (endExperimentAutomatically && !!endCondition) {
      if (endCondition === EndExperimentCondition.END_ON_DATE && !dateOfExperimentEnd) {
        this.experimentScheduleForm.setErrors({ dateOfExperimentEndError: true });
      } else if (endCondition === EndExperimentCondition.END_CRITERIA && !(userCount || groupCount)) {
        this.experimentScheduleForm.setErrors({ endCriteriaError: true });
      }
    } else if (endExperimentAutomatically && !endCondition) {
      this.experimentScheduleForm.setErrors({ selectionError: true });
    }
    if (startExperimentAutomatically && !dateOfExperimentStart) {
      this.experimentScheduleForm.setErrors({ startOnSelectionError: true });
    }
    if (
      dateOfExperimentStart &&
      dateOfExperimentEnd &&
      new Date(dateOfExperimentStart).getTime() >= new Date(dateOfExperimentEnd).getTime()
    ) {
      this.experimentScheduleForm.setErrors({ wrongDateSelectionError: true });
    }
  }

  emitEvent(eventType: NewExperimentDialogEvents) {
    switch (eventType) {
      case NewExperimentDialogEvents.CLOSE_DIALOG:
        if (
          this.experimentScheduleForm.dirty ||
          this.experimentDesignStepperService.getHasExperimentDesignStepperDataChanged()
        ) {
          this.dialogService
            .openConfirmDialog()
            .afterClosed()
            .subscribe((res) => {
              if (res) {
                this.emitExperimentDialogEvent.emit({ type: eventType });
              }
            });
        } else {
          this.emitExperimentDialogEvent.emit({ type: eventType });
        }
        break;
      case NewExperimentDialogEvents.SEND_FORM_DATA:
        if (this.experimentScheduleForm.dirty) {
          this.experimentDesignStepperService.experimentStepperDataChanged();
        }
        this.saveData(eventType);
        break;
      case NewExperimentDialogEvents.SAVE_DATA:
        this.saveData(eventType);
        break;
    }
  }

  handleBackBtnClick() {
    return this.experimentScheduleForm.dirty && this.experimentDesignStepperService.experimentStepperDataChanged();
  }

  saveData(eventType) {
    this.validateScheduleForm();
    if (this.experimentScheduleForm.valid) {
      let scheduleData = {
        endOn: null,
        enrollmentCompleteCondition: null,
        startOn: null,
        state: EXPERIMENT_STATE.INACTIVE,
      };
      if (this.experimentInfo) {
        scheduleData = {
          ...scheduleData,
          state: this.experimentInfo.state,
        };
        if (
          this.experimentInfo.state == this.ExperimentState.ENROLLING ||
          this.experimentInfo.state == this.ExperimentState.ENROLLMENT_COMPLETE
        ) {
          this.emitExperimentDialogEvent.emit({
            type: eventType,
            formData: scheduleData,
            path: NewExperimentPaths.EXPERIMENT_SCHEDULE,
          });
        }
      }
      const {
        endExperimentAutomatically,
        endCondition,
        dateOfExperimentEnd,
        userCount,
        groupCount,
        dateOfExperimentStart,
      } = this.experimentScheduleForm.value;
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
      if (dateOfExperimentStart) {
        scheduleData = {
          ...scheduleData,
          startOn: dateOfExperimentStart,
          state: EXPERIMENT_STATE.SCHEDULED,
        };
      } else {
        if (this.experimentInfo) {
          const { state } = this.experimentInfo;
          scheduleData = {
            ...scheduleData,
            startOn: null,
            state: state === EXPERIMENT_STATE.SCHEDULED ? EXPERIMENT_STATE.INACTIVE : state,
          };
        }
      }
      this.emitExperimentDialogEvent.emit({
        type: eventType,
        formData: scheduleData,
        path: NewExperimentPaths.EXPERIMENT_SCHEDULE,
      });

      if (eventType == NewExperimentDialogEvents.SAVE_DATA) {
        this.experimentDesignStepperService.experimentStepperDataReset();
        this.experimentScheduleForm.markAsPristine();
      }
    }
  }
}
