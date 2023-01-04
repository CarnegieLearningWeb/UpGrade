import { Component, OnInit, ChangeDetectionStrategy, OnDestroy, EventEmitter, Output } from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { BehaviorSubject, filter, Subscription, take } from 'rxjs';
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
  showForm = false;
  factorOneHeader = 'factor1';
  factorTwoHeader = 'factor2';

  constructor(
    private experimentDesignStepperService: ExperimentDesignStepperService,
    private _formBuilder: FormBuilder
  ) {}

  ngOnInit(): void {
    this.experimentDesignStepperService.factorialConditionsEditModePreviousRowData$.subscribe(
      this.previousRowDataBehaviorSubject$
    );
    this.experimentDesignStepperService.factorialConditionTableData$.subscribe(this.tableData$);
    this.createForm();
  }

  ngAfterViewInit(): void {
    // must sub after view init to ensure table reference is loaded before emitting table data
    this.subscriptions = this.factorialDesignData$
      .pipe(
        filter((designData) => {
          // TODO: compare against previous designData to filter out duplicates?
          return designData && designData?.factors.length === 2;
        })
      )
      .subscribe((designData) => {
        this.experimentDesignStepperService.createNewFactorialConditionTableData(designData);
        this.factorOneHeader = designData.factors[0].factor;
        this.factorTwoHeader = designData.factors[1].factor;
      });

    this.subscriptions = this.tableData$
      .pipe(
        filter((tableData) => !!tableData && tableData.length > 0),
        take(1)
      )
      .subscribe((tableData) => {
        tableData.forEach((tableDataRow) => {
          const formControls = this._formBuilder.group({
            levelNameOne: [tableDataRow.levelNameOne],
            levelNameTwo: [tableDataRow.levelNameTwo],
            alias: [tableDataRow.alias],
            weight: [tableDataRow.weight],
            include: [tableDataRow.include],
          });

          this.getFactorialConditions().push(formControls);
        });

        this.showForm = true;
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

  resetPreviousRowDataOnEditCancel(previousRowData: FactorialConditionTableRowData, rowIndex: number) {
    this.resetEdit();
  }

  resetEdit(): void {
    this.experimentDesignStepperService.clearFactorialConditionTableEditModeDetails();
  }

  /* -- action button handlers -- */

  handleHideClick() {
    this.hide.emit(true);
  }

  handleRowEditClick(rowData: FactorialConditionTableRowData, rowIndex: number) {
    this.experimentDesignStepperService.setFactorialConditionTableEditModeDetails(rowIndex, rowData);
  }

  handleRowEditDoneClick(rowIndex: number) {
    const tableData = [...this.tableData$.value];
    const formRow = this.getFactorialConditionsAt(rowIndex);

    const alias = formRow.get('alias').value;
    const weight = formRow.get('weight').value;
    const include = formRow.get('include').value;

    tableData[rowIndex] = { ...tableData[rowIndex], alias, weight, include };
    this.tableData$.next(tableData);
    this.experimentDesignStepperService.clearFactorialConditionTableEditModeDetails();
  }

  handleClear(rowIndex: number) {
    const previousRowData = this.previousRowDataBehaviorSubject$.value;
    const formRow = this.getFactorialConditionsAt(rowIndex);

    formRow.get('alias').setValue(previousRowData.alias, { emitEvent: false });
    formRow.get('weight').setValue(previousRowData.weight, { emitEvent: false });
    formRow.get('include').setValue(previousRowData.include, { emitEvent: false });

    this.resetPreviousRowDataOnEditCancel(previousRowData, rowIndex);
  }

  /* -- convenience accessors --*/

  getFactorialConditions(): FormArray {
    return this.factorialConditionTableForm.get('factorialConditions') as FormArray;
  }

  getFactorialConditionsAt(rowIndex: number) {
    return this.getFactorialConditions().at(rowIndex);
  }
}
