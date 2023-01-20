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
import { FormBuilder, FormGroup, Validators, FormArray, AbstractControl } from '@angular/forms';
import { BehaviorSubject, combineLatest, Observable, Subscription } from 'rxjs';
import {
  NewExperimentDialogEvents,
  NewExperimentDialogData,
  NewExperimentPaths,
  ExperimentVM,
  ExperimentCondition,
  ExperimentPartition,
  IContextMetaData,
  EXPERIMENT_STATE,
} from '../../../../../core/experiments/store/experiments.model';
import { ExperimentFormValidators } from '../../validators/experiment-form.validators';
import { ExperimentService } from '../../../../../core/experiments/experiments.service';
import { TranslateService } from '@ngx-translate/core';
import { filter, map, pairwise, startWith } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';
import { DialogService } from '../../../../../shared/services/dialog.service';
import { ExperimentDesignStepperService } from '../../../../../core/experiment-design-stepper/experiment-design-stepper.service';
import {
  DecisionPointsTableRowData,
  ConditionsTableRowData,
  ExperimentAliasTableRow,
  ExperimentConditionAliasRequestObject,
} from '../../../../../core/experiment-design-stepper/store/experiment-design-stepper.model';

@Component({
  selector: 'home-experiment-design',
  templateUrl: './experiment-design.component.html',
  styleUrls: ['./experiment-design.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperimentDesignComponent implements OnInit, OnChanges, OnDestroy {
  @Input() experimentInfo: ExperimentVM;
  @Input() currentContext: string;
  @Input() isContextChanged: boolean;
  @Input() animationCompleteStepperIndex: number;
  @Output() emitExperimentDialogEvent = new EventEmitter<NewExperimentDialogData>();

  @ViewChild('stepContainer', { read: ElementRef }) stepContainer: ElementRef;
  @ViewChild('conditionTable', { read: ElementRef }) conditionTable: ElementRef;
  @ViewChild('partitionTable', { read: ElementRef }) partitionTable: ElementRef;
  @ViewChild('conditionCode') conditionCode: ElementRef;

  subscriptionHandler: Subscription;

  experimentDesignForm: FormGroup;
  conditionDataSource = new BehaviorSubject<AbstractControl[]>([]);
  partitionDataSource = new BehaviorSubject<AbstractControl[]>([]);
  allPartitions = [];

  // Condition Errors
  conditionCountError: string;

  // Partition Errors
  partitionPointErrors = [];
  partitionErrorMessages = [];
  partitionCountError: string;

  previousAssignmentWeightValues = [];

  conditionDisplayedColumns = ['conditionCode', 'assignmentWeight', 'description', 'actions'];
  partitionDisplayedColumns = ['site', 'target', 'excludeIfReached', 'actions'];

  // Used for condition code, experiment point and ids auto complete dropdown
  filteredConditionCodes$: Observable<string[]>[] = [];
  filteredExpPoints$: Observable<string[]>[] = [];
  filteredExpIds$: Observable<string[]>[] = [];
  contextMetaData: IContextMetaData = {
    contextMetadata: {},
  };
  expPointAndIdErrors: string[] = [];
  conditionCodeErrors: string[] = [];
  equalWeightFlag = true;
  isExperimentEditable = true;
  isFormLockedForEdit$ = this.experimentDesignStepperService.isFormLockedForEdit$;

  // Alias Table details
  designData$ = new BehaviorSubject<[ExperimentPartition[], ExperimentCondition[]]>([[], []]);
  aliasTableData: ExperimentAliasTableRow[] = [];
  isAliasTableEditMode$ = this.experimentDesignStepperService.isAliasTableEditMode$;

  // Decision Point table store references
  previousDecisionPointTableRowDataBehaviorSubject$ = new BehaviorSubject<DecisionPointsTableRowData>(null);
  isDecisionPointsTableEditMode$ = this.experimentDesignStepperService.isDecisionPointsTableEditMode$;
  decisionPointsTableEditIndex$ = this.experimentDesignStepperService.decisionPointsTableEditIndex$;

  // Condition table store references
  previousConditionTableRowDataBehaviorSubject$ = new BehaviorSubject<ConditionsTableRowData>(null);
  isConditionsTableEditMode$ = this.experimentDesignStepperService.isConditionsTableEditMode$;
  conditionsTableEditIndex$ = this.experimentDesignStepperService.conditionsTableEditIndex$;

  constructor(
    private _formBuilder: FormBuilder,
    private experimentService: ExperimentService,
    private translate: TranslateService,
    private dialogService: DialogService,
    private experimentDesignStepperService: ExperimentDesignStepperService
  ) {
    this.subscriptionHandler = this.translate
      .get([
        'home.new-experiment.design.assignment-partition-error-1.text',
        'home.new-experiment.design.assignment-partition-error-2.text',
        'home.new-experiment.design.assignment-partition-error-3.text',
        'home.new-experiment.design.assignment-partition-error-4.text',
      ])
      .subscribe((translatedMessage) => {
        this.partitionErrorMessages = [
          translatedMessage['home.new-experiment.design.assignment-partition-error-1.text'],
          translatedMessage['home.new-experiment.design.assignment-partition-error-2.text'],
          translatedMessage['home.new-experiment.design.assignment-partition-error-3.text'],
          translatedMessage['home.new-experiment.design.assignment-partition-error-4.text'],
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

    if (this.isContextChanged) {
      this.isContextChanged = false;
      this.partition?.clear();
      this.condition?.clear();
      this.partitionDataSource.next(this.partition?.controls);
      this.conditionDataSource.next(this.condition?.controls);
    }

    this.applyEqualWeight();
  }

  ngOnInit() {
    this.subscriptionHandler = this.experimentService.contextMetaData$.subscribe((contextMetaData) => {
      this.contextMetaData = contextMetaData;
    });
    this.subscriptionHandler = this.experimentService.allPartitions$
      .pipe(filter((partitions) => !!partitions))
      .subscribe((partitions: any) => {
        this.allPartitions = partitions.map((partition) =>
          partition.target ? partition.site + partition.target : partition.site
        );
      });
    this.experimentDesignForm = this._formBuilder.group({
      conditions: this._formBuilder.array([this.addConditions()]),
      partitions: this._formBuilder.array([this.addPartitions()]),
    });
    this.createDesignDataSubject();
    this.experimentDesignStepperService.decisionPointsEditModePreviousRowData$.subscribe(
      this.previousDecisionPointTableRowDataBehaviorSubject$
    );
    this.experimentDesignStepperService.conditionsEditModePreviousRowData$.subscribe(
      this.previousConditionTableRowDataBehaviorSubject$
    );

    // Remove previously added group of conditions and partitions
    this.condition?.removeAt(0);
    this.partition?.removeAt(0);

    // populate values in form to update experiment if experiment data is available
    if (this.experimentInfo) {
      this.equalWeightFlag = this.experimentInfo.conditions.every(
        (condition) => condition.assignmentWeight === this.experimentInfo.conditions[0].assignmentWeight
      );
      this.experimentInfo.conditions.forEach((condition) => {
        this.condition.push(
          this.addConditions(
            condition.conditionCode,
            condition.assignmentWeight,
            condition.description,
            condition.order
          )
        );
      });
      this.experimentInfo.partitions.forEach((partition) => {
        this.partition.push(
          this.addPartitions(
            partition.site,
            partition.target,
            partition.description,
            partition.order,
            partition.excludeIfReached
          )
        );
      });

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
    const conditionFormControl = this.experimentDesignForm.get('conditions') as FormArray;
    conditionFormControl.controls.forEach((_, index) => {
      this.manageConditionCodeControl(index);
    });

    // Bind predefined values of experiment points and ids from backend
    const partitionFormControl = this.experimentDesignForm.get('partitions') as FormArray;
    partitionFormControl.controls.forEach((_, index) => {
      this.manageExpPointAndIdControl(index);
    });
  }

  manageConditionCodeControl(index: number) {
    const conditionFormControl = this.experimentDesignForm.get('conditions') as FormArray;
    this.filteredConditionCodes$[index] = conditionFormControl
      .at(index)
      .get('conditionCode')
      .valueChanges.pipe(
        startWith<string>(''),
        map((conditionCode) => this.filterConditionCodes(conditionCode))
      );
    this.applyEqualWeight();
  }

  manageExpPointAndIdControl(index: number) {
    const partitionFormControl = this.experimentDesignForm.get('partitions') as FormArray;
    this.filteredExpPoints$[index] = partitionFormControl
      .at(index)
      .get('site')
      .valueChanges.pipe(
        startWith<string>(''),
        map((site) => this.filterExpPointsAndIds(site, 'expPoints'))
      );
    this.filteredExpIds$[index] = partitionFormControl
      .at(index)
      .get('target')
      .valueChanges.pipe(
        startWith<string>(''),
        map((target) => this.filterExpPointsAndIds(target, 'expIds'))
      );
  }

  createDesignDataSubject(): void {
    this.subscriptionHandler = combineLatest([
      this.experimentDesignForm.get('partitions').valueChanges,
      this.experimentDesignForm.get('conditions').valueChanges,
    ])
      .pipe(
        pairwise(),
        filter((designData) => this.experimentDesignStepperService.filterForUnchangedDesignData(designData)),
        map(([_, current]) => current),
        filter((designData) => this.experimentDesignStepperService.validDesignDataFilter(designData))
      )
      .subscribe(this.designData$);
  }

  handleAliasTableDataChange(aliasTableData: ExperimentAliasTableRow[]) {
    this.aliasTableData = [...aliasTableData];
  }

  handleBackBtnClick() {
    return this.experimentDesignForm.dirty && this.experimentDesignStepperService.experimentStepperDataChanged();
  }

  handleDecisionPointTableEditClick(rowIndex: number, rowData: DecisionPointsTableRowData) {
    if (this.isDecisionPointTableRowValid()) {
      this.experimentDesignStepperService.setDecisionPointTableEditModeDetails(rowIndex, rowData);
    }
  }

  handleConditionTableEditClick(rowIndex: number, rowData: ConditionsTableRowData) {
    if (this.isConditionTableRowValid()) {
      this.experimentDesignStepperService.setConditionTableEditModeDetails(rowIndex, rowData);
    }
  }

  handleDecisionPointTableClearOrRemoveRow(rowIndex: number): void {
    // grab previous data before dispatching reset to store
    const previousRowData = this.previousDecisionPointTableRowDataBehaviorSubject$.value;

    if (previousRowData) {
      this.resetPreviousDecisionPointRowDataOnEditCancel(previousRowData, rowIndex);
    } else {
      this.removeConditionOrPartition('partition', rowIndex);
    }
  }

  handleConditionTableClearOrRemoveRow(rowIndex: number): void {
    // grab previous data before dispatching reset to store
    const previousRowData = this.previousConditionTableRowDataBehaviorSubject$.value;

    if (previousRowData) {
      this.resetPreviousConditionRowDataOnEditCancel(previousRowData, rowIndex);
    } else {
      this.removeConditionOrPartition('condition', rowIndex);
    }
  }

  resetPreviousDecisionPointRowDataOnEditCancel(previousRowData: DecisionPointsTableRowData, rowIndex: number): void {
    const decisionPointTableRow = this.partition.controls.at(rowIndex);

    if (decisionPointTableRow) {
      decisionPointTableRow.get('site').setValue(previousRowData.site, { emitEvent: false });
      decisionPointTableRow.get('target').setValue(previousRowData.target, { emitEvent: false });
      decisionPointTableRow.get('excludeIfReached').setValue(previousRowData.excludeIfReached, { emitEvent: false });
      decisionPointTableRow.get('order').setValue(previousRowData.order, { emitEvent: false });
    }

    this.experimentDesignStepperService.clearDecisionPointTableEditModeDetails();
  }

  resetPreviousConditionRowDataOnEditCancel(previousRowData: ConditionsTableRowData, rowIndex: number): void {
    const conditionTableRow = this.condition.controls.at(rowIndex);

    if (conditionTableRow) {
      conditionTableRow.get('conditionCode').setValue(previousRowData.conditionCode, { emitEvent: false });
      conditionTableRow.get('assignmentWeight').setValue(previousRowData.assignmentWeight, { emitEvent: false });
      conditionTableRow.get('description').setValue(previousRowData.description, { emitEvent: false });
      conditionTableRow.get('order').setValue(previousRowData.order, { emitEvent: false });
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

  private filterExpPointsAndIds(value: string, key: string): string[] {
    const filterValue = value ? value.toLocaleLowerCase() : '';

    if (!this.contextMetaData) {
      return [];
    }

    if (key === 'expPoints' && this.currentContext) {
      const currentContextExpPoints = this.contextMetaData.contextMetadata[this.currentContext].EXP_POINTS || [];
      return currentContextExpPoints.filter((option) => option.toLowerCase().startsWith(filterValue));
    } else if (key === 'expIds' && this.currentContext) {
      const currentContextExpIds = this.contextMetaData.contextMetadata[this.currentContext].EXP_IDS || [];
      return currentContextExpIds.filter((option) => option.toLowerCase().startsWith(filterValue));
    }
    return [];
  }

  addConditions(conditionCode = null, assignmentWeight = null, description = null, order = null) {
    return this._formBuilder.group({
      conditionCode: [conditionCode, Validators.required],
      assignmentWeight: [assignmentWeight, Validators.required],
      description: [description],
      order: [order],
    });
  }

  addPartitions(site = null, target = null, description = '', order = null, excludeIfReached = false) {
    return this._formBuilder.group({
      site: [site, Validators.required],
      target: [target, Validators.required],
      description: [description],
      order: [order],
      excludeIfReached: [excludeIfReached],
    });
  }

  addConditionOrPartition(type: string) {
    const isPartition = type === 'partition';
    const form = isPartition ? this.addPartitions() : this.addConditions();
    this[type].push(form);
    const scrollTableType = isPartition ? 'partitionTable' : 'conditionTable';
    this.updateView(scrollTableType);
    if (isPartition) {
      const partitionFormControl = this.experimentDesignForm.get('partitions') as FormArray;
      this.manageExpPointAndIdControl(partitionFormControl.controls.length - 1);
      this.experimentDesignStepperService.setDecisionPointTableEditModeDetails(
        partitionFormControl.controls.length - 1,
        null
      );
    } else {
      const conditionFormControl = this.experimentDesignForm.get('conditions') as FormArray;
      this.manageConditionCodeControl(conditionFormControl.controls.length - 1);
      this.experimentDesignStepperService.setConditionTableEditModeDetails(
        conditionFormControl.controls.length - 1,
        null
      );
    }
  }

  removeConditionOrPartition(type: string, groupIndex: number) {
    const isPartition = type === 'partition';
    this[type].removeAt(groupIndex);
    if (this.experimentInfo) {
      if (isPartition) {
        const deletedPartition = this.experimentInfo.partitions.find((partition) => partition.order === groupIndex + 1);
        if (deletedPartition) {
          this.experimentInfo.partitions = this.experimentInfo.partitions.filter(
            (partition) => partition == deletedPartition
          );
          if (this.experimentInfo.revertTo === deletedPartition.id) {
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
    if (!isPartition) {
      this.previousAssignmentWeightValues.splice(groupIndex, 1);
      this.applyEqualWeight();
    }
    this.experimentDesignStepperService.experimentStepperDataChanged();
    this.experimentDesignStepperService.clearDecisionPointTableEditModeDetails();
    this.experimentDesignStepperService.clearConditionTableEditModeDetails();
    this.updateView();
  }

  updateView(type?: string) {
    this.conditionDataSource.next(this.condition.controls);
    this.partitionDataSource.next(this.partition.controls);
    if (type) {
      this[type].nativeElement.scroll({
        top: this[type].nativeElement.scrollHeight - 91,
        behavior: 'smooth',
      });
    }
  }

  validatePartitionNames(partitions: any) {
    this.partitionPointErrors = [];
    // Used to differentiate errors
    const duplicatePartitions = [];

    // Used for updating existing experiment
    if (this.experimentInfo) {
      this.experimentInfo.partitions.forEach((partition) => {
        const partitionInfo = partition.target ? partition.site + partition.target : partition.site;
        const partitionPointIndex = this.allPartitions.indexOf(partitionInfo);
        if (partitionPointIndex !== -1) {
          this.allPartitions.splice(partitionPointIndex, 1);
        }
      });
    }

    partitions.forEach((partition, index) => {
      if (
        partitions.find(
          (value, partitionIndex) =>
            value.site === partition.site &&
            (value.target || '') === (partition.target || '') && // To match null and empty string, add '' as default value. target as optional and hence it's value can be null.
            partitionIndex !== index &&
            !duplicatePartitions.includes(
              partition.target ? partition.site + ' and ' + partition.target : partition.site
            )
        )
      ) {
        duplicatePartitions.push(partition.target ? partition.site + ' and ' + partition.target : partition.site);
      }
    });

    // Partition Points error messages
    if (duplicatePartitions.length === 1) {
      this.partitionPointErrors.push(duplicatePartitions[0] + this.partitionErrorMessages[2]);
    } else if (duplicatePartitions.length > 1) {
      this.partitionPointErrors.push(duplicatePartitions.join(', ') + this.partitionErrorMessages[3]);
    }
  }

  isDecisionPointTableRowValid(): boolean {
    const partitions = this.experimentDesignForm.get('partitions').value;

    this.validatePartitionNames(partitions);
    this.validatePartitionCount(partitions);

    return !this.partitionPointErrors.length && !this.partitionCountError && !this.expPointAndIdErrors.length;
  }

  isConditionTableRowValid(): boolean {
    const conditions = this.experimentDesignForm.get('conditions').value;

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

  validatePartitionCount(partitions: ExperimentPartition[]) {
    const partitionCountErrorMsg = this.translate.instant(
      'home.new-experiment.design.partition-count-new-exp-error.text'
    );
    if (
      partitions.length === 0 ||
      !partitions.every(
        (partition) =>
          typeof partition.site === 'string' &&
          partition.site.trim() &&
          typeof partition.target === 'string' &&
          partition.target.trim()
      )
    ) {
      this.partitionCountError = partitionCountErrorMsg;
    } else {
      this.partitionCountError = null;
    }
  }

  removePartitionName(partition) {
    delete partition.target;
    return partition;
  }

  isFormValid() {
    return (
      !this.partitionPointErrors.length &&
      !this.expPointAndIdErrors.length &&
      this.experimentDesignForm.valid &&
      !this.conditionCodeErrors.length &&
      this.partitionCountError === null &&
      this.conditionCountError === null
    );
  }

  validateForm() {
    this.experimentDesignForm.setValidators(ExperimentFormValidators.validateExperimentDesignForm);
    this.experimentDesignForm.updateValueAndValidity();
    this.validateConditionCodes(this.experimentDesignForm.get('conditions').value);
    this.validateConditionCount((this.experimentDesignForm.get('conditions') as FormArray).getRawValue());
    this.validatePartitionCount(this.experimentDesignForm.get('partitions').value);
    this.validateHasConditionCodeDefault(this.experimentDesignForm.get('conditions').value);
    this.validateHasAssignmentWeightsNegative((this.experimentDesignForm.get('conditions') as FormArray).getRawValue());
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
        this.experimentDesignStepperService.experimentStepperDataReset();
        this.experimentDesignForm.markAsPristine();
        break;
    }
  }

  saveData(eventType) {
    this.validateForm();

    // TODO: Uncomment to validate partitions with predefined site and target
    // this.validatePartitions()
    // enabling Assignment weight for form to validate
    if (
      !this.partitionPointErrors.length &&
      !this.expPointAndIdErrors.length &&
      !this.conditionCodeErrors.length &&
      !this.partitionCountError
    ) {
      (this.experimentDesignForm.get('conditions') as FormArray).controls.forEach((control) => {
        control.get('assignmentWeight').enable({ emitEvent: false });
      });
    }
    if (this.isFormValid()) {
      const experimentDesignFormData = this.experimentDesignForm.value;
      let order = 1;
      experimentDesignFormData.conditions = experimentDesignFormData.conditions.map((condition, index) => {
        if (isNaN(condition.assignmentWeight)) {
          condition.assignmentWeight = Number(condition.assignmentWeight.slice(0, -1));
        }
        return this.experimentInfo
          ? { ...this.experimentInfo.conditions[index], ...condition, order: order++ }
          : { id: uuidv4(), ...condition, name: '', order: order++ };
      });
      order = 1;
      experimentDesignFormData.partitions = experimentDesignFormData.partitions.map((partition, index) => {
        return this.experimentInfo
          ? { ...this.experimentInfo.partitions[index], ...partition, order: order++ }
          : partition.target
          ? { ...partition, order: order++, id: uuidv4() }
          : { ...this.removePartitionName(partition), order: order++ };
      });
      experimentDesignFormData.conditionAliases = this.createExperimentConditionAliasRequestObject(
        this.aliasTableData,
        experimentDesignFormData.conditions,
        experimentDesignFormData.partitions
      );
      this.emitExperimentDialogEvent.emit({
        type: eventType,
        formData: experimentDesignFormData,
        path: NewExperimentPaths.EXPERIMENT_DESIGN,
      });
      // scroll back to the conditions table
      this.scrollToConditionsTable();
    }
  }

  createExperimentConditionAliasRequestObject(
    aliases: ExperimentAliasTableRow[],
    conditions: ExperimentCondition[],
    decisionPoints: ExperimentPartition[]
  ): ExperimentConditionAliasRequestObject[] {
    const conditionAliases: ExperimentConditionAliasRequestObject[] = [];

    aliases.forEach((aliasRowData: ExperimentAliasTableRow) => {
      // if no custom alias, return early, do not add to array to send to backend
      if (aliasRowData.alias === aliasRowData.condition) {
        return;
      }

      const parentCondition = conditions.find((condition) => condition.conditionCode === aliasRowData.condition);

      const decisionPoint = decisionPoints.find(
        (decisionPoint) => decisionPoint.target === aliasRowData.target && decisionPoint.site === aliasRowData.site
      );

      // need some error-handling in UI to prevent creation if aliases can't be created...
      if (!parentCondition || !decisionPoint) {
        console.log('cannot create alias data, cannot find id of parent condition/decisionpoint');
        return;
      }

      conditionAliases.push({
        id: aliasRowData.id || uuidv4(),
        aliasName: aliasRowData.alias,
        parentCondition: parentCondition.id,
        decisionPoint: decisionPoint.id,
      });
    });

    return conditionAliases;
  }

  applyEqualWeight() {
    if (this.experimentDesignForm) {
      const conditions = this.experimentDesignForm.get('conditions') as FormArray;
      if (this.equalWeightFlag) {
        const len = conditions.controls.length;
        this.previousAssignmentWeightValues = [];
        conditions.controls.forEach((control) => {
          control.get('assignmentWeight').setValue(parseFloat((100.0 / len).toFixed(1)).toString());
          this.previousAssignmentWeightValues.push(control.get('assignmentWeight').value);
          control.get('assignmentWeight').disable();
        });
      } else {
        conditions.controls.forEach((control, index) => {
          control
            .get('assignmentWeight')
            .setValue(
              control.value.assignmentWeight
                ? control.value.assignmentWeight
                : this.previousAssignmentWeightValues[index]
            );
          if (this.isExperimentEditable) {
            control.get('assignmentWeight').enable();
          }
        });
      }
    }
  }

  changeEqualWeightFlag(event) {
    event.checked ? (this.equalWeightFlag = true) : (this.equalWeightFlag = false);
    this.applyEqualWeight();
  }

  scrollToAliasesTable(): void {
    this.stepContainer.nativeElement.scroll({
      top: this.stepContainer.nativeElement.scrollHeight / 2,
      behavior: 'smooth',
      duration: 500,
      easing: 'easeOutCubic',
    });
  }

  scrollToConditionsTable(): void {
    this.stepContainer.nativeElement.scroll({
      top: 0,
      behavior: 'smooth',
      duration: 500,
      easing: 'easeOutCubic',
    });
  }

  get condition(): FormArray {
    return this.experimentDesignForm?.get('conditions') as FormArray;
  }

  get partition(): FormArray {
    return this.experimentDesignForm?.get('partitions') as FormArray;
  }

  get NewExperimentDialogEvents() {
    return NewExperimentDialogEvents;
  }

  get ExperimentState() {
    return EXPERIMENT_STATE;
  }

  ngOnDestroy() {
    this.subscriptionHandler.unsubscribe();
    this.experimentDesignStepperService.clearDecisionPointTableEditModeDetails();
    this.experimentDesignStepperService.clearConditionTableEditModeDetails();
  }
}
