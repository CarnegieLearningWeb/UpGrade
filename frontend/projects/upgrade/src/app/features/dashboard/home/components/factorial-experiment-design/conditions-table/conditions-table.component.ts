import { Component, OnInit, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { filter, Subscription } from 'rxjs';
import { ExperimentDesignStepperService } from '../../../../../../core/experiment-design-stepper/experiment-design-stepper.service';

@Component({
  selector: 'app-conditions-table',
  templateUrl: './conditions-table.component.html',
  styleUrls: ['./conditions-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConditionsTableComponent implements OnInit, OnDestroy {
  subscriptions: Subscription;
  factorialDesignData$ = this.experimentDesignStepperService.factorialDesignData$;
  tableData$ = this.experimentDesignStepperService.factorialConditionTableData$;
  columnHeaders = ['levelNameOne', 'levelNameTwo', 'alias', 'weight', 'include', 'actions'];
  equalWeightFlag = true;
  factorOneHeader = 'factor1';
  factorTwoHeader = 'factor2';

  constructor(private experimentDesignStepperService: ExperimentDesignStepperService) {}

  ngOnInit(): void {
    console.log('hello');
  }

  ngAfterViewInit(): void {
    // must sub after view init to ensure table reference is loaded before emitting table data
    this.subscriptions = this.factorialDesignData$
      .pipe(
        filter((designData) => {
          // TODO: compare against previous designData to filter out duplicates?
          // alos, support is only for two factors currently...
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
    console.log('hide?');
  }
}
