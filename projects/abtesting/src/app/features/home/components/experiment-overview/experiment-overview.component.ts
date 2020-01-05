import {
  Component,
  ChangeDetectionStrategy,
  Output,
  EventEmitter,
  OnInit,
  Input
} from '@angular/core';
import { MatChipInputEvent } from '@angular/material';
import { ASSIGNMENT_UNIT, CONSISTENCY_RULE } from 'ees_types';
import {
  GroupTypes,
  NewExperimentDialogEvents,
  NewExperimentDialogData,
  NewExperimentPaths,
  Experiment
} from '../../../../core/experiments/store/experiments.model';
import { ENTER, COMMA } from '@angular/cdk/keycodes';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'home-experiment-overview',
  templateUrl: './experiment-overview.component.html',
  styleUrls: ['./experiment-overview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExperimentOverviewComponent implements OnInit {
  @Input() experimentInfo: Experiment;
  @Output() emitExperimentDialogEvent = new EventEmitter<
    NewExperimentDialogData
  >();
  overviewForm: FormGroup;
  unitOfAssignments = [
    { value: ASSIGNMENT_UNIT.INDIVIDUAL },
    { value: ASSIGNMENT_UNIT.GROUP }
  ];

  groupTypes = [
    { value: GroupTypes.CLASS },
    { value: GroupTypes.SCHOOL },
    { value: GroupTypes.DISTRICT }
  ];

  consistencyRules = [
    { value: CONSISTENCY_RULE.INDIVIDUAL },
    { value: CONSISTENCY_RULE.GROUP },
    { value: CONSISTENCY_RULE.EXPERIMENT }
  ];

  // Used to control tags
  isTagSelectable = true;
  isTagRemovable = true;
  addTagOnBlur = true;
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];

  experimentTags = [];

  constructor(private _formBuilder: FormBuilder) {}

  ngOnInit() {
    this.overviewForm = this._formBuilder.group({
      experimentName: [null, Validators.required],
      description: [null, Validators.required],
      unitOfAssignment: [null, Validators.required],
      groupType: [{ value: null, disabled: true }, Validators.required],
      consistencyRule: [null, Validators.required]
    });

    this.overviewForm.get('unitOfAssignment').valueChanges.subscribe(assignmentUnit => {
      switch (assignmentUnit) {
        case ASSIGNMENT_UNIT.INDIVIDUAL:
          this.overviewForm.get('groupType').disable();
          this.overviewForm.get('groupType').reset();
          break;
        case ASSIGNMENT_UNIT.GROUP:
        this.overviewForm.get('groupType').enable();
          break;
      }
    });

    // populate values in form to update experiment if experiment data is available
    if (this.experimentInfo) {
      this.overviewForm.setValue({
        experimentName: this.experimentInfo.name,
        description: this.experimentInfo.description,
        unitOfAssignment: this.experimentInfo.assignmentUnit,
        groupType: this.experimentInfo.group,
        consistencyRule: this.experimentInfo.consistencyRule
      });
      this.experimentTags = this.experimentInfo.tags
    }
  }

  addTag(event: MatChipInputEvent): void {
    const input = event.input;
    const value = event.value;

    // Add our experimentTags
    if ((value || '').trim()) {
      this.experimentTags.push(value.trim());
    }

    // Reset the input value
    if (input) {
      input.value = '';
    }
  }

  removeTag(experimentTags): void {
    const index = this.experimentTags.indexOf(experimentTags);
    if (index >= 0) {
      this.experimentTags.splice(index, 1);
    }
  }

  emitEvent(eventType: NewExperimentDialogEvents) {
    switch (eventType) {
      case NewExperimentDialogEvents.CLOSE_DIALOG:
        this.emitExperimentDialogEvent.emit({ type: eventType })
        break;
      case NewExperimentDialogEvents.SEND_FORM_DATA:
        const { experimentName, description, unitOfAssignment, groupType, consistencyRule } = this.overviewForm.value;
        const overviewFormData = {
          name: experimentName,
          description,
          consistencyRule: consistencyRule,
          assignmentUnit: unitOfAssignment,
          group: groupType || null,
          tags: this.experimentTags
        };
        this.emitExperimentDialogEvent.emit({
          type: eventType,
          formData: overviewFormData,
          path: NewExperimentPaths.EXPERIMENT_OVERVIEW
        });
        break;
    }
  }

  get NewExperimentDialogEvents() {
    return NewExperimentDialogEvents;
  }
}
