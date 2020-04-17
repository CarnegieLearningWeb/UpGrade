import { Component, ChangeDetectionStrategy, Output, EventEmitter, OnInit, Input } from '@angular/core';
import { MatChipInputEvent } from '@angular/material';
import { ASSIGNMENT_UNIT, CONSISTENCY_RULE } from 'ees_types';
import {
  GroupTypes,
  NewExperimentDialogEvents,
  NewExperimentDialogData,
  ExperimentVM,
  NewExperimentPaths
} from '../../../../../core/experiments/store/experiments.model';
import { ENTER, COMMA } from '@angular/cdk/keycodes';
import { FormGroup, FormBuilder, Validators, FormArray } from '@angular/forms';
import { ExperimentFormValidators } from '../../validators/experiment-form.validators';
import * as find from 'lodash.find';

@Component({
  selector: 'home-experiment-overview',
  templateUrl: './experiment-overview.component.html',
  styleUrls: ['./experiment-overview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExperimentOverviewComponent implements OnInit {
  @Input() experimentInfo: ExperimentVM;
  @Output() emitExperimentDialogEvent = new EventEmitter<NewExperimentDialogData>();
  overviewForm: FormGroup;
  unitOfAssignments = [{ value: ASSIGNMENT_UNIT.INDIVIDUAL }, { value: ASSIGNMENT_UNIT.GROUP }];

  groupTypes = [
    { value: GroupTypes.CLASS },
    { value: GroupTypes.SCHOOL },
    { value: GroupTypes.DISTRICT },
    { value: GroupTypes.OTHER }
  ];

  consistencyRules = [
    { value: CONSISTENCY_RULE.INDIVIDUAL },
    { value: CONSISTENCY_RULE.GROUP },
    { value: CONSISTENCY_RULE.EXPERIMENT }
  ];

  // Used to control chips
  isChipSelectable = true;
  isChipRemovable = true;
  addChipOnBlur = true;
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];

  constructor(private _formBuilder: FormBuilder) { }

  ngOnInit() {
    this.overviewForm = this._formBuilder.group(
      {
        experimentName: [null, Validators.required],
        description: [null],
        unitOfAssignment: [null, Validators.required],
        groupType: [null],
        customGroupName: [null],
        consistencyRule: [null, Validators.required],
        context: [[], Validators.required],
        tags: [[]]
      }
    );

    this.overviewForm.get('unitOfAssignment').valueChanges.subscribe(assignmentUnit => {
      this.overviewForm.get('consistencyRule').reset();
      switch (assignmentUnit) {
        case ASSIGNMENT_UNIT.INDIVIDUAL:
          this.overviewForm.get('groupType').disable();
          this.overviewForm.get('groupType').reset();
          this.consistencyRules = [{ value: CONSISTENCY_RULE.INDIVIDUAL }, { value: CONSISTENCY_RULE.EXPERIMENT }];
          break;
        case ASSIGNMENT_UNIT.GROUP:
          this.overviewForm.get('groupType').enable();
          this.overviewForm.get('groupType').setValidators(Validators.required);
          this.consistencyRules = [
            { value: CONSISTENCY_RULE.INDIVIDUAL },
            { value: CONSISTENCY_RULE.GROUP },
            { value: CONSISTENCY_RULE.EXPERIMENT }
          ];
          break;
      }
    });

    this.overviewForm.get('groupType').valueChanges.subscribe(groupType => {
      switch (groupType) {
        case GroupTypes.OTHER:
          this.overviewForm.get('customGroupName').setValidators(Validators.required);
          break;
        default:
          this.overviewForm.get('customGroupName').setValidators([]);
          this.overviewForm.get('customGroupName').reset();
      }
    });

    // populate values in form to update experiment if experiment data is available
    if (this.experimentInfo) {
      const { groupType, customGroupName = null } = this.setGroupTypeControlValue();
      this.overviewForm.setValue({
        experimentName: this.experimentInfo.name,
        description: this.experimentInfo.description,
        unitOfAssignment: this.experimentInfo.assignmentUnit,
        groupType,
        customGroupName,
        consistencyRule: this.experimentInfo.consistencyRule,
        context: this.experimentInfo.context,
        tags: this.experimentInfo.tags
      });
    }
  }

  setGroupTypeControlValue() {
    if (!this.experimentInfo.group) {
      return { groupType: null, customGroupName: null };
    }
    const result = find(this.groupTypes, type => type.value === this.experimentInfo.group);
    return result
      ? { groupType: result.value }
      : { groupType: GroupTypes.OTHER, customGroupName: this.experimentInfo.group };
  }

  // Used to add tags or contexts
  addChip(event: MatChipInputEvent, type: string): void {
    const input = event.input;
    const value = event.value;

    // Add chip
    if ((value || '').trim()) {
      this[type].setValue([...this[type].value, value.trim()]);
      this[type].updateValueAndValidity();
    }

    // Reset the input value
    if (input) {
      input.value = '';
    }
  }

  // Used to remove tags or contexts
  removeChip(tag: string, type: string): void {
    const index = this[type].value.indexOf(tag);
    if (index >= 0) {
      this[type].value.splice(index, 1);
      this[type].updateValueAndValidity();
    }
  }

  emitEvent(eventType: NewExperimentDialogEvents) {
    switch (eventType) {
      case NewExperimentDialogEvents.CLOSE_DIALOG:
        this.emitExperimentDialogEvent.emit({ type: eventType });
        break;
      case NewExperimentDialogEvents.SEND_FORM_DATA:
        if (this.overviewForm.valid) {
          const {
            experimentName,
            description,
            unitOfAssignment,
            groupType,
            customGroupName,
            consistencyRule,
            context,
            tags
          } = this.overviewForm.value;
          const overviewFormData = {
            name: experimentName,
            description: description || '',
            consistencyRule: consistencyRule,
            assignmentUnit: unitOfAssignment,
            group: groupType ? (groupType === GroupTypes.OTHER ? customGroupName : groupType) : null,
            tags,
            context
          };
          this.emitExperimentDialogEvent.emit({
            type: eventType,
            formData: overviewFormData,
            path: NewExperimentPaths.EXPERIMENT_OVERVIEW
          });
        }
        break;
    }
  }

  get NewExperimentDialogEvents() {
    return NewExperimentDialogEvents;
  }

  get groupTypeValue() {
    return this.overviewForm.get('groupType').value === GroupTypes.OTHER;
  }

  get unitOfAssignmentValue() {
    return this.overviewForm.get('unitOfAssignment').value === ASSIGNMENT_UNIT.GROUP;
  }

  get contexts(): FormArray {
    return this.overviewForm.get('context') as FormArray;
  }

  get tags(): FormArray {
    return this.overviewForm.get('tags') as FormArray;
  }
}
