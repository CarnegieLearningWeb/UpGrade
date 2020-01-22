import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Output,
  EventEmitter,
  Input,
  ViewChild,
  ElementRef
} from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, AbstractControl } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { NewExperimentDialogEvents, NewExperimentDialogData, NewExperimentPaths, ExperimentVM } from '../../../../core/experiments/store/experiments.model';
import { uuid } from 'uuidv4';
import { ExperimentFormValidators } from '../../validators/experiment-form.validators';

@Component({
  selector: 'home-experiment-design',
  templateUrl: './experiment-design.component.html',
  styleUrls: ['./experiment-design.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExperimentDesignComponent implements OnInit {
  @Input() experimentInfo: ExperimentVM;
  @Input() disableControls = false;
  @Output() emitExperimentDialogEvent = new EventEmitter<NewExperimentDialogData>();

  @ViewChild('conditionTable', { static: false, read: ElementRef }) conditionTable: ElementRef;
  @ViewChild('segmentTable', { static: false, read: ElementRef }) segmentTable: ElementRef;

  experimentDesignForm: FormGroup;
  conditionDataSource = new BehaviorSubject<AbstractControl[]>([]);
  segmentDataSource = new BehaviorSubject<AbstractControl[]>([]);

  conditionDisplayedColumns = [ 'conditionNumber', 'conditionCode', 'assignmentWeight', 'description', 'removeCondition'];
  segmentDisplayedColumns = ['segmentNumber', 'point', 'name', 'removeSegment'];
  constructor(private _formBuilder: FormBuilder) {}

  ngOnInit() {
    this.experimentDesignForm = this._formBuilder.group(
      {
        conditions: this._formBuilder.array([this.addConditions(), this.addConditions()]),
        segments: this._formBuilder.array([this.addSegments()])
      }, { validators: ExperimentFormValidators.validateExperimentDesignForm });

    // populate values in form to update experiment if experiment data is available
    if (this.experimentInfo) {
      // Remove previously added group of conditions and segments
      this.condition.removeAt(0);
      this.condition.removeAt(0);
      this.segment.removeAt(0);
      this.experimentInfo.conditions.forEach(condition => {
        this.condition.push(this.addConditions(condition.conditionCode, condition.assignmentWeight, condition.description));
      });
      this.experimentInfo.segments.forEach(segment => {
        this.segment.push(this.addSegments(segment.point, segment.name, segment.description));
      });
    }
    this.updateView();
  }

  addConditions(conditionCode = null, assignmentWeight = null, description = null) {
    return this._formBuilder.group({
      conditionCode: [conditionCode, Validators.required],
      assignmentWeight: [assignmentWeight, Validators.required],
      description: [description]
    });
  }

  addSegments(point = null, name = null, description = '') {
    return this._formBuilder.group({
      point: [point, Validators.required],
      name: [name, Validators.required],
      description: [description]
    });
  }

  get condition(): FormArray {
    return this.experimentDesignForm.get('conditions') as FormArray;
  }

  get segment(): FormArray {
    return this.experimentDesignForm.get('segments') as FormArray;
  }

  addConditionOrSegment(type: string) {
    const form = type === 'condition' ? this.addConditions() : this.addSegments();
    this[type].push(form);
    const scrollTableType = type === 'condition' ? 'conditionTable' : 'segmentTable';
    this.updateView(scrollTableType);
  }

  removeConditionOrSegment(type: string, groupIndex: number) {
    this[type].removeAt(groupIndex);
    this.updateView();
  }

  updateView(type?: string) {
    this.conditionDataSource.next(this.condition.controls);
    this.segmentDataSource.next(this.segment.controls);
    if (type) {
      this[type].nativeElement.scroll({
        top: this[type].nativeElement.scrollHeight,
        behavior: 'smooth'
      });
    }
  }

  emitEvent(eventType: NewExperimentDialogEvents) {
    switch (eventType) {
      case NewExperimentDialogEvents.CLOSE_DIALOG:
        this.emitExperimentDialogEvent.emit({ type: eventType });
        break;
      case NewExperimentDialogEvents.SEND_FORM_DATA:
        const experimentDesignFormData = {
          ...this.experimentDesignForm.value
        };
        experimentDesignFormData.conditions = experimentDesignFormData.conditions.map(
          condition => ({ id: uuid(), ...condition, name: ''})
        );
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

  get isAssignmentWeightControlDirty() {
    if (this.experimentDesignForm) {
      return (this.experimentDesignForm.controls.conditions as any).controls.some(
        control => control.controls.assignmentWeight.dirty
      );
    }
    return false;
  }
}
