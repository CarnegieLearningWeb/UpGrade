import { Component, OnInit, ChangeDetectionStrategy, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, AbstractControl } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { NewExperimentDialogEvents, NewExperimentDialogData } from '../../../../core/experiments/store/experiments.model';

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

  conditionDisplayedColumns = ['name', 'assignmentWeight', 'description', 'removeCondition']
  segmentDisplayedColumns = ['point', 'name', 'removeSegment']
  constructor(
    private _formBuilder: FormBuilder
  ) { }

  ngOnInit() {
    this.experimentDesignForm = this._formBuilder.group({
      conditions: this._formBuilder.array([this.addConditions()]),
      segments: this._formBuilder.array([this.addSegments()])
    });
    this.updateView();
  }

  addConditions() {
     return this._formBuilder.group({
       name: [ null, Validators.required ],
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
    return <FormArray>this.experimentDesignForm.get('conditions');
  }

  get segment(): FormArray {
    return <FormArray>this.experimentDesignForm.get('segments');
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
    (eventType === NewExperimentDialogEvents.CLOSE_DIALOG)
    ? this.emitExperimentDialogEvent.emit({ type: eventType })
    : this.emitExperimentDialogEvent.emit({ type: eventType, formData: this.experimentDesignForm.value});
  }

  get NewExperimentDialogEvents() {
    return NewExperimentDialogEvents;
  }
}
