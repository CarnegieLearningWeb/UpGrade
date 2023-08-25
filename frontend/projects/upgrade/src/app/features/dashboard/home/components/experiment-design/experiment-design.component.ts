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
  SimpleChanges,
  OnDestroy,
} from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators, UntypedFormArray, AbstractControl } from '@angular/forms';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import {
  NewExperimentDialogEvents,
  NewExperimentDialogData,
  NewExperimentPaths,
  ExperimentVM,
  ExperimentCondition,
  ExperimentDecisionPoint,
  IContextMetaData,
  EXPERIMENT_STATE,
} from '../../../../../core/experiments/store/experiments.model';
import { ExperimentFormValidators } from '../../validators/experiment-form.validators';
import { ExperimentService } from '../../../../../core/experiments/experiments.service';
import { TranslateService } from '@ngx-translate/core';
import { filter, map, startWith } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';
import { DialogService } from '../../../../../shared/services/dialog.service';
import { ExperimentDesignStepperService } from '../../../../../core/experiment-design-stepper/experiment-design-stepper.service';
import {
  DecisionPointsTableRowData,
  ConditionsTableRowData,
  SimpleExperimentFormData,
} from '../../../../../core/experiment-design-stepper/store/experiment-design-stepper.model';
import { SIMPLE_EXP_CONSTANTS } from './experiment-design.constants';

