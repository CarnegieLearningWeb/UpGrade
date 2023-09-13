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
import { ExperimentService } from '../../../../../core/experiments/experiments.service';
import { TranslateService } from '@ngx-translate/core';
import { v4 as uuidv4 } from 'uuid';
import { filter, map, startWith } from 'rxjs/operators';
import { DialogService } from '../../../../../shared/services/dialog.service';
import { ExperimentDesignStepperService } from '../../../../../core/experiment-design-stepper/experiment-design-stepper.service';
import {
  DecisionPointsTableRowData,
  ExperimentConditionPayloadRequestObject,
  ExperimentFactorialDesignData,
  FactorialConditionRequestObject,
  FactorialConditionTableRowData,
  FactorialFactorTableRowData,
  FactorialLevelTableRowData,
} from '../../../../../core/experiment-design-stepper/store/experiment-design-stepper.model';
import { FACTORIAL_EXP_CONSTANTS } from './factorial-experiment-design.constants';
import { PAYLOAD_TYPE } from '../../../../../../../../../../types/src';

@Component({
  selector: 'home-factorial-experiment-design',
  templateUrl: './factorial-experiment-design.component.html',
  styleUrls: ['./factorial-experiment-design.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FactorialExperimentDesignComponent implements OnInit, OnChanges, OnDestroy {
  @Input() experimentInfo: ExperimentVM;
  @Input() currentContext: string;
  @Input() isContextChanged: boolean;
  @Input() isExperimentTypeChanged: boolean;
  @Input() animationCompleteStepperIndex: number;
  @Output() emitExperimentDialogEvent = new EventEmitter<NewExperimentDialogData>();

  @ViewChild('stepContainer', { read: ElementRef }) stepContainer: ElementRef;
  @ViewChild('decisionPointTable', { read: ElementRef }) decisionPointTable: ElementRef;
  @ViewChild('factorTable', { read: ElementRef }) factorTable: ElementRef;
  @ViewChild('levelTable', { read: ElementRef }) levelTable: ElementRef;

  subscriptionHandler: Subscription;

  factorialExperimentDesignForm: UntypedFormGroup;
  decisionPointDataSource = new BehaviorSubject<AbstractControl[]>([]);
  factorDataSource = new BehaviorSubject<AbstractControl[]>([]);
  tableData$ = new BehaviorSubject<FactorialLevelTableRowData[]>([]);
  allDecisionPoints = [];

  // Decision Point Errors
  decisionPointErrors = [];
  decisionPointErrorMessages = [];
  decisionPointCountError: string;

  // Factor Errors
  factorPointErrors = [];
  factorCountError: string = null;

  // Level Errors
  levelPointErrors = [];
  levelCountError: string = null;

  expandedId: number = null;
  levelIds: string[] = [];
  conditionCountError: string = null;

  decisionPointDisplayedColumns = ['site', 'target', 'excludeIfReached', 'actions'];
  factorDisplayedColumns = ['expandIcon', 'factor', 'description', 'actions'];
  levelDisplayedColumns = ['level', 'payload', 'actions'];

  // Used for experiment point and ids auto complete dropdown
  filteredSites$: Observable<string[]>[] = [];
  filteredTargets$: Observable<string[]>[] = [];
  contextMetaData: IContextMetaData = {
    contextMetadata: {},
  };

  conditionTableDataUpToDate = true;
  isExperimentEditable = true;
  isAnyRowRemoved = false;
  // common lock variable for all tables:
  isFormLockedForEdit$ = this.experimentDesignStepperService.isFormLockedForEdit$;

  // Decision Point table store references
  previousDecisionPointTableRowDataBehaviorSubject$ = new BehaviorSubject<DecisionPointsTableRowData>(null);
  isDecisionPointsTableEditMode$ = this.experimentDesignStepperService.isDecisionPointsTableEditMode$;
  decisionPointsTableEditIndex$ = this.experimentDesignStepperService.decisionPointsTableEditIndex$;

  // level table
  previousLevelTableRowDataBehaviorSubject$ = new BehaviorSubject<FactorialLevelTableRowData>(null);
  isLevelsTableEditMode$ = this.experimentDesignStepperService.isFactorialLevelsTableEditMode$;
  levelsTableEditIndex$ = this.experimentDesignStepperService.factorialLevelsTableEditIndex$;

  // factor table
  previousFactorTableRowDataBehaviorSubject$ = new BehaviorSubject<FactorialFactorTableRowData>(null);
  isFactorsTableEditMode$ = this.experimentDesignStepperService.isFactorialFactorsTableEditMode$;
  factorsTableEditIndex$ = this.experimentDesignStepperService.factorialFactorsTableEditIndex$;
  factorsTableIndex$ = this.experimentDesignStepperService.factorialFactorsTableIndex$;

  // Payload Table details
  designData$ = new BehaviorSubject<[ExperimentDecisionPoint[], ExperimentCondition[]]>([[], []]);
  factorialConditionsTableData: FactorialConditionTableRowData[] = [];
  factorialConditions: FactorialConditionRequestObject[] = [];

  constructor(
    private _formBuilder: UntypedFormBuilder,
    private experimentService: ExperimentService,
    private translate: TranslateService,
    private dialogService: DialogService,
    public experimentDesignStepperService: ExperimentDesignStepperService
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

  ngOnChanges() {
    if (this.isContextChanged || this.isExperimentTypeChanged) {
      this.isContextChanged = false;
      this.isExperimentTypeChanged = false;
      this.decisionPoints?.clear();
      this.factor?.clear();
      this.level?.clear();
      this.decisionPointDataSource.next(this.decisionPoints?.controls);
      this.factorDataSource.next(this.factor?.controls);
      if (this.experimentInfo) {
        this.experimentInfo.partitions = [];
        this.experimentInfo.conditions = [];
        this.experimentInfo.factors = [];
        this.experimentInfo.conditionPayloads = [];
      }
    }
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

    this.subscriptionHandler = this.experimentDesignStepperService.factorialConditionTableData$.subscribe(
      (tableData) => {
        this.factorialConditionsTableData = tableData;
      }
    );

    this.factorialExperimentDesignForm = this._formBuilder.group({
      decisionPoints: this._formBuilder.array([this.addDecisionPoints()]),
      factors: this._formBuilder.array([this.addFactors()]),
    });

    this.experimentDesignStepperService.decisionPointsEditModePreviousRowData$.subscribe(
      this.previousDecisionPointTableRowDataBehaviorSubject$
    );

    this.experimentDesignStepperService.factorialFactorsEditModePreviousRowData$.subscribe(
      this.previousFactorTableRowDataBehaviorSubject$
    );

    this.experimentDesignStepperService.factorialLevelsEditModePreviousRowData$.subscribe(
      this.previousLevelTableRowDataBehaviorSubject$
    );

    // Remove previously added group of decision points
    this.decisionPoints?.removeAt(0);
    this.factor?.removeAt(0);

    // populate values in form to update experiment if experiment data is available
    let factorIndex = 0;
    if (this.experimentInfo) {
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

      this.experimentInfo.factors.forEach((factor) => {
        this.factor.push(this.addFactors(factor.name, factor.description, factor.order));
        this.getFactorialLevelsAt(factorIndex).removeAt(0);
        factor.levels.forEach((level) => {
          this.getFactorialLevelsAt(factorIndex).push(this.addLevels(level.id, level.name, level.payload.value));
        });
        factorIndex++;
      });

      this.experimentDesignStepperService.updateFactorialDesignData(this.factorialExperimentDesignForm.value);

      this.isExperimentEditable =
        this.experimentInfo.state !== this.ExperimentState.ENROLLING &&
        this.experimentInfo.state !== this.ExperimentState.ENROLLMENT_COMPLETE;

      // disable control on edit:
      if (!this.isExperimentEditable) {
        this.factorialExperimentDesignForm.disable();
      }
    }
    this.updateView();

    // Bind predefined values of experiment points and ids from backend
    this.decisionPoints.controls.forEach((_, index) => {
      this.manageSiteAndTargetControls(index);
    });

    this.factorialExperimentDesignForm.get('factors').valueChanges.subscribe(() => {
      this.conditionTableDataUpToDate = false;
    });
  }

  manageSiteAndTargetControls(index: number) {
    const { SITE, TARGET } = FACTORIAL_EXP_CONSTANTS.FORM_CONTROL_NAMES;

    this.filteredSites$[index] = this.decisionPoints
      .at(index)
      .get(SITE)
      .valueChanges.pipe(
        startWith<string>(''),
        map((site) => this.filterSitesAndTargets(site, FACTORIAL_EXP_CONSTANTS.FORM_CONTROL_NAMES.SITE))
      );
    this.filteredTargets$[index] = this.decisionPoints
      .at(index)
      .get(TARGET)
      .valueChanges.pipe(
        startWith<string>(''),
        map((target) => this.filterSitesAndTargets(target, FACTORIAL_EXP_CONSTANTS.FORM_CONTROL_NAMES.TARGET))
      );
  }

  private filterSitesAndTargets(value: string, key: string): string[] {
    const filterValue = value ? value.toLocaleLowerCase() : '';

    if (!this.contextMetaData) {
      return [];
    }

    if (key === FACTORIAL_EXP_CONSTANTS.FORM_CONTROL_NAMES.SITE && this.currentContext) {
      const currentContextExpPoints = this.contextMetaData.contextMetadata[this.currentContext].EXP_POINTS || [];
      return currentContextExpPoints.filter((option) => option.toLowerCase().startsWith(filterValue));
    } else if (key === FACTORIAL_EXP_CONSTANTS.FORM_CONTROL_NAMES.TARGET && this.currentContext) {
      const currentContextExpIds = this.contextMetaData.contextMetadata[this.currentContext].EXP_IDS || [];
      return currentContextExpIds.filter((option) => option.toLowerCase().startsWith(filterValue));
    }
    return [];
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

  addFactors(name = null, description = '', order = null, level = null, payload = '') {
    return this._formBuilder.group({
      name: [name, Validators.required],
      description: [description],
      order: [order],
      levels: this._formBuilder.array([this.addLevels(level, payload)]),
    });
  }

  addLevels(id = null, name = null, payload = '') {
    return this._formBuilder.group({
      id: [id || uuidv4()],
      name: [name, Validators.required],
      payload: this._formBuilder.group({ type: PAYLOAD_TYPE.STRING, value: [payload] }),
    });
  }

  addDecisionPoint() {
    this.decisionPoints.push(this.addDecisionPoints());
    const scrollTableType = 'decisionPointTable';
    this.updateView(scrollTableType);
    this.manageSiteAndTargetControls(this.decisionPoints.controls.length - 1);

    this.experimentDesignStepperService.setDecisionPointTableEditModeDetails(
      this.decisionPoints.controls.length - 1,
      null
    );
  }

  addFactor() {
    const form = this.addFactors();
    this.factor?.push(form);
    this.updateView('factorTable');
    const factorIndex = this.factor?.controls.length - 1;
    this.experimentDesignStepperService.setFactorialFactorTableEditModeDetails(factorIndex, null);
    if (this.factor?.length > 1) {
      this.handleConditionsButtonClick();
    }
  }

  addLevel(factorIndex: number) {
    this.getFactorialLevelsAt(factorIndex).push(this.addLevels());
    this.updateView('levelTable');
    this.experimentDesignStepperService.setFactorialFactorTableIndex(factorIndex);
    this.experimentDesignStepperService.setFactorialLevelTableEditModeDetails(
      this.getFactorialLevelsAt(factorIndex).controls.length - 1,
      null
    );
  }

  removeDecisionPoint(groupIndex: number) {
    this.decisionPoints.removeAt(groupIndex);
    if (this.experimentInfo) {
      const deletedDecisionPoint = this.experimentInfo.partitions.find(({ order }) => order === groupIndex + 1);
      if (deletedDecisionPoint) {
        this.experimentInfo.partitions = this.experimentInfo.partitions.filter(
          (decisionPoint) => decisionPoint == deletedDecisionPoint
        );
        if (this.experimentInfo.revertTo === deletedDecisionPoint.id) {
          this.experimentInfo.revertTo = null;
        }
      }
    }
    this.experimentDesignStepperService.experimentStepperDataChanged();
    this.experimentDesignStepperService.clearDecisionPointTableEditModeDetails();
    this.updateView('decisionPointTable');
  }

  removeFactor(groupIndex: number) {
    this.factor.removeAt(groupIndex);
    this.handleConditionsButtonClick();
    this.isAnyRowRemoved = true;
    this.experimentDesignStepperService.experimentStepperDataChanged();
    this.experimentDesignStepperService.clearFactorialFactorTableEditModeDetails();
    this.updateView('factorTable');
    if (this.expandedId === groupIndex) {
      this.expandedId = null;
    }
  }

  removeLevel(factorIndex: number, levelIndex: number) {
    this.getFactorialLevelsAt(factorIndex).removeAt(levelIndex);
    this.handleConditionsButtonClick();
    this.isAnyRowRemoved = true;
    this.experimentDesignStepperService.experimentStepperDataChanged();
    this.experimentDesignStepperService.clearFactorialLevelTableEditModeDetails();
    this.updateView('levelTable');
  }

  expandFactor(factorIndex: number) {
    this.expandedId = this.expandedId === factorIndex ? null : factorIndex;
  }

  updateView(type?: string) {
    if (type === 'levelTable') {
      this.factorDataSource.next(this.level?.controls);
    } else if (type === 'factorTable') {
      this.factorDataSource.next(this.factor?.controls);
    } else if (type === 'decisionPointTable') {
      this.decisionPointDataSource.next(this.decisionPoints.controls);
    }
    this.factorDataSource.next(this.factor?.controls);
    this.decisionPointDataSource.next(this.decisionPoints.controls);
  }

  // validations:
  isDecisionPointTableRowValid(): boolean {
    const decisionPoint = this.decisionPoints.value;

    this.validateDecisionPointNames(decisionPoint);
    this.validateDecisionPointCount(decisionPoint);

    return !this.decisionPointErrors.length && !this.decisionPointCountError;
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

  isFactorTableRowValid(factorRowIndex: number): boolean {
    const factors = this.factor.value;
    const factorRow = factors[factorRowIndex];
    this.factorPointErrors = [];
    if (!factorRow.name?.trim()) {
      return false;
    }
    if (factors.some((factor, index) => factor.name === factorRow.name && index !== factorRowIndex)) {
      this.factorPointErrors.push('Factor should be unique');
    }
    return !this.factorPointErrors.length;
  }

  isLevelTableRowValid(levelRowIndex: number, factorIndex: number): boolean {
    const levels = this.getFactorialLevelsAt(factorIndex).value;
    const levelRow = levels[levelRowIndex];
    this.levelPointErrors = [];
    if (!levelRow.name?.trim()) {
      return false;
    }
    if (levels.some((level, index) => level.name === levelRow.name && index !== levelRowIndex)) {
      this.levelPointErrors.push('Level should be unique');
    }
    return !this.levelPointErrors.length;
  }

  validateFactorCount(factorialExperimentDesignFormData: ExperimentFactorialDesignData) {
    this.factorCountError = null;
    this.levelCountError = null;
    this.expandedId = 0;
    const factorCountErrorMsg = this.translate.instant('home.new-experiment.design.factor-count-new-exp-error.text');
    const factorValueErrorMsg = this.translate.instant('home.new-experiment.design.factor-value-new-exp-error.text');
    const levelCountErrorMsg = this.translate.instant('home.new-experiment.design.level-count-new-exp-error.text');
    const levelValueErrorMsg = this.translate.instant('home.new-experiment.design.level-value-new-exp-error.text');

    if (factorialExperimentDesignFormData.factors.length > 0) {
      factorialExperimentDesignFormData.factors.forEach((factor, index) => {
        if (!factor.name?.trim()) {
          this.factorCountError = factorValueErrorMsg;
        }
        if (factor.levels.length > 0) {
          factor.levels.forEach((level) => {
            if (!level.name?.trim()) {
              this.levelCountError = levelValueErrorMsg;
              this.expandedId = index;
            }
          });
        } else {
          this.levelCountError = levelCountErrorMsg;
          this.expandedId = this.expandedId || index + 1;
        }
      });
    } else {
      this.factorCountError = factorCountErrorMsg;
    }
    this.expandedId;
  }

  validateConditionCount() {
    this.conditionCountError = null;
    if (this.factorialConditions.length < 2) {
      this.conditionCountError = this.translate.instant(
        'home.new-experiment.design.condition-create-count-new-factorial-exp-error.text'
      );
    }
  }

  isFormValid() {
    return (
      !this.decisionPointErrors.length &&
      this.decisionPointCountError === null &&
      !this.factorPointErrors.length &&
      this.factorialExperimentDesignForm.valid &&
      this.factorCountError === null &&
      this.levelCountError === null &&
      this.conditionCountError === null &&
      !this.experimentDesignStepperService.checkConditionTableValidity()
    );
  }

  validateForm() {
    this.factorialExperimentDesignForm.updateValueAndValidity();
    this.validateDecisionPointCount(this.decisionPoints.value);
    this.validateFactorCount(this.factorialExperimentDesignForm.value);
    this.validateConditionCount();
  }

  // decision point table:
  handleDecisionPointTableEditClick(rowIndex: number, rowData: DecisionPointsTableRowData) {
    if (this.isDecisionPointTableRowValid()) {
      this.experimentDesignStepperService.setDecisionPointTableEditModeDetails(rowIndex, rowData);
      // why are we updating factors and not decision points?
      this.experimentDesignStepperService.updateFactorialDesignData(this.factorialExperimentDesignForm.value);
    }
  }

  resetPreviousDecisionPointRowDataOnEditCancel(previousRowData: DecisionPointsTableRowData, rowIndex: number): void {
    const decisionPointTableRow = this.decisionPoints.controls.at(rowIndex);
    const { SITE, TARGET, EXCLUDE_IF_REACHED, ORDER } = FACTORIAL_EXP_CONSTANTS.FORM_CONTROL_NAMES;

    if (decisionPointTableRow) {
      decisionPointTableRow.get(SITE).setValue(previousRowData.site, { emitEvent: false });
      decisionPointTableRow.get(TARGET).setValue(previousRowData.target, { emitEvent: false });
      decisionPointTableRow.get(EXCLUDE_IF_REACHED).setValue(previousRowData.excludeIfReached, { emitEvent: false });
      decisionPointTableRow.get(ORDER).setValue(previousRowData.order, { emitEvent: false });
    }
    this.experimentDesignStepperService.clearDecisionPointTableEditModeDetails();
  }

  handleDecisionPointTableClearOrRemoveRow(rowIndex: number): void {
    // grab previous data before dispatching reset to store
    const previousRowData = this.previousDecisionPointTableRowDataBehaviorSubject$.value;
    if (previousRowData) {
      this.resetPreviousDecisionPointRowDataOnEditCancel(previousRowData, rowIndex);
    } else {
      this.removeDecisionPoint(rowIndex);
    }
  }

  removeDecisionPointName(decisionPoint: ExperimentDecisionPoint) {
    delete decisionPoint.target;
    return decisionPoint;
  }

  // condition table:
  handleConditionsButtonClick() {
    this.experimentDesignStepperService.updateFactorialDesignData(this.factorialExperimentDesignForm.value);
    this.conditionTableDataUpToDate = true;
    this.factorialConditions = this.experimentDesignStepperService.createFactorialConditionRequestObject();
  }

  // level table
  getFactorialLevelsAt(factorIndex: number) {
    const levelsArray = this.factor?.at(factorIndex).get('levels') as UntypedFormArray;
    return levelsArray;
  }

  handleLevelTableEditClick(rowData: FactorialLevelTableRowData, levelRowIndex: number, factorIndex: number) {
    if (this.isLevelTableRowValid(levelRowIndex, factorIndex)) {
      this.experimentDesignStepperService.setFactorialFactorTableIndex(factorIndex);
      this.experimentDesignStepperService.setFactorialLevelTableEditModeDetails(levelRowIndex, rowData);
      this.experimentDesignStepperService.updateFactorialDesignData(this.factorialExperimentDesignForm.value);
    }
  }

  resetPreviousLevelRowDataOnEditCancel(
    previousRowData: FactorialLevelTableRowData,
    factorRowIndex: number,
    levelRowIndex: number
  ): void {
    const levelTableRow = this.getFactorialLevelsAt(factorRowIndex).controls.at(levelRowIndex);
    if (levelTableRow) {
      levelTableRow.get('name').setValue(previousRowData.name, { emitEvent: false });
      levelTableRow.get('payload').setValue(previousRowData.payload, { emitEvent: false });
    }
    this.experimentDesignStepperService.clearFactorialLevelTableEditModeDetails();
  }

  handleLevelTableClearOrRemoveRow(factorRowIndex: number, levelRowIndex: number) {
    // grab previous data before dispatching reset to store
    const previousRowData = this.previousLevelTableRowDataBehaviorSubject$.value;
    if (previousRowData) {
      this.resetPreviousLevelRowDataOnEditCancel(previousRowData, factorRowIndex, levelRowIndex);
    } else {
      this.removeLevel(factorRowIndex, levelRowIndex);
    }
    this.levelPointErrors = [];
  }

  // factor table
  getFactorialFactorsAt(factorIndex: number) {
    const factorsArray = this.factor?.at(factorIndex) as UntypedFormArray;
    return factorsArray;
  }

  handleFactorTableEditClick(rowData: FactorialFactorTableRowData, factorRowIndex: number) {
    if (this.isFactorTableRowValid(factorRowIndex)) {
      if (
        this.getFactorialLevelsAt(factorRowIndex).controls.length === 1 &&
        this.getFactorialLevelsAt(factorRowIndex).controls.at(0).value.name === ''
      ) {
        this.expandFactor(factorRowIndex);
        this.experimentDesignStepperService.setFactorialLevelTableEditModeDetails(
          this.getFactorialLevelsAt(factorRowIndex).controls.length - 1,
          null
        );
      }
      this.experimentDesignStepperService.setFactorialFactorTableEditModeDetails(factorRowIndex, rowData);
      this.experimentDesignStepperService.updateFactorialDesignData(this.factorialExperimentDesignForm.value);
    }
  }

  resetPreviousFactorRowDataOnEditCancel(previousRowData: FactorialFactorTableRowData, factorRowIndex: number): void {
    const factorTableRow = this.getFactorialFactorsAt(factorRowIndex);
    if (factorTableRow) {
      factorTableRow.get('name').setValue(previousRowData.name, { emitEvent: false });
      factorTableRow.get('description').setValue(previousRowData.description, { emitEvent: false });
    }
    this.experimentDesignStepperService.clearFactorialFactorTableEditModeDetails();
  }

  handleFactorTableClearOrRemoveRow(factorRowIndex: number) {
    // grab previous data before dispatching reset to store
    const previousRowData = this.previousFactorTableRowDataBehaviorSubject$.value;
    if (previousRowData) {
      this.resetPreviousFactorRowDataOnEditCancel(previousRowData, factorRowIndex);
    } else {
      this.removeFactor(factorRowIndex);
    }
    this.factorPointErrors = [];
  }

  emitEvent(eventType: NewExperimentDialogEvents) {
    switch (eventType) {
      case NewExperimentDialogEvents.CLOSE_DIALOG:
        if (
          this.factorialExperimentDesignForm.dirty ||
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
        this.handleConditionsButtonClick();
        if (this.factorialExperimentDesignForm.dirty) {
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
        this.handleConditionsButtonClick();
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

  saveData(eventType) {
    this.validateForm();

    if (!this.conditionTableDataUpToDate) {
      this.experimentDesignStepperService.updateFactorialDesignData(this.factorialExperimentDesignForm.value);
    }

    if (this.isFormValid()) {
      const factorialExperimentDesignFormData = this.factorialExperimentDesignForm.value;
      let order = 1;
      factorialExperimentDesignFormData.decisionPoints = factorialExperimentDesignFormData.decisionPoints.map(
        (decisionPoint, index) => {
          return this.experimentInfo
            ? { ...this.experimentInfo.partitions[index], ...decisionPoint, order: order++ }
            : decisionPoint.target
            ? { ...decisionPoint, order: order++ }
            : { ...this.removeDecisionPointName(decisionPoint), order: order++ };
        }
      );

      order = 1;
      const factorsDesignFormData = this.factorialExperimentDesignForm.value.factors;
      factorialExperimentDesignFormData.factors = factorsDesignFormData.map((factor, index) => {
        return this.experimentInfo
          ? { ...this.experimentInfo.factors[index], ...factor, order: order++ }
          : { ...factor, order: order++ };
      });
      this.factorialConditions = this.experimentDesignStepperService.createFactorialConditionRequestObject();
      const currentConditions =
        this.factorialConditions.length > 0 ? this.factorialConditions : this.experimentInfo?.conditions;
      const factorialConditionPayloads: ExperimentConditionPayloadRequestObject[] =
        this.experimentDesignStepperService.createFactorialConditionsConditionPayloadsRequestObject();

      this.emitExperimentDialogEvent.emit({
        type: eventType,
        formData: {
          conditions: currentConditions,
          partitions: factorialExperimentDesignFormData.decisionPoints,
          factors: factorialExperimentDesignFormData.factors,
          conditionPayloads: factorialConditionPayloads,
        },
        path: NewExperimentPaths.EXPERIMENT_DESIGN,
      });

      if (eventType == NewExperimentDialogEvents.SAVE_DATA) {
        this.experimentDesignStepperService.experimentStepperDataReset();
        this.isAnyRowRemoved = false;
        this.factorialExperimentDesignForm.markAsPristine();
      }
    }
  }

  // getters:
  get decisionPoints(): UntypedFormArray {
    return this.factorialExperimentDesignForm?.get(
      FACTORIAL_EXP_CONSTANTS.FORM_CONTROL_NAMES.DECISION_POINTS_ARRAY
    ) as UntypedFormArray;
  }

  get factor(): UntypedFormArray {
    return this.factorialExperimentDesignForm?.get('factors') as UntypedFormArray;
  }

  get level(): UntypedFormArray {
    return this.factorialExperimentDesignForm?.get('factors').get('levels') as UntypedFormArray;
  }

  get NewExperimentDialogEvents() {
    return NewExperimentDialogEvents;
  }

  get ExperimentState() {
    return EXPERIMENT_STATE;
  }

  get FACTORIAL_EXP_CONSTANTS() {
    return FACTORIAL_EXP_CONSTANTS;
  }

  ngOnDestroy() {
    this.subscriptionHandler.unsubscribe();
    this.experimentDesignStepperService.clearDecisionPointTableEditModeDetails();
    this.experimentDesignStepperService.clearFactorialFactorTableEditModeDetails();
    this.experimentDesignStepperService.clearFactorialLevelTableEditModeDetails();
  }
}
