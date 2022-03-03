import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { ExperimentVM } from '../../../../../core/experiments/store/experiments.model';
import { AnalysisService } from '../../../../../core/analysis/analysis.service';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'home-experiment-query-result',
  templateUrl: './experiment-query-result.component.html',
  styleUrls: ['./experiment-query-result.component.scss']
})
export class ExperimentQueryResultComponent implements OnInit, OnDestroy {
  @Input() experiment: ExperimentVM;

  // chart options
  colorScheme = {
    domain: ['#31e8dd', '#7dc7fb', '#fedb64', '#51ed8f', '#ddaaf8', '#fd9099', '#14c9be']
  };

  queryResults = {};
  queryResultsSub: Subscription;
  isQueryExecuting$ = this.analysisService.isQueryExecuting$;
  constructor(private analysisService: AnalysisService) { }

  ngOnInit() {
    const queryIds = [];
    this.queryResults = this.experiment.queries.map(query => {
      queryIds.push(query.id);
      return {
        [query.id]: []
      }
    })
    this.analysisService.executeQuery(queryIds);
    this.queryResultsSub = this.analysisService.queryResult$.pipe(
      filter(result => !!result)
    ).subscribe(result => {
      result.map(res => {
        let resultData = res.result.map(data =>
          ({
            name: this.getConditionCode(data.conditionId),
            value: Number(data.result),
          })
        );
        resultData = this.formatEmptyBar(resultData);
        this.queryResults = {
          ...this.queryResults,
          [res.id]: resultData
        }
        return {
          [res.id]: resultData
        }
      });
    });
  }

  isResultExist(queryId: string): boolean {
    let result = this.queryResults[queryId];
    if (result) {
      result = result.filter(res => typeof res.name === 'string');
      return result.length === 0;
    }
    return false;
  }

  getConditionCode(conditionId: string) {
    return this.experiment.conditions.reduce((acc, condition) =>
      condition.id === conditionId ? acc = condition['conditionCode'] as any : acc
      , null);
  }

  // remove empty series data labels
  formateXAxisLabel(value) {
    return !isNaN(value) ? '' : value;
  }

  formatEmptyBar(data: any) {
    const emptyBars = [];
    // TODO: Decide number of conditions
    for (let i = 0; i < 15 - data.length; i++) {
      emptyBars.push({
        name: i,
        value: 0
      });
    }
    return [...data, ...emptyBars];
  }

  ngOnDestroy() {
    this.queryResultsSub.unsubscribe();
    this.analysisService.setQueryResult(null);
  }

}
