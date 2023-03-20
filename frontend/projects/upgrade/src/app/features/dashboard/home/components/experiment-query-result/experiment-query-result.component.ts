import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import {
  ExperimentVM,
  InteractionEffectGraphData,
  InteractionEffectLineChartSeriesData,
  InteractionEffectResult,
  LevelCombinationElement,
  MainEffectGraphData,
  QueryResult,
} from '../../../../../core/experiments/store/experiments.model';
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
  data: { name: string; series: { name: string; value: number }[]; dot: boolean }[];
  meanData2: { name: string; value: number }[];
  meanData1: { name: string; value: number }[];
  maxLevelCount = 0;

  constructor(private analysisService: AnalysisService) {}

  ngOnInit() {
    const queryIds = [];
    // sort the factors:
    this.experiment.factors = this.experiment.factors.slice().sort((a,b)=> (a.order > b.order ? 1 : -1))
    this.experimentType = this.experiment.type;
    if (this.experimentType === EXPERIMENT_TYPE.FACTORIAL) {
      this.setMaxLevelsCount();
      this.experiment.factors.map((factor) => {
        this.factors.push(factor?.name);
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
  populateMainEffectGraphData(result: QueryResult[]) {
    result.forEach((res) => {
      let resultData: MainEffectGraphData[] = [];
      let resultData1: MainEffectGraphData[] = [];
      let resultData2: MainEffectGraphData[] = [];
      if (this.experimentType === EXPERIMENT_TYPE.FACTORIAL) {
        res.mainEffect.forEach((data) => {
          const factorIndex = this.getFactorIndex(data.levelId);
          const resData = {
            name: this.getLevelName(data.levelId),
            value: Math.round(Number(data.result) * 100) / 100,
            extra: Number(data.participantsLogged),
          };
          factorIndex === 0 ? resultData1.push(resData) : resultData2.push(resData);
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
          value: Math.round(Number(data.result) * 100) / 100,
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

  populateInteractionGraphData(result: QueryResult[]) {
    result.forEach((res) => {
      const resultData1: string[] = [];
      const resultData2: string[] = [];
      let emptySeries1: InteractionEffectGraphData[] = [];
      let emptySeries2: InteractionEffectGraphData[] = [];
      if (this.experimentType === EXPERIMENT_TYPE.FACTORIAL) {
        // prepare all combination series with 0 result
        // sort the factors:
        this.experiment.factors = this.experiment.factors.slice().sort((a,b)=> (a.order > b.order ? 1 : -1))
        this.experiment.factors.map((factor, index) => {
          factor.levels.map((level) => {
            const levelName = level.name;
            // collect level names in 2 list
            index === 0 ? resultData1.push(levelName) : resultData2.push(levelName);
          });
        });

        // factor 1 with factor 2
        emptySeries1 = this.prepareEmptySeriesInteractionGraphData(resultData1, resultData2);
        // factor 2 with factor 1
        emptySeries2 = this.prepareEmptySeriesInteractionGraphData(resultData2, resultData1);

        // fill the result values for each query:
        let resData1 = emptySeries1;
        let resData2 = emptySeries2;
        res.interactionEffect.forEach((data) => {
          // levels of the condition:
          const levels: LevelCombinationElement[] = this.getLevels(data.conditionId);
          resData1 = this.populateLineChartSeries(resData1, data, levels, 1);
          resData2 = this.populateLineChartSeries(resData2, data, levels, 0);
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

  prepareEmptySeriesInteractionGraphData(resultData1: string[], resultData2: string[]): InteractionEffectGraphData[] {
    const emptySeries: InteractionEffectGraphData[] = [];
    resultData1.forEach((level1) => {
      const series: InteractionEffectLineChartSeriesData[] = [];
      resultData2.forEach((level2) => {
        series.push({
          name: level2,
          value: 0,
          participantsLogged: 0,
        });
      });
      emptySeries.push({
        name: level1,
        series: series,
        dot: true,
      });
    });
    return emptySeries;
  }

  populateLineChartSeries(
    resData: InteractionEffectGraphData[],
    data: InteractionEffectResult,
    levels: LevelCombinationElement[],
    factorNumber: number
  ): InteractionEffectGraphData[] {
    resData.map((result) => {
      if (result.name === levels[factorNumber].level.name) {
        return result.series.map((level) => {
          const alternateFactorNumber = factorNumber === 0 ? 1 : 0;
          if (level.name === levels[alternateFactorNumber].level.name) {
            level.value = Math.round(Number(data.result) * 100) / 100;
            level.participantsLogged = Number(data.participantsLogged);
          }
        });
      }
    });
    return resData;
  }

  setMaxLevelsCount() {
    this.experiment.factors.forEach((factor) => {
      const levelCount = factor.levels.length;
      if (levelCount > this.maxLevelCount) {
        this.maxLevelCount = levelCount;
      }
    });
  }

  setConditionCount() {
    this.maxLevelCount = this.experiment.conditions.length;
  }

  getFactorIndex(levelId: string): number {
    let factorIndex;
    this.experiment.factors.forEach((factor, index) => {
      factor.levels.forEach((level) => {
        if (level.id === levelId) {
          factorIndex = index;
        }
      });
    });
    return factorIndex;
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

  getLevels(conditionId: string): LevelCombinationElement[] {
    return this.experiment.conditions.reduce(
      (acc, condition) => (condition.id === conditionId ? (acc = condition.levelCombinationElements as any) : acc),
      null
    );
  }

  getLevelName(levelId: string): string {
    // TODO: look for factors at index apart from 0
    let levelName;
    this.experiment.factors.forEach((factor) => {
      factor.levels.forEach((level) => {
        if (level.id === levelId) {
          levelName = level.name;
        }
      });
    });
    return levelName;
  }

  // remove empty series data labels
  formateXAxisLabel(value: number) {
    return !isNaN(value) ? '' : value;
  }

  formateYAxisLabel(value: number) {
    return value === 0.5 || value === 1.5 ? '' : value;
  }

  formatEmptyBar(data: MainEffectGraphData[]) {
    const emptyBars: MainEffectGraphData[] = [];
    // Decide number of bars by inserting empty bars in case data not present:
    for (let i = 0; i < this.maxLevelCount - data.length; i++) {
      emptyBars.push({
        name: i.toString(),
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
