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
  queryFactorResults1 = {};
  queryFactorResults2 = {};
  interactionEffectQueryFactorResults = {};
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
      // main effect graph data
      result.map((res) => {
        let resultData = [];
        let resultData1 = [];
        let resultData2 = [];
        if (this.experimentType === EXPERIMENT_TYPE.FACTORIAL) {
          res.mainEffect.map((data) => {
            let decisionPointIndex = this.getFactorIndex(data.levelId);
            let resData = {
              name: this.getLevelName(data.levelId),
              value: Number(data.result),
            };
            decisionPointIndex === 0 ? resultData1.push(resData) : resultData2.push(resData);
          });
          resultData1 = this.formatEmptyBar(resultData1);
          this.queryFactorResults1 = {
            ...this.queryFactorResults1,
            [res.id]: resultData1,
          };
          resultData2 = this.formatEmptyBar(resultData2);
          this.queryFactorResults2 = {
            ...this.queryFactorResults2,
            [res.id]: resultData2,
          };
        } else {
          resultData = res.result.map((data) => ({
            name: this.getConditionCode(data.conditionId),
            value: Number(data.result),
          }));
          resultData = this.formatEmptyBar(resultData);
          this.queryResults = {
            ...this.queryResults,
            [res.id]: resultData,
          };
        }
        return {
          [res.id]: resultData,
        };
      });
      // interactive effect graph data
      result.map((res) => {
        let resultData1 = [];
        let resultData2 = [];
        let emptySeries1 = [];
        let emptySeries2 = [];
        if (this.experimentType === EXPERIMENT_TYPE.FACTORIAL) {
          // prepare all combination series with 0 result
          this.experiment.partitions.map((decisionPoint, decisionPointIndex) => {
            decisionPoint.factors.map(( factor, factorIndex) => {
              factor.levels.map((level) => {
                let levelName = level.name;
                // collect level names in 2 list
                decisionPointIndex === 0 ? resultData1.push(levelName) : resultData2.push(levelName)
              });
            });
          });
          // factor 1 with factor 2
          resultData1.map((level1) => {
            let series = [];
            resultData2.map((level2) => {
              series.push({
                  name: level2,
                  value: 0,
              });
            });
            emptySeries1.push({
              name: level1,
              series: series,
              dot: true
            });
          });
          // factor 2 with factor 1
          resultData2.map((level2) => {
            let series = [];
            resultData1.map((level1) => {
              series.push({
                  name: level1,
                  value: 0,
              });
            });
            emptySeries2.push({
              name: level2,
              series: series,
              dot: true
            });
          });
          // both factors
          let multiFactorSeries = [...emptySeries2, ...emptySeries1]
          // fill the result values for wach query:
          let resultData = multiFactorSeries;
          res.interactionEffect.map((data) => {
            // levels of the condition:
            let levels = this.getLevels(data.conditionId);
            resultData.map((resData) => {
              if (resData.name === levels[0].level.name) {
                return resData.series.map((level) => {
                  if (level.name === levels[1].level.name) {
                    return level.value = Number(data.result);
                  }
                });
              }
              else if (resData.name === levels[1].level.name) {
                return resData.series.map((level) => {
                  if (level.name === levels[0].level.name) {
                    return level.value = Number(data.result);
                  }
                });
              }
            });
          });
          this.interactionEffectQueryFactorResults = {
            ...this.interactionEffectQueryFactorResults,
            [res.id]: resultData,
          };
        }
      });
    });
  }

  getFactorIndex(levelId: any) {
    let decisionPointIndex;
    this.experiment.partitions.map((decisionPoint, decisionpointIndex) => {
      decisionPoint.factors.map((factor) => {
        factor.levels.map((level) => {
          if (level.id === levelId) {
            decisionPointIndex = decisionpointIndex;
          }
        })
      });
    })
    return decisionPointIndex;
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

  getLevels(conditionId: string) {
    return this.experiment.conditions.reduce(
      (acc, condition) => (condition.id === conditionId ? (acc = condition.levelCombinationElements as any) : acc),
      null
    );
  }

  getLevelName(levelId: string) {
    // TODO: look for factors at index apart from 0
    let levelName;
    this.experiment.partitions.map((decisionPoint, decisionPointIndex) => {
      decisionPoint.factors.map((factor, factorIndex) => {
        factor.levels.map((level) => {
          if (level.id === levelId) {
            levelName = level.name;
          }
        });
      });
    });
    return levelName;
  }

  // remove empty series data labels
  formateXAxisLabel(value) {
    return !isNaN(value) ? '' : value;
  }

  formateYAxisLabel(value) {
    return value;
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
