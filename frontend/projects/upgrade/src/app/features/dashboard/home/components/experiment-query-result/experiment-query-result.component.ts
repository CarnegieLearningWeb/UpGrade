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

  queryResults = {};
  queryFactorResults1 = {};
  queryFactorResults2 = {};
  interactionEffectQueryFactorResults1 = {};
  interactionEffectQueryFactorResults2 = {};
  queryResultsSub: Subscription;
  isQueryExecuting$ = this.analysisService.isQueryExecuting$;
  factors = [];
  displayedColumns: string[] = [];
  factorialData = {};
  experimentType: string = null;
  data: { name: string; series: { name: string; value: number; }[]; dot: boolean; }[];
  meanData2: { name: string; value: number; }[];
  meanData1: { name: string; value: number; }[];
  maxLevelCount = 0;

  constructor(private analysisService: AnalysisService) {}

  ngOnInit() {
    const queryIds = [];

    this.experimentType = this.experiment.type;
    if (this.experimentType === EXPERIMENT_TYPE.FACTORIAL){
      this.setMaxLevelsCount();
      this.experiment.partitions.map((decisionPoint) => {
        decisionPoint.factors.map((factor) => {
          this.factors.push(factor?.name);
        });
      });
    } else {
      this.setConditionCount();
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
      this.populateMainEffectGraphData(result);

      // interactive effect graph data
      this.populateInteractionGraphData(result);
    });
  }
  populateMainEffectGraphData(result: any[]) {
    result.map((res) => {
      let resultData = [];
      let resultData1 = [];
      let resultData2 = [];
      if (this.experimentType === EXPERIMENT_TYPE.FACTORIAL) {
        res.mainEffect.map((data) => {
          let decisionPointIndex = this.getFactorIndex(data.levelId);
          let resData = {
            name: this.getLevelName(data.levelId),
            value: Math.round(Number(data.result) * 100)/ 100,
            extra: Number(data.participantsLogged),
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
        resultData = res.mainEffect.map((data) => ({
          name: this.getConditionCode(data.conditionId),
          value: Math.round(Number(data.result) * 100)/ 100,
          extra: Number(data.participantsLogged),
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
  }

  populateInteractionGraphData(result) {
    result.map((res) => {
      let resultData1 = [];
      let resultData2 = [];
      let emptySeries1 = [];
      let emptySeries2 = [];
      if (this.experimentType === EXPERIMENT_TYPE.FACTORIAL) {
        // prepare all combination series with 0 result
        let decisionPointIndex;
        this.experiment.partitions.map((decisionPoint, decisionpointIndex) => {
          decisionPoint.factors.map((factor, factorIndex) => {
            factor.levels.map((level) => {
              let levelName = level.name;
              // collect level names in 2 list
              decisionPoint.factors.length >= 2 ? decisionPointIndex = factorIndex : decisionPointIndex = decisionpointIndex;
              decisionPointIndex === 0 ? resultData1.push(levelName) : resultData2.push(levelName)
            });
          });
        });

        // factor 1 with factor 2
        emptySeries1 = this.prepareEmptySeriesInteractionGraphData(resultData1, resultData2);
        // factor 2 with factor 1
        emptySeries2 = this.prepareEmptySeriesInteractionGraphData(resultData2, resultData1);
        
        // fill the result values for each query:
        let resData1 = emptySeries1;
        let resData2 = emptySeries2;
        res.interactionEffect.map((data) => {
          // levels of the condition:
          let levels = this.getLevels(data.conditionId);
          this.populateLineChartSeries(resData1, data, levels, 0);
          this.populateLineChartSeries(resData2, data, levels, 1);
        });
        this.interactionEffectQueryFactorResults1 = {
          ...this.interactionEffectQueryFactorResults1,
          [res.id]: resData1,
        };
        this.interactionEffectQueryFactorResults2 = {
          ...this.interactionEffectQueryFactorResults2,
          [res.id]: resData2,
        };
      }
    });
  }
  
  prepareEmptySeriesInteractionGraphData(resultData1, resultData2) {
    let emptySeries = [];
    resultData1.map((level1) => {
      let series = [];
      resultData2.map((level2) => {
        series.push({
            name: level2,
            value: 0,
            participantsLogged: 0
        });
      });
      emptySeries.push({
        name: level1,
        series: series,
        dot: true
      });
    });
    return emptySeries;
  }

  populateLineChartSeries(resData: any[], data, levels, factorNumber: number) {
    resData.map((resData) => {
      if (resData.name === levels[factorNumber].level.name) {
        return resData.series.map((level) => {
          let alternateFactorNumber = factorNumber === 0 ? 1 : 0;
          if (level.name === levels[alternateFactorNumber].level.name) {
            level.value = Math.round(Number(data.result) * 100)/ 100;
            level.participantsLogged = Number(data.participantsLogged);
          }
        });
      }
    });
  }
  
  setMaxLevelsCount() {
    this.experiment.partitions.map((decisionPoint, decisionPointIndex) => {
      decisionPoint.factors.map((factor, factorIndex) => {
        let levelCount = factor.levels.length;
        if (levelCount > this.maxLevelCount) {
          this.maxLevelCount = levelCount;
        }
      });
    });
  }

  setConditionCount() {
    this.maxLevelCount = this.experiment.conditions.length;
  }

  getFactorIndex(levelId: any) {
    let decisionPointIndex;
    this.experiment.partitions.map((decisionPoint, decisionpointIndex) => {
      decisionPoint.factors.map((factor, factorIndex) => {
        factor.levels.map((level) => {
          if (level.id === levelId) {
            decisionPoint.factors.length >= 2 ? decisionPointIndex = factorIndex : decisionPointIndex = decisionpointIndex;
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
    return value === 0.5 || value === 1.5 ? '' : value;
  }

  formatEmptyBar(data: any) {
    const emptyBars = [];
    // Decide number of bars by inserting empty bars in case data not present:
    for (let i = 0; i < this.maxLevelCount - data.length; i++) {
      emptyBars.push({
        name: i,
        value: 0,
        extra: 0,
      });
    }
    return [...data, ...emptyBars];
  }

  ngOnDestroy() {
    this.queryResultsSub.unsubscribe();
    this.analysisService.setQueryResult(null);
  }
}
