import {
  Component,
  ChangeDetectionStrategy,
  Output,
  EventEmitter,
  OnInit
} from '@angular/core';
import { MatChipInputEvent } from '@angular/material';
import { ASSIGNMENT_UNIT, CONSISTENCY_RULE } from 'ees_types';
import {
  GroupTypes,
  NewExperimentDialogEvents,
  NewExperimentDialogData,
  NewExperimentPaths
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
      groupType: [null, Validators.required],
      consistencyRule: [null, Validators.required]
    });
  }

  addTag(event: MatChipInputEvent): void {
    const input = event.input;
    const value = event.value;

    // Add our experimentTags
    if ((value || '').trim()) {
      this.experimentTags.push({ name: value.trim() });
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
          consistencyRule: consistencyRule.value,
          assignmentUnit: unitOfAssignment.value,
          group: groupType.value,
          tags: this.experimentTags.map(tag => tag.name)
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
