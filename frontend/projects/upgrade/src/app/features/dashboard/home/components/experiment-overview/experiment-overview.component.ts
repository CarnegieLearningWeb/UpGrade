import {
  Component,
  ChangeDetectionStrategy,
  Output,
  EventEmitter,
  OnInit,
  Input,
  Inject,
  ViewChild,
  ElementRef,
  OnDestroy,
} from '@angular/core';
import {
  ASSIGNMENT_ALGORITHM,
  ASSIGNMENT_ALGORITHM_DISPLAY_MAP,
  ASSIGNMENT_UNIT,
  CONDITION_ORDER,
  CONSISTENCY_RULE,
  EXPERIMENT_STATE,
  EXPERIMENT_TYPE,
  MOOCLET_POLICY_SCHEMA_MAP,
  SUPPORTED_MOOCLET_ALGORITHMS,
} from 'upgrade_types';
import {
  NewExperimentDialogEvents,
  NewExperimentDialogData,
  ExperimentVM,
  NewExperimentPaths,
  IContextMetaData,
  ExperimentDesignTypes,
  OverviewFormWarningStatus,
} from '../../../../../core/experiments/store/experiments.model';
import { ENTER, COMMA } from '@angular/cdk/keycodes';
import { UntypedFormGroup, UntypedFormBuilder, Validators, UntypedFormArray } from '@angular/forms';
import find from 'lodash.find';
import { ExperimentService } from '../../../../../core/experiments/experiments.service';
import { Observable, Subscription } from 'rxjs';
import { MatChipInputEvent } from '@angular/material/chips';
import { DialogService } from '../../../../../shared/services/common-dialog.service';
import { ExperimentDesignStepperService } from '../../../../../core/experiment-design-stepper/experiment-design-stepper.service';
import { StratificationFactorSimple } from '../../../../../core/stratification-factors/store/stratification-factors.model';
import { StratificationFactorsService } from '../../../../../core/stratification-factors/stratification-factors.service';
import { ENV, Environment } from '../../../../../../environments/environment-types';

