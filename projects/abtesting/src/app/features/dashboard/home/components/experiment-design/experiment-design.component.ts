import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Output,
  EventEmitter,
  Input,
  ViewChild,
  ElementRef,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, AbstractControl } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { NewExperimentDialogEvents, NewExperimentDialogData, NewExperimentPaths, ExperimentVM } from '../../../../../core/experiments/store/experiments.model';
import { uuid } from 'uuidv4';
import { ExperimentFormValidators } from '../../validators/experiment-form.validators';
import { ExperimentService } from '../../../../../core/experiments/experiments.service';
import { first } from 'rxjs/operators';

@Component({
  selector: 'home-experiment-design',
  templateUrl: './experiment-design.component.html',
  styleUrls: ['./experiment-design.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExperimentDesignComponent implements OnInit, OnChanges {
  @Input() experimentInfo: ExperimentVM;
  @Input() animationCompleteStepperIndex: Number;
  @Output() emitExperimentDialogEvent = new EventEmitter<NewExperimentDialogData>();

  @ViewChild('conditionTable', { static: false, read: ElementRef }) conditionTable: ElementRef;
  @ViewChild('partitionTable', { static: false, read: ElementRef }) partitionTable: ElementRef;
  @ViewChild('conditionCode', { static: false }) conditionCode: ElementRef;

  experimentDesignForm: FormGroup;
  conditionDataSource = new BehaviorSubject<AbstractControl[]>([]);
  partitionDataSource = new BehaviorSubject<AbstractControl[]>([]);
  allUniqueIdentifiers = [];

  conditionDisplayedColumns = [ 'conditionNumber', 'uniqueIdentifier', 'conditionCode', 'assignmentWeight', 'description', 'removeCondition'];
  partitionDisplayedColumns = ['partitionNumber', 'uniqueIdentifier', 'point', 'name', 'removePartition'];
  constructor(
    private _formBuilder: FormBuilder,
    private experimentService: ExperimentService
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes.animationCompleteStepperIndex && changes.animationCompleteStepperIndex.currentValue === 1 && this.conditionCode) {
      this.conditionCode.nativeElement.focus();
    }
  }

  ngOnInit() {
    this.experimentService.uniqueIdentifiers$.pipe(first()).subscribe((identifiers: any) => {
      this.allUniqueIdentifiers = [...identifiers.conditionIds, ...identifiers.partitionsIds];
    });
    this.experimentDesignForm = this._formBuilder.group(
      {
        conditions: this._formBuilder.array([this.addConditions(), this.addConditions()]),
        partitions: this._formBuilder.array([this.addPartitions()])
      }, { validators: ExperimentFormValidators.validateExperimentDesignForm });

    // populate values in form to update experiment if experiment data is available
    if (this.experimentInfo) {
      // Remove previously added group of conditions and partitions
      this.condition.removeAt(0);
      this.condition.removeAt(0);
      this.partition.removeAt(0);
      this.experimentInfo.conditions.forEach(condition => {
        this.condition.push(this.addConditions(condition.conditionCode, condition.assignmentWeight, condition.description, condition.twoCharacterId));
      });
      this.experimentInfo.partitions.forEach(partition => {
        this.partition.push(this.addPartitions(partition.point, partition.name, partition.description, partition.twoCharacterId));
      });
    }
    this.updateView();
  }

  addConditions(conditionCode = null, assignmentWeight = null, description = null, twoCharacterId = null) {
    return this._formBuilder.group({
      conditionCode: [conditionCode, Validators.required],
      assignmentWeight: [assignmentWeight, Validators.required],
      description: [description],
      twoCharacterId: [twoCharacterId ? twoCharacterId : this.getUniqueCharacterId()]
    });
  }

  addPartitions(point = null, name = null, description = '', twoCharacterId = null) {
    return this._formBuilder.group({
      point: [point, Validators.required],
      name: [name],
      description: [description],
      twoCharacterId: [twoCharacterId ? twoCharacterId : this.getUniqueCharacterId()]
    });
  }

  get condition(): FormArray {
    return this.experimentDesignForm.get('conditions') as FormArray;
  }

  get partition(): FormArray {
    return this.experimentDesignForm.get('partitions') as FormArray;
  }

  addConditionOrPartition(type: string) {
    const form = type === 'condition' ? this.addConditions() : this.addPartitions();
    this[type].push(form);
    const scrollTableType = type === 'condition' ? 'conditionTable' : 'partitionTable';
    this.updateView(scrollTableType);
  }

  removeConditionOrPartition(type: string, groupIndex: number, twoCharacterId: string) {
    this[type].removeAt(groupIndex);
    this.updateView();
    this.allUniqueIdentifiers.splice(this.allUniqueIdentifiers.indexOf(twoCharacterId), 1);
  }

  updateView(type?: string) {
    this.conditionDataSource.next(this.condition.controls);
    this.partitionDataSource.next(this.partition.controls);
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
          (condition, index) => {
            return this.experimentInfo
              ? ({ ...this.experimentInfo.conditions[index], ...condition })
              : ({ id: uuid(), ...condition, name: ''});
          }
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

  getUniqueCharacterId() {
    let identifier;
    while (true) {
      identifier = Math.random().toString(36).substring(2, 4).toUpperCase();
      if (this.allUniqueIdentifiers.indexOf(identifier) === -1) {
        break;
      }
    }
    this.allUniqueIdentifiers = [ ...this.allUniqueIdentifiers, identifier ];
    return identifier;
  }
}
