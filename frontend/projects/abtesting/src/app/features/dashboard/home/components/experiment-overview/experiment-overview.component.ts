import { Component, ChangeDetectionStrategy, Output, EventEmitter, OnInit, Input, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { MatChipInputEvent, MatAutocompleteSelectedEvent } from '@angular/material';
import { ASSIGNMENT_UNIT, CONSISTENCY_RULE } from 'upgrade_types';
import {
  GroupTypes,
  NewExperimentDialogEvents,
  NewExperimentDialogData,
  ExperimentVM,
  NewExperimentPaths
} from '../../../../../core/experiments/store/experiments.model';
import { ENTER, COMMA } from '@angular/cdk/keycodes';
import { FormGroup, FormBuilder, Validators, FormArray, FormControl } from '@angular/forms';
import * as find from 'lodash.find';
import { ExperimentService } from '../../../../../core/experiments/experiments.service';
import { Observable, Subscription } from 'rxjs';
import { startWith, map } from 'rxjs/operators';

@Component({
  selector: 'home-experiment-overview',
  templateUrl: './experiment-overview.component.html',
  styleUrls: ['./experiment-overview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExperimentOverviewComponent implements OnInit, OnDestroy {
  @Input() experimentInfo: ExperimentVM;
  @Output() emitExperimentDialogEvent = new EventEmitter<NewExperimentDialogData>();
  @ViewChild('contextInput', { static: false }) contextInput: ElementRef<HTMLInputElement>;
  overviewForm: FormGroup;
  unitOfAssignments = [{ value: ASSIGNMENT_UNIT.INDIVIDUAL }, { value: ASSIGNMENT_UNIT.GROUP }];

  groupTypes = [
    { value: GroupTypes.CLASS },
    { value: GroupTypes.SCHOOL },
    { value: GroupTypes.DISTRICT },
    { value: GroupTypes.TEACHER },
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

  // Used for autocomplete context input
  experimentContext$: Observable<string[]>;
  allContext = [];
  allContextSub: Subscription;
  autoCompleteContext = new FormControl();

  readonly separatorKeysCodes: number[] = [ENTER, COMMA];

  constructor(
    private _formBuilder: FormBuilder,
    private experimentService: ExperimentService
  ) {
    this.experimentContext$ = this.autoCompleteContext.valueChanges.pipe(
      startWith(null),
      map((context: string | null) => context ? this._filter(context) : this.allContext.slice()));
  }

  ngOnInit() {
    this.allContextSub = this.experimentService.experimentContext$.subscribe(context => {
      this.allContext = context;
    });
    this.overviewForm = this._formBuilder.group(
      {
        experimentName: [null, Validators.required],
        description: [null],
        unitOfAssignment: [null, Validators.required],
        groupType: [null],
        customGroupName: [null],
        consistencyRule: [null, Validators.required],
        context: [[], Validators.required],
        tags: [[]],
        logging: [null]
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
        tags: this.experimentInfo.tags,
        logging: this.experimentInfo.logging
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

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.allContext.filter(context => context.toLowerCase().indexOf(filterValue) === 0);
  }

  selectedAutoCompleteContext(event: MatAutocompleteSelectedEvent): void {
    const contextValue = event.option.viewValue.toLowerCase();
    if (this.contexts.value.indexOf(contextValue.trim()) === -1) {
      this.contexts.setValue([...this.contexts.value, contextValue.trim()]);
    }
    this.contextInput.nativeElement.value = '';
    this.autoCompleteContext.setValue(null);
  }

  // Used to add tags or contexts
  addChip(event: MatChipInputEvent, type: string): void {
    const input = event.input;
    const value = event.value.toLowerCase();

    // Add chip
    if ((value || '').trim()) {
      switch (type) {
        case 'contexts':
          if (this.allContext.indexOf(value.trim()) !== -1 && this.contexts.value.indexOf(value.trim()) === -1) {
            this[type].setValue([...this[type].value, value.trim()]);
          }
          break;
        case 'tags':
          if (this.tags.value.indexOf(value.toLowerCase().trim()) === -1) {
            this[type].setValue([...this[type].value, value.trim()]);
          }
          break;
      }
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
      case NewExperimentDialogEvents.SAVE_DATA:
        if (this.overviewForm.valid) {
          const {
            experimentName,
            description,
            unitOfAssignment,
            groupType,
            customGroupName,
            consistencyRule,
            context,
            tags,
            logging
          } = this.overviewForm.value;
          const overviewFormData = {
            name: experimentName,
            description: description || '',
            consistencyRule: consistencyRule,
            assignmentUnit: unitOfAssignment,
            group: groupType ? (groupType === GroupTypes.OTHER ? customGroupName : groupType) : null,
            context,
            tags,
            logging
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

  ngOnDestroy() {
    this.allContextSub.unsubscribe();
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