@Component({
  selector: 'home-experiment-overview',
  templateUrl: './experiment-overview.component.html',
  styleUrls: ['./experiment-overview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ExperimentOverviewComponent implements OnInit, OnDestroy {
  @Input() experimentInfo: ExperimentVM;
  @Output() emitExperimentDialogEvent = new EventEmitter<NewExperimentDialogData>();
  @ViewChild('contextInput') contextInput: ElementRef<HTMLInputElement>;
  overviewForm: UntypedFormGroup;
  unitOfAssignments = [{ value: ASSIGNMENT_UNIT.INDIVIDUAL }, { value: ASSIGNMENT_UNIT.GROUP }];
  ASSIGNMENT_UNIT = ASSIGNMENT_UNIT;
  ASSIGNMENT_ALGORITHM = ASSIGNMENT_ALGORITHM;
  ASSIGNMENT_ALGORITHM_DISPLAY_MAP = ASSIGNMENT_ALGORITHM_DISPLAY_MAP;

  groupTypes = [];
  allContexts = [];
  currentContext = null;
  initialDesignType = EXPERIMENT_TYPE.SIMPLE;
  warningStatus = OverviewFormWarningStatus.NO_WARNING;
  OverviewFormWarningStatus = OverviewFormWarningStatus;
  isOverviewFormCompleted = false;
  consistencyRules = [{ value: CONSISTENCY_RULE.INDIVIDUAL }, { value: CONSISTENCY_RULE.GROUP }];
  conditionOrders = [
    { value: CONDITION_ORDER.RANDOM },
    { value: CONDITION_ORDER.RANDOM_ROUND_ROBIN },
    { value: CONDITION_ORDER.ORDERED_ROUND_ROBIN },
  ];
  designTypes = [{ value: ExperimentDesignTypes.SIMPLE }, { value: ExperimentDesignTypes.FACTORIAL }];
  assignmentAlgorithms = [
    { value: ASSIGNMENT_ALGORITHM.RANDOM },
    { value: ASSIGNMENT_ALGORITHM.STRATIFIED_RANDOM_SAMPLING },
  ];
  allStratificationFactors: StratificationFactorSimple[];
  isLoading$ = this.stratificationFactorsService.isLoading$;
  allStratificationFactorsSub: Subscription;
  isStratificationFactorSelected = true;
  stratificationFactorNotSelectedMsg = 'home.new-experiment.overview.stratification-factor.error.text';

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
    private dialogService: DialogService,
    private stratificationFactorsService: StratificationFactorsService,
    @Inject(ENV) private environment: Environment
  ) {
    if (this.environment.withinSubjectExperimentSupportToggle) {
      this.unitOfAssignments.push({ value: ASSIGNMENT_UNIT.WITHIN_SUBJECTS });
    }
    if (this.environment.moocletToggle) {
      const supportedMoocletAlgorithms = SUPPORTED_MOOCLET_ALGORITHMS as ASSIGNMENT_ALGORITHM[];
      supportedMoocletAlgorithms.forEach((algorithmName) => {
        this.assignmentAlgorithms.push({ value: algorithmName });
      });
    }
  }

  ngOnInit() {
    this.allStratificationFactorsSub = this.stratificationFactorsService.allStratificationFactors$.subscribe(
      (StratificationFactors) => {
        this.allStratificationFactors = StratificationFactors.map((stratificationFactor) => ({
          factorName: stratificationFactor.factor,
        }));
      }
    );
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
        assignmentAlgorithm: [ASSIGNMENT_ALGORITHM.RANDOM, Validators.required],
        stratificationFactor: [null],
        context: [null, Validators.required],
        tags: [[]],
      });

      this.overviewForm.get('experimentName').valueChanges.subscribe((name) => {
        this.experimentDesignStepperService.changeExperimentName(name);
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
        if (context && this.currentContext && this.currentContext !== context) {
          this.warningStatus = OverviewFormWarningStatus.CONTEXT_CHANGED;
        }
        this.currentContext = context;
        this.experimentService.setCurrentContext(context);
        this.setGroupTypes();
      });

      this.overviewForm.get('designType').valueChanges.subscribe((type) => {
        if (this.isOverviewFormCompleted && this.initialDesignType !== type) {
          this.warningStatus = OverviewFormWarningStatus.DESIGN_TYPE_CHANGED;
        }
        this.initialDesignType = type;
      });

      this.overviewForm.get('assignmentAlgorithm').valueChanges.subscribe((algo) => {
        this.isStratificationFactorSelected =
          ASSIGNMENT_ALGORITHM.STRATIFIED_RANDOM_SAMPLING !== algo ? true : this.isStratificationFactorSelected;
        this.experimentDesignStepperService.changeAssignmentAlgorithm(algo);
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

        if (this.experimentInfo.assignmentAlgorithm in MOOCLET_POLICY_SCHEMA_MAP) {
          this.overviewForm.get('experimentName').disable(); // disable due to rewardMetricKey naming convention using the experiment name, a complication we are just going to avoid
          this.overviewForm.get('assignmentAlgorithm').disable();
        }
        this.currentContext = this.experimentInfo.context[0];
        this.initialDesignType = this.experimentInfo.type;

        this.overviewForm.setValue({
          experimentName: this.experimentInfo.name,
          description: this.experimentInfo.description,
          unitOfAssignment: this.experimentInfo.assignmentUnit,
          groupType: this.experimentInfo.group,
          consistencyRule: this.experimentInfo.consistencyRule,
          conditionOrder: this.experimentInfo.conditionOrder,
          designType: this.experimentInfo.type,
          assignmentAlgorithm: this.experimentInfo.assignmentAlgorithm,
          stratificationFactor: this.experimentInfo.stratificationFactor?.stratificationFactorName || null,
          context: this.currentContext,
          tags: this.experimentInfo.tags,
        });
        this.warningStatus = OverviewFormWarningStatus.NO_WARNING;
        this.checkExperiment();
        this.isOverviewFormCompleted = true;
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
        this.experimentInfo.state == this.ExperimentState.ENROLLMENT_COMPLETE ||
        this.experimentInfo.assignmentAlgorithm in MOOCLET_POLICY_SCHEMA_MAP)
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
        assignmentAlgorithm,
        stratificationFactor,
        tags,
      } = this.overviewForm.value;
      const stratificationFactorValueToSend = this.stratificationFactorValueToSend(
        stratificationFactor,
        assignmentAlgorithm
      );
      if (this.isStratificationFactorSelected) {
        const overviewFormData = {
          name: experimentName,
          description: description || '',
          consistencyRule: consistencyRule,
          conditionOrder: conditionOrder,
          assignmentUnit: unitOfAssignment,
          group: groupType,
          type: designType,
          context: [context],
          assignmentAlgorithm: assignmentAlgorithm,
          stratificationFactor: stratificationFactorValueToSend
            ? { stratificationFactorName: stratificationFactorValueToSend }
            : null,
          tags,
        };
        this.emitExperimentDialogEvent.emit({
          type: eventType,
          formData: overviewFormData,
          path: NewExperimentPaths.EXPERIMENT_OVERVIEW,
        });

        if (eventType == NewExperimentDialogEvents.SAVE_DATA) {
          this.experimentDesignStepperService.experimentStepperDataReset();
          this.overviewForm.markAsPristine();
        } else if (eventType == NewExperimentDialogEvents.SEND_FORM_DATA) {
          this.warningStatus = OverviewFormWarningStatus.NO_WARNING;
          this.isOverviewFormCompleted = true;
        }
      }
    }
  }

  stratificationFactorValueToSend(stratificationFactor: string, assignmentAlgorithm: ASSIGNMENT_ALGORITHM): string {
    let stratificationFactorValueToSend = stratificationFactor;
    if (assignmentAlgorithm === ASSIGNMENT_ALGORITHM.STRATIFIED_RANDOM_SAMPLING) {
      if (!stratificationFactor) {
        this.isStratificationFactorSelected = false;
        if (this.allStratificationFactors.length == 0) {
          this.stratificationFactorNotSelectedMsg = 'home.new-experiment.overview.no-stratification-factor.error.text';
        } else {
          this.stratificationFactorNotSelectedMsg = 'home.new-experiment.overview.stratification-factor.error.text';
        }
      } else {
        this.isStratificationFactorSelected = true;
      }
    } else {
      this.isStratificationFactorSelected = true;
      stratificationFactorValueToSend = null;
    }
    return stratificationFactorValueToSend;
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

  get assignmentAlgorithmValue() {
    return this.overviewForm.get('assignmentAlgorithm').value;
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