@Component({
  selector: 'home-experiment-design',
  templateUrl: './experiment-design.component.html',
  styleUrls: ['./experiment-design.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperimentDesignComponent implements OnInit, OnChanges, OnDestroy {
  // bind constants so they can be referenced in html template

  @Input() experimentInfo: ExperimentVM;
  @Input() currentContext: string;
  @Input() isContextChanged: boolean;
  @Input() isExperimentTypeChanged: boolean;
  @Input() animationCompleteStepperIndex: number;
  @Output() emitExperimentDialogEvent = new EventEmitter<NewExperimentDialogData>();

  @ViewChild(SIMPLE_EXP_CONSTANTS.VIEW_CHILD.STEP_CONTAINER, { read: ElementRef }) stepContainer: ElementRef;
  @ViewChild(SIMPLE_EXP_CONSTANTS.VIEW_CHILD.DECISION_POINTS, { read: ElementRef }) decisionPointTable: ElementRef;
  @ViewChild(SIMPLE_EXP_CONSTANTS.VIEW_CHILD.CONDITIONS, { read: ElementRef }) conditionTable: ElementRef;
  @ViewChild(SIMPLE_EXP_CONSTANTS.VIEW_CHILD.CONDITION_CODE) conditionCode: ElementRef;

  subscriptionHandler: Subscription;

  experimentDesignForm: UntypedFormGroup;
  conditionDataSource = new BehaviorSubject<AbstractControl[]>([]);
  decisionPointDataSource = new BehaviorSubject<AbstractControl[]>([]);
  allDecisionPoints = [];

  // Condition Errors
  conditionCountError: string;

  // Decision Point Errors
  decisionPointErrors = [];
  decisionPointErrorMessages = [];
  decisionPointCountError: string;

  previousAssignmentWeightValues = [];

  conditionDisplayedColumns = [
    SIMPLE_EXP_CONSTANTS.TABLE_COLUMNS.CONDITIONS.CONDITION_CODE,
    SIMPLE_EXP_CONSTANTS.TABLE_COLUMNS.CONDITIONS.ASSIGNMENT_WEIGHT,
    SIMPLE_EXP_CONSTANTS.TABLE_COLUMNS.CONDITIONS.DESCRIPTION,
    SIMPLE_EXP_CONSTANTS.TABLE_COLUMNS.CONDITIONS.ACTIONS,
  ];
  decisionPointDisplayedColumns = [
    SIMPLE_EXP_CONSTANTS.TABLE_COLUMNS.DECISION_POINTS.SITE,
    SIMPLE_EXP_CONSTANTS.TABLE_COLUMNS.DECISION_POINTS.TARGET,
    SIMPLE_EXP_CONSTANTS.TABLE_COLUMNS.DECISION_POINTS.EXCLUDE_IF_REACHED,
    SIMPLE_EXP_CONSTANTS.TABLE_COLUMNS.DECISION_POINTS.ACTIONS,
  ];

  // Used for condition code, experiment point and ids auto complete dropdown
  filteredConditionCodes$: Observable<string[]>[] = [];
  filteredSites$: Observable<string[]>[] = [];
  filteredTargets$: Observable<string[]>[] = [];
  contextMetaData: IContextMetaData = {
    contextMetadata: {},
  };

  conditionCodeErrors: string[] = [];
  equalWeightFlag = true;
  isExperimentEditable = true;
  isFormLockedForEdit$ = this.experimentDesignStepperService.isFormLockedForEdit$;

  // Decision Point table store references
  previousDecisionPointTableRowDataBehaviorSubject$ = new BehaviorSubject<DecisionPointsTableRowData>(null);
  isDecisionPointsTableEditMode$ = this.experimentDesignStepperService.isDecisionPointsTableEditMode$;
  decisionPointsTableEditIndex$ = this.experimentDesignStepperService.decisionPointsTableEditIndex$;

  // Condition table store references
  previousConditionTableRowDataBehaviorSubject$ = new BehaviorSubject<ConditionsTableRowData>(null);
  isConditionsTableEditMode$ = this.experimentDesignStepperService.isConditionsTableEditMode$;
  conditionsTableEditIndex$ = this.experimentDesignStepperService.conditionsTableEditIndex$;

  constructor(
    private _formBuilder: UntypedFormBuilder,
    private experimentService: ExperimentService,
    private translate: TranslateService,
    private dialogService: DialogService,
    private experimentDesignStepperService: ExperimentDesignStepperService
  ) {
    this.subscriptionHandler = this.translate
      .get([
        'home.new-experiment.design.assignment-decision-point-error-1.text',
        'home.new-experiment.design.assignment-decision-point-error-2.text',
        'home.new-experiment.design.assignment-decision-point-error-3.text',
        'home.new-experiment.design.assignment-decision-point-error-4.text',
      ])
      .subscribe((translatedMessage) => {
        this.decisionPointErrorMessages = [
          translatedMessage['home.new-experiment.design.assignment-decision-point-error-1.text'],
          translatedMessage['home.new-experiment.design.assignment-decision-point-error-2.text'],
          translatedMessage['home.new-experiment.design.assignment-decision-point-error-3.text'],
          translatedMessage['home.new-experiment.design.assignment-decision-point-error-4.text'],
        ];
      });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (
      changes.animationCompleteStepperIndex &&
      changes.animationCompleteStepperIndex.currentValue === 1 &&
      this.conditionCode
    ) {
      this.conditionCode.nativeElement.focus();
    }

    if (this.isContextChanged || this.isExperimentTypeChanged) {
      this.isContextChanged = false;
      this.decisionPoints?.clear();
      this.conditions?.clear();
      this.decisionPointDataSource.next(this.decisionPoints?.controls);
      this.conditionDataSource.next(this.conditions?.controls);
      this.isExperimentTypeChanged = false;

      if (this.experimentInfo) {
        this.experimentInfo.partitions = [];
        this.experimentInfo.conditions = [];
        this.experimentInfo.conditionPayloads = [];
      }
    }

    this.applyEqualWeight();
  }

  ngOnInit() {
    this.subscriptionHandler = this.experimentService.contextMetaData$.subscribe((contextMetaData) => {
      this.contextMetaData = contextMetaData;
    });
    this.subscriptionHandler = this.experimentService.allDecisionPoints$
      .pipe(filter((decisionPoints) => !!decisionPoints))
      .subscribe((decisionPoints: any) => {
        this.allDecisionPoints = decisionPoints.map((decisionPoint) =>
          decisionPoint.target ? decisionPoint.site + decisionPoint.target : decisionPoint.site
        );
      });
    this.experimentDesignForm = this._formBuilder.group({
      conditions: this._formBuilder.array([this.addConditions()]),
      decisionPoints: this._formBuilder.array([this.addDecisionPoints()]),
    });

    this.experimentDesignStepperService.decisionPointsEditModePreviousRowData$.subscribe(
      this.previousDecisionPointTableRowDataBehaviorSubject$
    );
    this.experimentDesignStepperService.conditionsEditModePreviousRowData$.subscribe(
      this.previousConditionTableRowDataBehaviorSubject$
    );

    // Remove previously added group of conditions and decision points
    this.conditions?.removeAt(0);
    this.decisionPoints?.removeAt(0);

    // populate values in form to update experiment if experiment data is available
    if (this.experimentInfo) {
      this.equalWeightFlag = this.experimentInfo.conditions.every(
        (condition) => condition.assignmentWeight === this.experimentInfo.conditions[0].assignmentWeight
      );
      this.experimentInfo.conditions.forEach((condition) => {
        this.conditions.push(
          this.addConditions(
            condition.id,
            condition.conditionCode,
            condition.assignmentWeight,
            condition.description,
            condition.order
          )
        );
      });
      this.experimentInfo.partitions.forEach((decisionPoint) => {
        this.decisionPoints.push(
          this.addDecisionPoints(
            decisionPoint.id,
            decisionPoint.site,
            decisionPoint.target,
            decisionPoint.description,
            decisionPoint.order,
            decisionPoint.excludeIfReached
          )
        );
      });

      this.handleDesignDataUpdate();

      this.isExperimentEditable =
        this.experimentInfo.state !== this.ExperimentState.ENROLLING &&
        this.experimentInfo.state !== this.ExperimentState.ENROLLMENT_COMPLETE;

      // disable control on edit:
      if (!this.isExperimentEditable) {
        this.experimentDesignForm.disable();
      }
    }
    this.updateView();

    // Bind predefined values of experiment conditionCode from backend
    this.conditions.controls.forEach((_, index) => {
      this.manageConditionCodeControl(index);
    });

    // Bind predefined values of experiment points and ids from backend
    this.decisionPoints.controls.forEach((_, index) => {
      this.manageSiteAndTargetControls(index);
    });
  }

  manageConditionCodeControl(index: number) {
    const conditionFormControl = this.conditions;
    const { CONDITION_CODE } = SIMPLE_EXP_CONSTANTS.FORM_CONTROL_NAMES;

    this.filteredConditionCodes$[index] = conditionFormControl
      .at(index)
      .get(CONDITION_CODE)
      .valueChanges.pipe(
        startWith<string>(''),
        map((conditionCode) => this.filterConditionCodes(conditionCode))
      );
    this.applyEqualWeight();
  }

  manageSiteAndTargetControls(index: number) {
    const { SITE, TARGET } = SIMPLE_EXP_CONSTANTS.FORM_CONTROL_NAMES;

    this.filteredSites$[index] = this.decisionPoints
      .at(index)
      .get(SITE)
      .valueChanges.pipe(
        startWith<string>(''),
        map((site) => this.filterSitesAndTargets(site, SIMPLE_EXP_CONSTANTS.FORM_CONTROL_NAMES.SITE))
      );
    this.filteredTargets$[index] = this.decisionPoints
      .at(index)
      .get(TARGET)
      .valueChanges.pipe(
        startWith<string>(''),
        map((target) => this.filterSitesAndTargets(target, SIMPLE_EXP_CONSTANTS.FORM_CONTROL_NAMES.TARGET))
      );
  }

  handleBackBtnClick() {
    return this.experimentDesignForm.dirty && this.experimentDesignStepperService.experimentStepperDataChanged();
  }

  handleDesignDataUpdate() {
    this.experimentDesignStepperService.setNewDesignData({
      decisionPoints: this.decisionPoints.value,
      conditions: this.conditions.value,
    });
  }

  handleDecisionPointTableEditClick(rowIndex: number, rowData: DecisionPointsTableRowData) {
    if (this.isDecisionPointTableRowValid()) {
      this.experimentDesignStepperService.setDecisionPointTableEditModeDetails(rowIndex, rowData);
      this.handleDesignDataUpdate();
    }
  }

  handleConditionTableEditClick(rowIndex: number, rowData: ConditionsTableRowData) {
    if (this.isConditionTableRowValid()) {
      this.experimentDesignStepperService.setConditionTableEditModeDetails(rowIndex, rowData);
      this.handleDesignDataUpdate();
    }
  }

  handleDecisionPointTableClearOrRemoveRow(rowIndex: number): void {
    // grab previous data before dispatching reset to store
    const previousRowData = this.previousDecisionPointTableRowDataBehaviorSubject$.value;

    if (previousRowData) {
      this.resetPreviousDecisionPointRowDataOnEditCancel(previousRowData, rowIndex);
    } else {
      this.removeConditionOrDecisionPoint(SIMPLE_EXP_CONSTANTS.FORM_CONTROL_NAMES.DECISION_POINTS_ARRAY, rowIndex);
    }
  }

  handleConditionTableClearOrRemoveRow(rowIndex: number): void {
    // grab previous data before dispatching reset to store
    const previousRowData = this.previousConditionTableRowDataBehaviorSubject$.value;

    if (previousRowData) {
      this.resetPreviousConditionRowDataOnEditCancel(previousRowData, rowIndex);
    } else {
      this.removeConditionOrDecisionPoint(SIMPLE_EXP_CONSTANTS.FORM_CONTROL_NAMES.CONDITIONS_ARRAY, rowIndex);
    }
  }

  resetPreviousDecisionPointRowDataOnEditCancel(previousRowData: DecisionPointsTableRowData, rowIndex: number): void {
    const decisionPointTableRow = this.decisionPoints.controls.at(rowIndex);
    const { SITE, TARGET, EXCLUDE_IF_REACHED, ORDER } = SIMPLE_EXP_CONSTANTS.FORM_CONTROL_NAMES;

    if (decisionPointTableRow) {
      decisionPointTableRow.get(SITE).setValue(previousRowData.site, { emitEvent: false });
      decisionPointTableRow.get(TARGET).setValue(previousRowData.target, { emitEvent: false });
      decisionPointTableRow.get(EXCLUDE_IF_REACHED).setValue(previousRowData.excludeIfReached, { emitEvent: false });
      decisionPointTableRow.get(ORDER).setValue(previousRowData.order, { emitEvent: false });
    }

    this.experimentDesignStepperService.clearDecisionPointTableEditModeDetails();
  }

  resetPreviousConditionRowDataOnEditCancel(previousRowData: ConditionsTableRowData, rowIndex: number): void {
    const conditionTableRow = this.conditions.controls.at(rowIndex);
    const { CONDITION_CODE, ASSIGNMENT_WEIGHT, DESCRIPTION, ORDER } = SIMPLE_EXP_CONSTANTS.FORM_CONTROL_NAMES;

    if (conditionTableRow) {
      conditionTableRow.get(CONDITION_CODE).setValue(previousRowData.conditionCode, { emitEvent: false });
      conditionTableRow.get(ASSIGNMENT_WEIGHT).setValue(previousRowData.assignmentWeight, { emitEvent: false });
      conditionTableRow.get(DESCRIPTION).setValue(previousRowData.description, { emitEvent: false });
      conditionTableRow.get(ORDER).setValue(previousRowData.order, { emitEvent: false });
    }

    this.experimentDesignStepperService.clearConditionTableEditModeDetails();
  }

  private filterConditionCodes(value: string): string[] {
    const filterValue = value ? value.toLocaleLowerCase() : '';

    if (!this.contextMetaData) {
      return [];
    }

    if (this.currentContext) {
      const currentContextConditionCode = this.contextMetaData.contextMetadata[this.currentContext].CONDITIONS || [];
      return currentContextConditionCode.filter((option) => option.toLowerCase().startsWith(filterValue));
    }
    return [];
  }

  private filterSitesAndTargets(value: string, key: string): string[] {
    const filterValue = value ? value.toLocaleLowerCase() : '';

    if (!this.contextMetaData) {
      return [];
    }

    if (key === SIMPLE_EXP_CONSTANTS.FORM_CONTROL_NAMES.SITE && this.currentContext) {
      const currentContextExpPoints = this.contextMetaData.contextMetadata[this.currentContext].EXP_POINTS || [];
      return currentContextExpPoints.filter((option) => option.toLowerCase().startsWith(filterValue));
    } else if (key === SIMPLE_EXP_CONSTANTS.FORM_CONTROL_NAMES.TARGET && this.currentContext) {
      const currentContextExpIds = this.contextMetaData.contextMetadata[this.currentContext].EXP_IDS || [];
      return currentContextExpIds.filter((option) => option.toLowerCase().startsWith(filterValue));
    }
    return [];
  }

  addConditions(id = null, conditionCode = null, assignmentWeight = null, description = null, order = null) {
    return this._formBuilder.group({
      id: [id || uuidv4()],
      conditionCode: [conditionCode, Validators.required],
      assignmentWeight: [assignmentWeight, Validators.required],
      description: [description],
      order: [order],
    });
  }

  addDecisionPoints(id = null, site = null, target = null, description = '', order = null, excludeIfReached = false) {
    return this._formBuilder.group({
      id: [id || uuidv4()],
      site: [site, Validators.required],
      target: [target, Validators.required],
      description: [description],
      order: [order],
      excludeIfReached: [excludeIfReached],
    });
  }

  addConditionOrDecisionPoint(formArrayName: string) {
    const { DECISION_POINT_TABLE, CONDITION_TABLE } = SIMPLE_EXP_CONSTANTS.TEMPLATE_REF;
    const isDecisionPoint = formArrayName === SIMPLE_EXP_CONSTANTS.FORM_CONTROL_NAMES.DECISION_POINTS_ARRAY;
    const form = isDecisionPoint ? this.addDecisionPoints() : this.addConditions();
    this[formArrayName].push(form);
    const scrollTableType = isDecisionPoint ? DECISION_POINT_TABLE : CONDITION_TABLE;
    this.updateView(scrollTableType);
    if (isDecisionPoint) {
      this.manageSiteAndTargetControls(this.decisionPoints.controls.length - 1);
      this.experimentDesignStepperService.setDecisionPointTableEditModeDetails(
        this.decisionPoints.controls.length - 1,
        null
      );
    } else {
      this.manageConditionCodeControl(this.conditions.controls.length - 1);
      this.experimentDesignStepperService.setConditionTableEditModeDetails(this.conditions.controls.length - 1, null);
    }
  }

  removeConditionOrDecisionPoint(formArrayName: string, groupIndex: number) {
    const isDecisionPoint = formArrayName === SIMPLE_EXP_CONSTANTS.FORM_CONTROL_NAMES.DECISION_POINTS_ARRAY;
    this[formArrayName].removeAt(groupIndex);
    if (this.experimentInfo) {
      if (isDecisionPoint) {
        const deletedDecisionPoint = this.experimentInfo.partitions.find(({ order }) => order === groupIndex + 1);
        if (deletedDecisionPoint) {
          this.experimentInfo.partitions = this.experimentInfo.partitions.filter(
            (decisionPoint) => decisionPoint == deletedDecisionPoint
          );
          if (this.experimentInfo.revertTo === deletedDecisionPoint.id) {
            this.experimentInfo.revertTo = null;
          }
        }
      } else {
        const deletedCondition = this.experimentInfo.conditions.find((condition) => condition.order === groupIndex + 1);
        if (deletedCondition) {
          this.experimentInfo.conditions = this.experimentInfo.conditions.filter(
            (condition) => condition == deletedCondition
          );
          if (this.experimentInfo.revertTo === deletedCondition.id) {
            this.experimentInfo.revertTo = null;
          }
        }
      }
    }
    if (!isDecisionPoint) {
      this.previousAssignmentWeightValues.splice(groupIndex, 1);
      this.applyEqualWeight();
    }
    this.experimentDesignStepperService.experimentStepperDataChanged();
    this.experimentDesignStepperService.clearDecisionPointTableEditModeDetails();
    this.experimentDesignStepperService.clearConditionTableEditModeDetails();
    this.handleDesignDataUpdate();
    this.updateView();
  }

  updateView(type?: string) {
    this.conditionDataSource.next(this.conditions.controls);
    this.decisionPointDataSource.next(this.decisionPoints.controls);
    if (type) {
      this[type].nativeElement.scroll({
        top: this[type].nativeElement.scrollHeight - 91,
        behavior: 'smooth',
      });
    }
  }

  validateDecisionPointNames(decisionPoints: ExperimentDecisionPoint[]) {
    this.decisionPointErrors = [];
    // Used to differentiate errors
    const duplicateDecisionPoints = [];

    // Used for updating existing experiment
    if (this.experimentInfo) {
      this.experimentInfo.partitions.forEach(({ site, target }) => {
        const decisionPointIdentifier = target ? site + target : site;
        const index = this.allDecisionPoints.indexOf(decisionPointIdentifier);
        if (index !== -1) {
          this.allDecisionPoints.splice(index, 1);
        }
      });
    }

    decisionPoints.forEach(({ site, target }, index) => {
      if (
        decisionPoints.find(
          (value, decisionPointIndex) =>
            value.site === site &&
            (value.target || '') === (target || '') && // To match null and empty string, add '' as default value. target as optional and hence it's value can be null.
            decisionPointIndex !== index &&
            !duplicateDecisionPoints.includes(target ? site + ' and ' + target : site)
        )
      ) {
        duplicateDecisionPoints.push(target ? site + ' and ' + target : site);
      }
    });

    // Decision Points error messages
    if (duplicateDecisionPoints.length === 1) {
      this.decisionPointErrors.push(duplicateDecisionPoints[0] + this.decisionPointErrorMessages[2]);
    } else if (duplicateDecisionPoints.length > 1) {
      this.decisionPointErrors.push(duplicateDecisionPoints.join(', ') + this.decisionPointErrorMessages[3]);
    }
  }

  isDecisionPointTableRowValid(): boolean {
    const decisionPoint = this.decisionPoints.value;

    this.validateDecisionPointNames(decisionPoint);
    this.validateDecisionPointCount(decisionPoint);

    return !this.decisionPointErrors.length && !this.decisionPointCountError;
  }

  isConditionTableRowValid(): boolean {
    const conditions = this.conditions.value;

    this.validateConditionCount(conditions);
    this.validateHasConditionCodeDefault(conditions);
    this.validateConditionCodes(conditions);

    return !this.conditionCodeErrors.length && !this.conditionCountError;
  }

  validateConditionCodes(conditions: ExperimentCondition[]) {
    const conditionUniqueErrorText = this.translate.instant(
      'home.new-experiment.design.condition-unique-validation.text'
    );
    const conditionCodes = conditions.map((condition) => condition.conditionCode);
    const hasUniqueConditionError = conditionCodes.length !== new Set(conditionCodes).size;
    if (hasUniqueConditionError && !this.conditionCodeErrors.includes(conditionUniqueErrorText)) {
      this.conditionCodeErrors.push(conditionUniqueErrorText);
    } else if (!hasUniqueConditionError) {
      const index = this.conditionCodeErrors.indexOf(conditionUniqueErrorText, 0);
      if (index > -1) {
        this.conditionCodeErrors.splice(index, 1);
      }
    }
  }

  validateHasConditionCodeDefault(conditions: ExperimentCondition[]) {
    const defaultKeyword = this.translate.instant('home.new-experiment.design.condition.invalid.text');
    const defaultConditionCodeErrorText = this.translate.instant(
      'home.new-experiment.design.condition-name-validation.text'
    );
    if (conditions.length) {
      const hasDefaultConditionCode = conditions.filter(
        (condition) =>
          typeof condition.conditionCode === 'string' && condition.conditionCode.toUpperCase().trim() === defaultKeyword
      );
      if (hasDefaultConditionCode.length && !this.conditionCodeErrors.includes(defaultConditionCodeErrorText)) {
        this.conditionCodeErrors.push(defaultConditionCodeErrorText);
      } else if (!hasDefaultConditionCode.length) {
        const index = this.conditionCodeErrors.indexOf(defaultConditionCodeErrorText, 0);
        if (index > -1) {
          this.conditionCodeErrors.splice(index, 1);
        }
      }
    }
  }

  validateHasAssignmentWeightsNegative(conditions: ExperimentCondition[]) {
    const negativeAssignmentWeightErrorText = this.translate.instant(
      'home.new-experiment.design.assignment-weight-negative.text'
    );
    if (conditions.length) {
      const hasNegativeAssignmentWeights = conditions.filter((condition) => condition.assignmentWeight < 0);
      if (
        hasNegativeAssignmentWeights.length &&
        !this.conditionCodeErrors.includes(negativeAssignmentWeightErrorText)
      ) {
        this.conditionCodeErrors.push(negativeAssignmentWeightErrorText);
      } else if (!hasNegativeAssignmentWeights.length) {
        const index = this.conditionCodeErrors.indexOf(negativeAssignmentWeightErrorText, 0);
        if (index > -1) {
          this.conditionCodeErrors.splice(index, 1);
        }
      }
    }
  }

  validateConditionCount(conditions: ExperimentCondition[]) {
    const conditionCountErrorMsg = this.translate.instant(
      'home.new-experiment.design.condition-count-new-exp-error.text'
    );
    if (
      conditions.length === 0 ||
      !conditions.every(
        (condition) =>
          typeof condition.conditionCode === 'string' &&
          condition.conditionCode.trim() &&
          condition.assignmentWeight !== null
      )
    ) {
      this.conditionCountError = conditionCountErrorMsg;
    } else {
      this.conditionCountError = null;
    }
  }

  validateDecisionPointCount(decisionPoints: ExperimentDecisionPoint[]) {
    const decisionPointCountErrorMsg = this.translate.instant(
      'home.new-experiment.design.decision-point-count-new-exp-error.text'
    );
    if (
      decisionPoints.length === 0 ||
      !decisionPoints.every(
        ({ site, target }) =>
          this.experimentDesignStepperService.isValidString(site) &&
          this.experimentDesignStepperService.isValidString(target)
      )
    ) {
      this.decisionPointCountError = decisionPointCountErrorMsg;
    } else {
      this.decisionPointCountError = null;
    }
  }

  removeDecisionPointName(decisionPoint: ExperimentDecisionPoint) {
    delete decisionPoint.target;
    return decisionPoint;
  }

  isFormValid() {
    return (
      !this.decisionPointErrors.length &&
      this.experimentDesignForm.valid &&
      !this.conditionCodeErrors.length &&
      this.decisionPointCountError === null &&
      this.conditionCountError === null
    );
  }

  validateForm() {
    this.experimentDesignForm.setValidators(ExperimentFormValidators.validateExperimentDesignForm);
    this.experimentDesignForm.updateValueAndValidity();
    this.validateConditionCodes(this.conditions.value);
    this.validateConditionCount(this.conditions.getRawValue());
    this.validateDecisionPointCount(this.decisionPoints.value);
    this.validateHasConditionCodeDefault(this.conditions.value);
    this.validateHasAssignmentWeightsNegative(this.conditions.getRawValue());
  }

  emitEvent(eventType: NewExperimentDialogEvents) {
    switch (eventType) {
      case NewExperimentDialogEvents.CLOSE_DIALOG:
        if (
          this.experimentDesignForm.dirty ||
          this.experimentDesignStepperService.getHasExperimentDesignStepperDataChanged()
        ) {
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
        if (this.experimentDesignForm.dirty) {
          this.experimentDesignStepperService.experimentStepperDataChanged();
        }
        if (!this.isExperimentEditable) {
          this.emitExperimentDialogEvent.emit({
            type: eventType,
            formData: this.experimentInfo,
            path: NewExperimentPaths.EXPERIMENT_DESIGN,
          });
          break;
        }
        this.saveData(eventType);
        break;
      case NewExperimentDialogEvents.SAVE_DATA:
        if (!this.isExperimentEditable) {
          this.emitExperimentDialogEvent.emit({
            type: eventType,
            formData: this.experimentInfo,
            path: NewExperimentPaths.EXPERIMENT_DESIGN,
          });
          break;
        }
        this.saveData(eventType);
        break;
    }
  }

  saveData(eventType: NewExperimentDialogEvents) {
    this.validateForm();

    if (!this.decisionPointErrors.length && !this.conditionCodeErrors.length && !this.decisionPointCountError) {
      this.conditions.controls.forEach((control) => {
        control.get(SIMPLE_EXP_CONSTANTS.FORM_CONTROL_NAMES.ASSIGNMENT_WEIGHT).enable({ emitEvent: false });
      });
    }
    if (this.isFormValid()) {
      const experimentDesignFormData = this.experimentDesignForm.value;
      let order = 1;
      experimentDesignFormData.conditions = experimentDesignFormData.conditions.map((condition, index) => {
        if (isNaN(condition.assignmentWeight)) {
          condition.assignmentWeight = Number(condition.assignmentWeight.slice(0, -1));
        } else {
          condition.assignmentWeight = Number(condition.assignmentWeight);
        }
        return this.experimentInfo
          ? { ...this.experimentInfo.conditions[index], ...condition, order: order++ }
          : { ...condition, name: '', order: order++ };
      });
      order = 1;
      experimentDesignFormData.decisionPoints = experimentDesignFormData.decisionPoints.map((decisionPoint, index) => {
        return this.experimentInfo
          ? { ...this.experimentInfo.partitions[index], ...decisionPoint, order: order++ }
          : decisionPoint.target
          ? { ...decisionPoint, order: order++ }
          : { ...this.removeDecisionPointName(decisionPoint), order: order++ };
      });
      experimentDesignFormData.conditionPayloads =
        this.experimentDesignStepperService.createExperimentConditionPayloadRequestObject({
          decisionPoints: experimentDesignFormData.decisionPoints,
          conditions: experimentDesignFormData.conditions,
        });
      this.emitExperimentDialogEvent.emit({
        type: eventType,
        formData: this.renameDecisionPointsAsPartitionsTEMPORARY(experimentDesignFormData),
        path: NewExperimentPaths.EXPERIMENT_DESIGN,
      });
      if (eventType == NewExperimentDialogEvents.SAVE_DATA) {
        this.experimentDesignStepperService.experimentStepperDataReset();
        this.experimentDesignForm.markAsPristine();
      }
    }
  }

  renameDecisionPointsAsPartitionsTEMPORARY(experimentDesignFormData: SimpleExperimentFormData) {
    const renamedFormData = { ...experimentDesignFormData };
    renamedFormData.partitions = experimentDesignFormData.decisionPoints;
    delete renamedFormData.decisionPoints;
    return renamedFormData;
  }

  applyEqualWeight() {
    if (this.experimentDesignForm) {
      if (this.equalWeightFlag) {
        const len = this.conditions.controls.length;
        this.previousAssignmentWeightValues = [];
        this.conditions.controls.forEach((control) => {
          const assignmentWeightFormControl = control.get(SIMPLE_EXP_CONSTANTS.FORM_CONTROL_NAMES.ASSIGNMENT_WEIGHT);
          assignmentWeightFormControl.setValue(parseFloat((100.0 / len).toFixed(1)).toString());
          this.previousAssignmentWeightValues.push(assignmentWeightFormControl.value);
          assignmentWeightFormControl.disable();
        });
      } else {
        this.conditions.controls.forEach((control, index) => {
          const assignmentWeightFormControl = control.get(SIMPLE_EXP_CONSTANTS.FORM_CONTROL_NAMES.ASSIGNMENT_WEIGHT);
          assignmentWeightFormControl.setValue(
            control.value.assignmentWeight ? control.value.assignmentWeight : 0
          );
          if (this.isExperimentEditable) {
            assignmentWeightFormControl.enable();
          }
        });
      }
    }
  }

  changeEqualWeightFlag(event) {
    event.checked ? (this.equalWeightFlag = true) : (this.equalWeightFlag = false);
    this.applyEqualWeight();
  }

  get conditions(): UntypedFormArray {
    return this.experimentDesignForm?.get(SIMPLE_EXP_CONSTANTS.FORM_CONTROL_NAMES.CONDITIONS_ARRAY) as UntypedFormArray;
  }

  get decisionPoints(): UntypedFormArray {
    return this.experimentDesignForm?.get(
      SIMPLE_EXP_CONSTANTS.FORM_CONTROL_NAMES.DECISION_POINTS_ARRAY
    ) as UntypedFormArray;
  }

  get NewExperimentDialogEvents() {
    return NewExperimentDialogEvents;
  }

  get SIMPLE_EXP_CONSTANTS() {
    return SIMPLE_EXP_CONSTANTS;
  }

  get ExperimentState() {
    return EXPERIMENT_STATE;
  }

  get payloadTableData$() {
    return this.experimentDesignStepperService.simpleExperimentPayloadTableData$;
  }

  ngOnDestroy() {
    this.subscriptionHandler.unsubscribe();
    this.experimentDesignStepperService.clearDecisionPointTableEditModeDetails();
    this.experimentDesignStepperService.clearConditionTableEditModeDetails();
  }
}
