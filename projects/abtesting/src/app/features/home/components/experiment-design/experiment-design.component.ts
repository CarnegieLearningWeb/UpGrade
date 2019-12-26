import { Component, OnInit, ChangeDetectionStrategy, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, AbstractControl } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { NewExperimentDialogEvents, NewExperimentDialogData, NewExperimentPaths } from '../../../../core/experiments/store/experiments.model';
import { uuid } from 'uuidv4';

@Component({
  selector: 'home-experiment-design',
  templateUrl: './experiment-design.component.html',
  styleUrls: ['./experiment-design.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExperimentDesignComponent implements OnInit {

  @Output() emitExperimentDialogEvent = new EventEmitter<NewExperimentDialogData>();

  experimentDesignForm: FormGroup;
  conditionDataSource = new BehaviorSubject<AbstractControl[]>([]);
  segmentDataSource = new BehaviorSubject<AbstractControl[]>([]);

  conditionDisplayedColumns = ['conditionCode', 'assignmentWeight', 'description', 'removeCondition']
  segmentDisplayedColumns = ['point', 'name', 'removeSegment']
  constructor(
    private _formBuilder: FormBuilder
  ) { }

  ngOnInit() {
    this.experimentDesignForm = this._formBuilder.group({
      conditions: this._formBuilder.array([this.addConditions()]),
      segments: this._formBuilder.array([this.addSegments()])
    }, { validators: this.validateExperimentDesignForm });
    this.updateView();
  }

  validateExperimentDesignForm(controls: AbstractControl): { [key: string]: any } | null {
    const conditions = controls.get('conditions').value;
    const segments = controls.get('segments').value;
    if (conditions.length < 2) {
      return { conditionCountError: true }
    } else if (segments.length < 1) {
      return { segmentCountError: true }
    }
    return null;
  }

  addConditions() {
     return this._formBuilder.group({
       conditionCode: [ null, Validators.required ],
       assignmentWeight: [ null, Validators.required ],
       description: [ null, Validators.required ]
     });
  }

  addSegments() {
    return this._formBuilder.group({
      point: [ null, Validators.required ],
      name: [ null, Validators.required],
      description: [ '' ]
    });
  }

  get condition(): FormArray {
    return this.experimentDesignForm.get('conditions') as FormArray;
  }

  get segment(): FormArray {
    return this.experimentDesignForm.get('segments') as FormArray;
  }

  addConditionOrSegment(type: string) {
    const form = (type === 'condition') ? this.addConditions() : this.addSegments();
    this[type].push(form);
    this.updateView();
  }

  removeConditionOrSegment(type: string, groupIndex: number) {
    this[type].removeAt(groupIndex);
    this.updateView();
  }

  updateView() {
    this.conditionDataSource.next(this.condition.controls);
    this.segmentDataSource.next(this.segment.controls);
  }

  emitEvent(eventType: NewExperimentDialogEvents) {
    switch (eventType) {
      case NewExperimentDialogEvents.CLOSE_DIALOG:
        this.emitExperimentDialogEvent.emit({ type: eventType });
        break;
      case NewExperimentDialogEvents.SEND_FORM_DATA:
        const experimentDesignFormData = {
          ...this.experimentDesignForm.value
        }
        experimentDesignFormData.conditions = experimentDesignFormData.conditions.map(condition => ({
          id: uuid(), ...condition, name: ''
        }));
        this.emitExperimentDialogEvent.emit({
          type: eventType,
          formData: experimentDesignFormData,
          path: NewExperimentPaths.EXPERIMENT_DESIGN
        });
        break;
    }
  }

  get NewExperimentDialogEvents() {
    return NewExperimentDialogEvents;
  }
}
