import {
  Component,
  ChangeDetectionStrategy,
  Output,
  EventEmitter,
  OnInit,
  Input,
  ViewChild,
  ElementRef,
  OnDestroy,
} from '@angular/core';
import { ASSIGNMENT_UNIT, CONDITION_ORDER, CONSISTENCY_RULE, EXPERIMENT_STATE } from 'upgrade_types';
import {
  NewExperimentDialogEvents,
  NewExperimentDialogData,
  ExperimentVM,
  NewExperimentPaths,
  IContextMetaData,
  ExperimentDesignTypes,
} from '../../../../../core/experiments/store/experiments.model';
import { ENTER, COMMA } from '@angular/cdk/keycodes';
import { UntypedFormGroup, UntypedFormBuilder, Validators, UntypedFormArray } from '@angular/forms';
import find from 'lodash.find';
import { ExperimentService } from '../../../../../core/experiments/experiments.service';
import { Observable, Subscription } from 'rxjs';
import { MatLegacyChipInputEvent as MatChipInputEvent } from '@angular/material/legacy-chips';
import { DialogService } from '../../../../../shared/services/dialog.service';
import { ExperimentDesignStepperService } from '../../../../../core/experiment-design-stepper/experiment-design-stepper.service';
@Component({
  selector: 'home-experiment-overview',
  templateUrl: './experiment-overview.component.html',
  styleUrls: ['./experiment-overview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperimentOverviewComponent implements OnInit, OnDestroy {
  @Input() experimentInfo: ExperimentVM;
  @Output() emitExperimentDialogEvent = new EventEmitter<NewExperimentDialogData>();
  @ViewChild('contextInput') contextInput: ElementRef<HTMLInputElement>;
  overviewForm: UntypedFormGroup;
  unitOfAssignments = [
    { value: ASSIGNMENT_UNIT.INDIVIDUAL },
    { value: ASSIGNMENT_UNIT.GROUP },
    { value: ASSIGNMENT_UNIT.WITHIN_SUBJECTS },
  ];
  public ASSIGNMENT_UNIT = ASSIGNMENT_UNIT;

  groupTypes = [];
  enableSave = true;
  allContexts = [];
  currentContext = null;
  consistencyRules = [{ value: CONSISTENCY_RULE.INDIVIDUAL }, { value: CONSISTENCY_RULE.GROUP }];
  conditionOrders = [
    { value: CONDITION_ORDER.RANDOM },
    { value: CONDITION_ORDER.RANDOM_ROUND_ROBIN },
    { value: CONDITION_ORDER.ORDERED_ROUND_ROBIN },
  ];
  designTypes = [{ value: ExperimentDesignTypes.SIMPLE }, { value: ExperimentDesignTypes.FACTORIAL }];

  // Used to control chips
  isChipSelectable = true;
  isChipRemovable = true;
  addChipOnBlur = true;

  // Used for autocomplete context input
  contextMetaData: IContextMetaData | Record<string, unknown> = {};
  contextMetaDataSub: Subscription;
  isLoadingContextMetaData$: Observable<boolean>;
  isExperimentEditable = true;

  readonly separatorKeysCodes: number[] = [ENTER, COMMA];

  constructor(
    private _formBuilder: UntypedFormBuilder,
    private experimentService: ExperimentService,
    private experimentDesignStepperService: ExperimentDesignStepperService,
    private dialogService: DialogService
  ) {}

  ngOnInit() {
    this.isLoadingContextMetaData$ = this.experimentService.isLoadingContextMetaData$;
    this.contextMetaDataSub = this.experimentService.contextMetaData$.subscribe((contextMetaData) => {
      this.contextMetaData = contextMetaData;

      if (this.overviewForm && this.contextMetaData && this.experimentInfo) {
        this.checkExperiment();
        this.overviewForm.patchValue(this.setGroupTypeControlValue());
      }

      if (this.contextMetaData && this.contextMetaData.contextMetadata) {
        this.allContexts = Object.keys(this.contextMetaData.contextMetadata);
      }

      this.overviewForm = this._formBuilder.group({
        experimentName: [null, Validators.required],
        description: [null],
        unitOfAssignment: [null, Validators.required],
        groupType: [null],
        consistencyRule: [null, Validators.required],
        conditionOrder: [null],
        designType: [ExperimentDesignTypes.SIMPLE, Validators.required],
        context: [null, Validators.required],
        tags: [[]],
        logging: [false],
      });

      this.overviewForm.get('unitOfAssignment').valueChanges.subscribe((assignmentUnit) => {
        this.experimentDesignStepperService.changeAssignmentUnit(assignmentUnit);
        this.overviewForm.get('consistencyRule').reset();
        this.overviewForm.get('conditionOrder').reset();
        switch (assignmentUnit) {
          case ASSIGNMENT_UNIT.INDIVIDUAL:
            this.overviewForm.get('groupType').disable();
            this.overviewForm.get('groupType').reset();
            this.consistencyRules = [{ value: CONSISTENCY_RULE.INDIVIDUAL }];
            this.isExperimentEditable ? this.overviewForm.get('consistencyRule').enable() : false;
            this.overviewForm.get('conditionOrder').disable();
            break;
          case ASSIGNMENT_UNIT.GROUP:
            if (this.overviewForm.get('context')) {
              if (this.isExperimentEditable) {
                this.overviewForm.get('groupType').enable();
                this.overviewForm.get('consistencyRule').enable();
              }
              this.overviewForm.get('groupType').setValidators(Validators.required);
              this.setGroupTypes();
              this.consistencyRules = [{ value: CONSISTENCY_RULE.INDIVIDUAL }, { value: CONSISTENCY_RULE.GROUP }];
            } else {
              this.overviewForm.get('groupType').reset();
              this.overviewForm.get('groupType').disable();
            }
            this.overviewForm.get('conditionOrder').disable();
            break;
          case ASSIGNMENT_UNIT.WITHIN_SUBJECTS:
            this.overviewForm.get('groupType').disable();
            this.overviewForm.get('groupType').reset();
            this.consistencyRules = [];
            this.overviewForm.get('consistencyRule').disable();
            this.isExperimentEditable ? this.overviewForm.get('conditionOrder').enable() : false;
            this.overviewForm.get('conditionOrder').setValidators(Validators.required);
            break;
        }
      });

      this.overviewForm.get('context').valueChanges.subscribe((context) => {
        this.currentContext = context;
        this.experimentService.setCurrentContext(context);
        this.setGroupTypes();
      });

      // populate values in form to update experiment if experiment data is available
      if (this.experimentInfo) {
        if (
          this.experimentInfo.state == this.ExperimentState.ENROLLING ||
          this.experimentInfo.state == this.ExperimentState.ENROLLMENT_COMPLETE
        ) {
          this.overviewForm.disable();
          this.isExperimentEditable = false;
        }
        this.currentContext = this.experimentInfo.context[0];

        this.overviewForm.setValue({
          experimentName: this.experimentInfo.name,
          description: this.experimentInfo.description,
          unitOfAssignment: this.experimentInfo.assignmentUnit,
          groupType: this.experimentInfo.group,
          consistencyRule: this.experimentInfo.consistencyRule,
          conditionOrder: this.experimentInfo.conditionOrder,
          designType: this.experimentInfo.type,
          context: this.currentContext,
          tags: this.experimentInfo.tags,
          logging: this.experimentInfo.logging,
        });
        this.checkExperiment();
      }
    });
  }

  setGroupTypeControlValue() {
    if (!this.experimentInfo.group) {
      return { groupType: null };
    }

    this.setGroupTypes();
    const result = find(this.groupTypes, (type) => type.value === this.experimentInfo.group);
    return result ? { groupType: result.value } : { groupType: null };
  }

  setGroupTypes() {
    this.groupTypes = [];
    if (this.contextMetaData.contextMetadata && this.contextMetaData.contextMetadata[this.currentContext]) {
      this.contextMetaData.contextMetadata[this.currentContext].GROUP_TYPES.forEach((groupType) => {
        this.groupTypes.push({ value: groupType });
      });
    }
  }

  // Used to add tags or contexts
  addChip(event: MatChipInputEvent, type: string): void {
    const input = event.chipInput;
    const value = event.value.toLowerCase();

    // Add chip
    if ((value || '').trim()) {
      switch (type) {
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
      input.clear();
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

  // Check if experiment is created before new context-metadata and reset app-contexts
  checkExperiment() {
    if (this.contextMetaData.contextMetadata && !this.contextMetaData.contextMetadata[this.currentContext]) {
      this.overviewForm.get('context').setValue(null);
      this.overviewForm.get('groupType').reset();
    }
  }

  emitEvent(eventType: NewExperimentDialogEvents) {
    switch (eventType) {
      case NewExperimentDialogEvents.CLOSE_DIALOG:
        if (this.overviewForm.dirty || this.experimentDesignStepperService.getHasExperimentDesignStepperDataChanged()) {
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
        if (this.overviewForm.dirty) {
          this.experimentDesignStepperService.experimentStepperDataChanged();
        }
        this.overviewForm.markAllAsTouched();
        this.saveData(eventType);
        break;
      case NewExperimentDialogEvents.SAVE_DATA:
        this.saveData(eventType);
        break;
    }
  }

  saveData(eventType) {
    if (
      this.experimentInfo &&
      (this.experimentInfo.state == this.ExperimentState.ENROLLING ||
        this.experimentInfo.state == this.ExperimentState.ENROLLMENT_COMPLETE)
    ) {
      this.emitExperimentDialogEvent.emit({
        type: eventType,
        formData: this.experimentInfo,
        path: NewExperimentPaths.EXPERIMENT_OVERVIEW,
      });
    } else if (this.overviewForm.valid) {
      const {
        experimentName,
        description,
        unitOfAssignment,
        groupType,
        consistencyRule,
        conditionOrder,
        context,
        designType,
        tags,
        logging,
      } = this.overviewForm.value;
      const overviewFormData = {
        name: experimentName,
        description: description || '',
        consistencyRule: consistencyRule,
        conditionOrder: conditionOrder,
        assignmentUnit: unitOfAssignment,
        group: groupType,
        type: designType,
        context: [context],
        tags,
        logging,
      };
      this.emitExperimentDialogEvent.emit({
        type: eventType,
        formData: overviewFormData,
        path: NewExperimentPaths.EXPERIMENT_OVERVIEW,
      });

      if (eventType == NewExperimentDialogEvents.SAVE_DATA) {
        this.experimentDesignStepperService.experimentStepperDataReset();
        this.overviewForm.markAsPristine();
      }
    }
  }

  ngOnDestroy() {
    this.contextMetaDataSub.unsubscribe();
  }

  get NewExperimentDialogEvents() {
    return NewExperimentDialogEvents;
  }

  get unitOfAssignmentValue() {
    return this.overviewForm.get('unitOfAssignment').value;
  }

  get contexts(): UntypedFormArray {
    return this.overviewForm.get('context') as UntypedFormArray;
  }

  get tags(): UntypedFormArray {
    return this.overviewForm.get('tags') as UntypedFormArray;
  }

  get ExperimentState() {
    return EXPERIMENT_STATE;
  }
}
