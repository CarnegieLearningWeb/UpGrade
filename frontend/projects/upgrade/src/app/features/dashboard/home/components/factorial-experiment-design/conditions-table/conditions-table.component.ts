import { Component, OnInit, ChangeDetectionStrategy, OnDestroy, EventEmitter, Output } from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { BehaviorSubject, filter, Subscription } from 'rxjs';
import { ExperimentDesignStepperService } from '../../../../../../core/experiment-design-stepper/experiment-design-stepper.service';
import { FactorialConditionTableRowData } from '../../../../../../core/experiment-design-stepper/store/experiment-design-stepper.model';

@Component({
  selector: 'app-conditions-table',
  templateUrl: './conditions-table.component.html',
  styleUrls: ['./conditions-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConditionsTableComponent implements OnInit, OnDestroy {
  @Output() hide = new EventEmitter<boolean>();

  subscriptions: Subscription;
  factorialConditionTableForm: FormGroup;
  factorialDesignData$ = this.experimentDesignStepperService.factorialDesignData$;
  tableData$ = new BehaviorSubject<FactorialConditionTableRowData[]>([]);
  tableEditIndex$ = this.experimentDesignStepperService.factorialConditionsTableEditIndex$;
  isFormLockedForEdit$ = this.experimentDesignStepperService.isFormLockedForEdit$;
  previousRowDataBehaviorSubject$ = new BehaviorSubject<FactorialConditionTableRowData>(null);
  columnHeaders = ['levelNameOne', 'levelNameTwo', 'alias', 'weight', 'include', 'actions'];
  equalWeightFlag = true;
  formInitialized = false;
  useEllipsis = false;
  // showForm = false;
  factorOneHeader = 'factor1';
  factorTwoHeader = 'factor2';

  constructor(
    private experimentDesignStepperService: ExperimentDesignStepperService,
    private _formBuilder: FormBuilder
  ) {}

  ngOnInit(): void {
    this.subscriptions = this.experimentDesignStepperService.factorialConditionsEditModePreviousRowData$.subscribe(
      this.previousRowDataBehaviorSubject$
    );
    this.subscriptions = this.experimentDesignStepperService.factorialConditionTableData$.subscribe(this.tableData$);
    this.createForm();
  }

  ngAfterViewInit(): void {
    // must sub after view init to ensure table reference is loaded before emitting table data
    this.subscriptions = this.factorialDesignData$
      .pipe(
        filter((designData) => {
          return designData && designData?.factors.length === 2;
        })
      )
      .subscribe((designData) => {
        this.experimentDesignStepperService.createNewFactorialConditionTableData(designData);
        this.factorOneHeader = designData.factors[0].factor;
        this.factorTwoHeader = designData.factors[1].factor;
      });

    this.subscriptions = this.tableData$
      .pipe(filter((tableData) => !!tableData && tableData.length > 0))
      .subscribe((tableData) => {
        if (!this.formInitialized) {
          this.formInitialized = true;
          this.addFormControls(tableData);
        }

        const newTableData = this.applyEqualWeights();
        this.experimentDesignStepperService.updateFactorialTableData(newTableData);
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

  addFormControls(tableData: FactorialConditionTableRowData[]) {
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
