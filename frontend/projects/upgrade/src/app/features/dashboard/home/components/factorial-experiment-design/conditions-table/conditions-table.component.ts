import { Component, OnInit, ChangeDetectionStrategy, OnDestroy, EventEmitter, Output } from '@angular/core';
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
  factorialDesignData$ = this.experimentDesignStepperService.factorialDesignData$;
  tableData$ = this.experimentDesignStepperService.factorialConditionTableData$;
  tableEditIndex$ = this.experimentDesignStepperService.factorialConditionsTableEditIndex$;
  isFormLockedForEdit$ = this.experimentDesignStepperService.isFormLockedForEdit$;
  previousRowDataBehaviorSubject$ = new BehaviorSubject<FactorialConditionTableRowData>(null);
  columnHeaders = ['levelNameOne', 'levelNameTwo', 'alias', 'weight', 'include', 'actions'];
  equalWeightFlag = true;
  factorOneHeader = 'factor1';
  factorTwoHeader = 'factor2';

  constructor(private experimentDesignStepperService: ExperimentDesignStepperService) {}

  ngOnInit(): void {
    this.experimentDesignStepperService.factorialConditionsEditModePreviousRowData$.subscribe(
      this.previousRowDataBehaviorSubject$
    );
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
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  handleHideClick() {
    this.hide.emit(true);
  }

  handleTableEditClick(rowIndex: number, rowData: FactorialConditionTableRowData) {
    this.experimentDesignStepperService.setFactorialConditionTableEditModeDetails(rowIndex, rowData);
  }

  handleClear(rowIndex: number) {
    const previousRowData = this.previousRowDataBehaviorSubject$.value;

    this.resetPreviousRowDataOnEditCancel(previousRowData, rowIndex);
  }

  resetPreviousRowDataOnEditCancel(previousRowData: FactorialConditionTableRowData, rowIndex: number) {
    this.experimentDesignStepperService.clearFactorialConditionTableEditModeDetails();
  }
}
