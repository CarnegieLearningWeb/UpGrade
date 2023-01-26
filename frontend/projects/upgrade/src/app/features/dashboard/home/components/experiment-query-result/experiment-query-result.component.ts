import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { ExperimentVM } from '../../../../../core/experiments/store/experiments.model';
import { AnalysisService } from '../../../../../core/analysis/analysis.service';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { EXPERIMENT_TYPE } from 'upgrade_types';

@Component({
  selector: 'home-experiment-query-result',
  templateUrl: './experiment-query-result.component.html',
  styleUrls: ['./experiment-query-result.component.scss'],
})
export class ExperimentQueryResultComponent implements OnInit, OnDestroy {
  @Input() experiment: ExperimentVM;

  // chart options
  colorScheme = {
    domain: ['#31e8dd', '#7dc7fb', '#fedb64', '#51ed8f', '#ddaaf8', '#fd9099', '#14c9be'],
  };

  colorScheme2 = {
    domain: ['#D18650', '#5572B8', '#A5A5A5', '#31e8dd', '#7dc7fb', '#fd9099', '#14c9be'],
  };

  queryResults = {};
  queryResultsSub: Subscription;
  isQueryExecuting$ = this.analysisService.isQueryExecuting$;
  factors = [];
  displayedColumns: string[] = [];
  factorialData = {};
  experimentType: string = null;
  data: { name: string; series: { name: string; value: number; }[]; dot: boolean; }[];
  meanData2: { name: string; value: number; }[];
  meanData1: { name: string; value: number; }[];

  constructor(private analysisService: AnalysisService) {}

  ngOnInit() {
    const queryIds = [];
    this.experimentType = this.experiment.type;
    if (this.experimentType === EXPERIMENT_TYPE.FACTORIAL){
      this.experiment.partitions.map((decisionPoint) => {
        this.factors.push(decisionPoint.factors?.at(0).name);
      });
    }
    this.queryResults = this.experiment.queries.map((query) => {
      queryIds.push(query.id);
      return {
        [query.id]: [],
      };
    });
    this.analysisService.executeQuery(queryIds);
    this.queryResultsSub = this.analysisService.queryResult$.pipe(filter((result) => !!result)).subscribe((result) => {
      result.map((res) => {
        let resultData = res.result.map((data) => ({
          name: this.getConditionCode(data.conditionId),
          value: Number(data.result),
        }));
        resultData = this.formatEmptyBar(resultData);
        this.queryResults = {
          ...this.queryResults,
          [res.id]: resultData,
        };
        return {
          [res.id]: resultData,
        };
      });
    });

    this.meanData1 = [
      {
        "name": "Abstract",
        "value": 8
      },
      {
        "name": "Concrete",
        "value": 5
      }
    ];

    this.meanData2 = [
      {
        "name": "No Support",
        "value": 6
      },
      {
        "name": "Mindset",
        "value": 3
      },
      {
        "name": "Utility Value",
        "value": 9
      }
    ];

    this.data = [
      {
        name: 'No Support',
        series: [
          {
            name: 'Abstract',
            value: 9,
          },
          {
            name: 'Concrete',
            value: 6,
          }
        ],
        dot: true
      },
      {
        name: 'Minset',
        series: [
          {
            name: 'Abstract',
            value: 8,
          },
          {
            name: 'Concrete',
            value: 5,
          }
        ],
        dot: true
      },
      {
        name: 'Utility Value',
        series: [
          {
            name: 'Abstract',
            value: 7,
          },
          {
            name: 'Concrete',
            value: 4,
          }
        ],
        dot: true
      },
      {
        name: 'Abstract',
        series: [
          {
            name: 'No Support',
            value: 3,
          },
          {
            name: 'Mindset',
            value: 6,
          },
          {
            name: 'Utility Value',
            value: 9,
          }
        ],
        dot: true
      },
      {
        name: 'Concrete',
        series: [
          {
            name: 'No Support',
            value: 2,
          },
          {
            name: 'Mindset',
            value: 5,
          },
          {
            name: 'Utility Value',
            value: 8,
          }
        ],
        dot: true
      }
    ];
  }

  isResultExist(queryId: string): boolean {
    let result = this.queryResults[queryId];
    if (result) {
      result = result.filter((res) => typeof res.name === 'string');
      return result.length === 0;
    }
    return false;
  }

  getConditionCode(conditionId: string) {
    return this.experiment.conditions.reduce(
      (acc, condition) => (condition.id === conditionId ? (acc = condition.conditionCode as any) : acc),
      null
    );
  }

  // remove empty series data labels
  formateXAxisLabel(value) {
    return !isNaN(value) ? '' : value;
  }

  formateYAxisLabel(value) {
    return !isNaN(value) ? '' : value;
  }

  formatEmptyBar(data: any) {
    const emptyBars = [];
    // TODO: Decide number of conditions
    for (let i = 0; i < 2 - data.length; i++) {
      emptyBars.push({
        name: i,
        value: 0,
      });
    }
    return [...data, ...emptyBars];
  }

  ngOnDestroy() {
    this.queryResultsSub.unsubscribe();
    this.analysisService.setQueryResult(null);
  }
}
