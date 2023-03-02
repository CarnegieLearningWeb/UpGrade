import { Component, OnInit, ChangeDetectionStrategy, OnDestroy, EventEmitter, Output, Input } from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { BehaviorSubject, filter, Subscription } from 'rxjs';
import { ExperimentDesignStepperService } from '../../../../../../core/experiment-design-stepper/experiment-design-stepper.service';
import {
  ExperimentFactorialDesignData,
  FactorialConditionTableRowData,
} from '../../../../../../core/experiment-design-stepper/store/experiment-design-stepper.model';
import { TranslateService } from '@ngx-translate/core';
import { ExperimentVM } from '../../../../../../core/experiments/store/experiments.model';

@Component({
  selector: 'app-conditions-table',
  templateUrl: './conditions-table.component.html',
  styleUrls: ['./conditions-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConditionsTableComponent implements OnInit, OnDestroy {
  @Output() hide = new EventEmitter<boolean>();
  @Input() experimentInfo: ExperimentVM;
  @Input() isAnyRowRemoved: boolean;
  @Input() isExperimentEditable: boolean;

  subscriptions: Subscription;
  factorialConditionTableForm: FormGroup;
  tableData$ = new BehaviorSubject<FactorialConditionTableRowData[]>([]);
  previousRowDataBehaviorSubject$ = new BehaviorSubject<FactorialConditionTableRowData>(null);

  factorialDesignData$ = this.experimentDesignStepperService.factorialDesignData$;
  tableEditIndex$ = this.experimentDesignStepperService.factorialConditionsTableEditIndex$;
  isFormLockedForEdit$ = this.experimentDesignStepperService.isFormLockedForEdit$;

  columnHeaders = ['factorOne', 'factorTwo', 'alias', 'weight', 'include', 'actions'];
  factorHeaders = ['factorOne', 'factorTwo'];
  equalWeightFlag = true;
  formInitialized = false;
  useEllipsis = false;

  // Condition Errors
  conditionweightSumError: string = null;
  conditionnegativeweightError: string = null;

  constructor(
    private experimentDesignStepperService: ExperimentDesignStepperService,
    private _formBuilder: FormBuilder,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.subscriptions = this.experimentDesignStepperService.factorialConditionsEditModePreviousRowData$.subscribe(
      this.previousRowDataBehaviorSubject$
    );
    this.subscriptions = this.experimentDesignStepperService.factorialConditionTableData$.subscribe(this.tableData$);
    this.createForm();
    this.registerDesignDataChanges();

    this.factorialConditionTableForm.get('factorialConditions').valueChanges.subscribe((newValues) => {
      this.validateWeightSumEqualTo100(newValues);
      this.validateWeightsNotNegative(newValues);
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.resetEdit();
  }

  createForm() {
    this.factorialConditionTableForm = this._formBuilder.group({
      factorialConditions: this._formBuilder.array([]),
    });
  }

  createFormControls(tableData: FactorialConditionTableRowData[]) {
    this.getFactorialConditions().clear();

    tableData.forEach((tableDataRow) => {
      const formControls = this._formBuilder.group({
        levels: [tableDataRow.levels],
        alias: [tableDataRow.alias],
        weight: [this.experimentDesignStepperService.formatDisplayWeight(tableDataRow.weight)],
        include: [tableDataRow.include],
      });

      this.getFactorialConditions().push(formControls);
    });
  }

  registerDesignDataChanges() {
    this.subscriptions = this.factorialDesignData$
      .pipe(
        filter((designData) => {
          return designData && designData?.factors.length === 2;
        })
      )
      .subscribe((designData) => {
        this.handleDesignDataChanges(designData);
      });
  }

  handleDesignDataChanges(designData: ExperimentFactorialDesignData) {
    if (this.experimentInfo?.partitions.length && !this.formInitialized && !this.isAnyRowRemoved) {
      this.handleInitializeExistingTableData();
    } else if (!this.experimentInfo && this.formInitialized && !this.isAnyRowRemoved) {
      this.handleInitializeNewNewTableData(designData);
    } else {
      // if new exp and form initialized and you move back and forth
      // if edit exp and form already initialized
      this.handleInitializeNewNewTableData(designData); // <---- be careful doing this! if you see bugs, it may be because this is not the intended place for this function
      // this.handleUpdateDesignDataTableChanges(designData);
    }
    this.updateFactorHeaders(designData);
  }

  handleInitializeExistingTableData() {
    this.equalWeightFlag = this.experimentInfo.conditions.every(
      (condition) => condition.assignmentWeight === this.experimentInfo.conditions[0].assignmentWeight
    );

    const newTableData = this.experimentDesignStepperService.mergeExistingConditionsTableData(this.experimentInfo);
    this.initializeForm(newTableData);
  }

  handleInitializeNewNewTableData(designData: ExperimentFactorialDesignData) {
    this.equalWeightFlag = true;
    const newTableData = this.experimentDesignStepperService.createNewFactorialConditionTableData(designData);
    this.initializeForm(newTableData);
  }

  // handleUpdateDesignDataTableChanges(designData: ExperimentFactorialDesignData) {
  //   // TODO: intelligently handle updates to design data without triggering complete table re-creation
  // }

  updateFactorHeaders(designData: ExperimentFactorialDesignData) {
    this.factorHeaders = designData.factors.map((factor) => {
      return factor.factor;
    });
  }

  initializeForm(tableData: FactorialConditionTableRowData[]) {
    this.createFormControls(tableData);
    const newTableData = this.applyEqualWeights(tableData);
    this.experimentDesignStepperService.updateFactorialTableData(newTableData);
    this.formInitialized = true;
  }

  resetEdit(): void {
    this.experimentDesignStepperService.clearFactorialConditionTableEditModeDetails();
  }

  applyEqualWeights(partiallyUpdatedTableData?: FactorialConditionTableRowData[]): FactorialConditionTableRowData[] {
    const tableData = partiallyUpdatedTableData || this.getCurrentTableData();

    if (this.equalWeightFlag) {
      const includedConditionsCount = this.getIncludedConditionCount(tableData);
      const equalWeight = 100 / includedConditionsCount;
      const newTableData = this.setNewWeights(tableData, equalWeight);

      return newTableData;
    } else {
      return tableData;
    }
  }

  setNewWeights(tableData: FactorialConditionTableRowData[], equalWeight: number): FactorialConditionTableRowData[] {
    const newTableData = this.getFactorialConditions().controls.map((control, index) => {
      const thisRowWeight: number = control.get('include').value ? equalWeight : 0;
      control.get('weight').setValue(thisRowWeight.toFixed(1));
      return { ...tableData[index], weight: this.experimentDesignStepperService.formatDisplayWeight(thisRowWeight) };
    });

    return newTableData;
  }

  validateWeightSumEqualTo100(factorialConditions: FactorialConditionTableRowData[]) {
    const weightSumNot100ErrorMsg = this.translate.instant("Weights' sum must be 100");

    // handling sum of decimal values for assignment weights:
    let sumOfAssignmentWeights = 0.0;
    factorialConditions.forEach((condition) => (sumOfAssignmentWeights += parseFloat(condition.weight)));
    // checking if sum is not equal to 100
    if (Math.round(sumOfAssignmentWeights) !== 100.0) {
      this.conditionweightSumError = weightSumNot100ErrorMsg;
    } else {
      this.conditionweightSumError = null;
    }
  }

  validateWeightsNotNegative(factorialConditions: FactorialConditionTableRowData[]) {
    this.conditionnegativeweightError = null;
    const negativeweightErrorMsg = this.translate.instant('home.new-experiment.design.assignment-weight-negative.text');
    // handling sum of decimal values for assignment weights:
    factorialConditions.forEach((condition) =>
      parseFloat(condition.weight) < 0 ? (this.conditionnegativeweightError = negativeweightErrorMsg) : null
    );
  }

  getIncludedConditionCount(tableData: FactorialConditionTableRowData[]): number {
    return tableData.reduce((count, row) => {
      return row.include ? (count += 1) : count;
    }, 0);
  }

  /* -- action button handlers -- */

  handleEqualWeightToggle() {
    this.equalWeightFlag = !this.equalWeightFlag;

    if (this.equalWeightFlag) {
      const newTableData = this.applyEqualWeights();
      this.experimentDesignStepperService.updateFactorialTableData(newTableData);
    }
  }

  handleHideClick() {
    this.hide.emit(true);
  }

  handleRowEditClick(rowData: FactorialConditionTableRowData, rowIndex: number) {
    this.experimentDesignStepperService.setFactorialConditionTableEditModeDetails(rowIndex, rowData);
  }

  handleRowEditDoneClick(rowIndex: number) {
    const tableData = this.getCurrentTableData();
    const formRow = this.getFactorialConditionsAt(rowIndex);

    const alias = formRow.get('alias').value;
    const weight = formRow.get('weight').value;
    const include = formRow.get('include').value;

    tableData[rowIndex] = { ...tableData[rowIndex], alias, weight, include };
    const newTableData = this.applyEqualWeights(tableData);

    this.experimentDesignStepperService.updateFactorialTableData(newTableData);
    this.experimentDesignStepperService.clearFactorialConditionTableEditModeDetails();
  }

  handleClear(rowIndex: number) {
    const previousRowData = this.previousRowDataBehaviorSubject$.value;
    const formRow = this.getFactorialConditionsAt(rowIndex);

    formRow.get('alias').setValue(previousRowData.alias, { emitEvent: false });
    formRow.get('weight').setValue(previousRowData.weight, { emitEvent: false });
    formRow.get('include').setValue(previousRowData.include, { emitEvent: false });

    this.resetEdit();
  }

  /* -- convenience accessors --*/

  getFactorialConditions(): FormArray {
    return this.factorialConditionTableForm.get('factorialConditions') as FormArray;
  }

  getFactorialConditionsAt(rowIndex: number) {
    return this.getFactorialConditions().at(rowIndex);
  }

  getCurrentTableData(): FactorialConditionTableRowData[] {
    return [...this.tableData$.value];
  }
}
