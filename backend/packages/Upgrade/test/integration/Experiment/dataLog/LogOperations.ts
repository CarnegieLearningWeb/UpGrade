import Container from 'typedi';
import { ExperimentService } from '../../../../src/api/services/ExperimentService';
import { individualAssignmentExperiment } from '../../mockData/experiment/index';
import { UserService } from '../../../../src/api/services/UserService';
import { getRepository } from 'typeorm';
import { Metric } from '../../../../src/api/models/Metric';
import { systemUser } from '../../mockData/user/index';
import { ExperimentAssignmentService } from '../../../../src/api/services/ExperimentAssignmentService';
import { experimentUsers } from '../../mockData/experimentUsers/index';
import { EXPERIMENT_STATE, OPERATION_TYPES, REPEATED_MEASURE } from 'upgrade_types';
import { checkMarkExperimentPointForUser, getAllExperimentCondition, markExperimentPoint } from '../../utils';
import { checkExperimentAssignedIsNotDefault } from '../../utils/index';
import { MetricService, METRICS_JOIN_TEXT } from '../../../../src/api/services/MetricService';
import { SettingService } from '../../../../src/api/services/SettingService';
import { QueryService } from '../../../../src/api/services/QueryService';
import { metrics } from '../../mockData/metric';
import { UpgradeLogger } from '../../../../src/lib/logger/UpgradeLogger';
import { ExperimentUserService } from '../../../../src/api/services/ExperimentUserService';

export default async function LogOperations(): Promise<void> {
  const experimentService = Container.get<ExperimentService>(ExperimentService);
  const experimentAssignmentService = Container.get<ExperimentAssignmentService>(ExperimentAssignmentService);
  const experimentUserService = Container.get<ExperimentUserService>(ExperimentUserService);
  let experimentObject = individualAssignmentExperiment;
  const userService = Container.get<UserService>(UserService);
  const metricRepository = getRepository(Metric);
  const metricService = Container.get<MetricService>(MetricService);
  const settingService = Container.get<SettingService>(SettingService);
  const queryService = Container.get<QueryService>(QueryService);

  const user = await userService.upsertUser(systemUser as any, new UpgradeLogger());

  // create experiment
  await experimentService.create(experimentObject as any, user, new UpgradeLogger());
  let experiments = await experimentService.find(new UpgradeLogger());
  expect(experiments).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        name: experimentObject.name,
        state: experimentObject.state,
        postExperimentRule: experimentObject.postExperimentRule,
        assignmentUnit: experimentObject.assignmentUnit,
        consistencyRule: experimentObject.consistencyRule,
      }),
    ])
  );

  const experimentName = experimentObject.partitions[0].target;
  const experimentPoint = experimentObject.partitions[0].site;

  await settingService.setClientCheck(false, true, new UpgradeLogger());

  await metricService.saveAllMetrics(metrics as any, new UpgradeLogger());

  const findMetric = await metricRepository.find();
  expect(findMetric.length).toEqual(36);

  // change experiment status to Enrolling
  const experimentId = experiments[0].id;
  await experimentService.updateState(experimentId, EXPERIMENT_STATE.ENROLLING, user, new UpgradeLogger());

  // fetch experiment
  experiments = await experimentService.find(new UpgradeLogger());
  expect(experiments).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        name: experimentObject.name,
        state: EXPERIMENT_STATE.ENROLLING,
        postExperimentRule: experimentObject.postExperimentRule,
        assignmentUnit: experimentObject.assignmentUnit,
        consistencyRule: experimentObject.consistencyRule,
      }),
    ])
  );
  const condition = experimentObject.conditions[0].conditionCode;

  // get all experiment condition for user 1
  let experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[0].id, new UpgradeLogger());
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName, experimentPoint);

  // mark experiment point for user 1
  let markedExperimentPoint = await markExperimentPoint(
    experimentUsers[0].id,
    experimentName,
    experimentPoint,
    condition,
    new UpgradeLogger()
  );
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[0].id, experimentName, experimentPoint);

  // get all experiment condition for user 2
  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[1].id, new UpgradeLogger());
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName, experimentPoint);

  // mark experiment point for user 2
  markedExperimentPoint = await markExperimentPoint(
    experimentUsers[1].id,
    experimentName,
    experimentPoint,
    condition,
    new UpgradeLogger()
  );
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[1].id, experimentName, experimentPoint);

  // get all experiment condition for user 3
  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[2].id, new UpgradeLogger());
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName, experimentPoint);

  // mark experiment point for user 3
  markedExperimentPoint = await markExperimentPoint(
    experimentUsers[2].id,
    experimentName,
    experimentPoint,
    condition,
    new UpgradeLogger()
  );
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[2].id, experimentName, experimentPoint);

  // get all experiment condition for user 4
  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[3].id, new UpgradeLogger());
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName, experimentPoint);

  // mark experiment point for user 4
  markedExperimentPoint = await markExperimentPoint(
    experimentUsers[3].id,
    experimentName,
    experimentPoint,
    condition,
    new UpgradeLogger()
  );
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[3].id, experimentName, experimentPoint);

  // get all experiment condition for user 5
  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[4].id, new UpgradeLogger());
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName, experimentPoint);

  // mark experiment point for user 5
  markedExperimentPoint = await markExperimentPoint(
    experimentUsers[4].id,
    experimentName,
    experimentPoint,
    condition,
    new UpgradeLogger()
  );
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[4].id, experimentName, experimentPoint);

  // Save queries for various operations
  const querySum = makeQuery('totalProblemsCompleted', OPERATION_TYPES.SUM, experiments[0].id);

  const queryMin = makeQuery('totalProblemsCompleted', OPERATION_TYPES.MIN, experiments[0].id);

  const queryMax = makeQuery('totalProblemsCompleted', OPERATION_TYPES.MAX, experiments[0].id);

  const queryAvg = makeQuery('totalProblemsCompleted', OPERATION_TYPES.AVERAGE, experiments[0].id);

  const queryCount = makeQuery('totalProblemsCompleted', OPERATION_TYPES.COUNT, experiments[0].id);

  const queryMode = makeQuery('totalProblemsCompleted', OPERATION_TYPES.MODE, experiments[0].id);

  const queryMedian = makeQuery('totalProblemsCompleted', OPERATION_TYPES.MEDIAN, experiments[0].id);

  const queryStddev = makeQuery('totalProblemsCompleted', OPERATION_TYPES.STDEV, experiments[0].id);

  // Deep state queries
  const deepQuerySum = makeQuery(
    `masteryWorkspace${METRICS_JOIN_TEXT}calculating_area_figures${METRICS_JOIN_TEXT}timeSeconds`,
    OPERATION_TYPES.SUM,
    experiments[0].id
  );

  const deepQueryAvg = makeQuery(
    `masteryWorkspace${METRICS_JOIN_TEXT}calculating_area_figures${METRICS_JOIN_TEXT}timeSeconds`,
    OPERATION_TYPES.AVERAGE,
    experiments[0].id
  );

  const deepQueryMin = makeQuery(
    `masteryWorkspace${METRICS_JOIN_TEXT}calculating_area_figures${METRICS_JOIN_TEXT}timeSeconds`,
    OPERATION_TYPES.MIN,
    experiments[0].id
  );

  const deepQueryMax = makeQuery(
    `masteryWorkspace${METRICS_JOIN_TEXT}calculating_area_figures${METRICS_JOIN_TEXT}timeSeconds`,
    OPERATION_TYPES.MAX,
    experiments[0].id
  );

  const deepQueryCount = makeQuery(
    `masteryWorkspace${METRICS_JOIN_TEXT}calculating_area_figures${METRICS_JOIN_TEXT}timeSeconds`,
    OPERATION_TYPES.COUNT,
    experiments[0].id
  );

  const deepQueryMedian = makeQuery(
    `masteryWorkspace${METRICS_JOIN_TEXT}calculating_area_figures${METRICS_JOIN_TEXT}timeSeconds`,
    OPERATION_TYPES.MEDIAN,
    experiments[0].id
  );

  const deepQueryMode = makeQuery(
    `masteryWorkspace${METRICS_JOIN_TEXT}calculating_area_figures${METRICS_JOIN_TEXT}timeSeconds`,
    OPERATION_TYPES.MODE,
    experiments[0].id
  );

  const deepQueryStddev = makeQuery(
    `masteryWorkspace${METRICS_JOIN_TEXT}calculating_area_figures${METRICS_JOIN_TEXT}timeSeconds`,
    OPERATION_TYPES.STDEV,
    experiments[0].id
  );

  // Deep state queries for categorical data
  const deepQueryCatSum = makeQuery(
    `masteryWorkspace${METRICS_JOIN_TEXT}calculating_area_figures${METRICS_JOIN_TEXT}completion`,
    OPERATION_TYPES.COUNT,
    experiments[0].id
  );

  // Deep state percentage query
  const deepPercentage = {
    name: 'query',
    query: {
      operationType: OPERATION_TYPES.PERCENTAGE,
      compareFn: '=',
      compareValue: 'GRADUATED',
    },
    metric: {
      key: `masteryWorkspace${METRICS_JOIN_TEXT}calculating_area_figures${METRICS_JOIN_TEXT}completion`,
    },
    experimentId: experiments[0].id,
  };

  experimentObject = {
    ...experimentObject,
    queries: [
      querySum,
      queryMin,
      queryMax,
      queryAvg,
      queryCount,
      queryMode,
      queryMedian,
      queryStddev,
      deepQuerySum,
      deepQueryAvg,
      deepQueryMin,
      deepQueryMax,
      deepQueryCount,
      deepQueryMedian,
      deepQueryMode,
      deepQueryStddev,
      deepQueryCatSum,
      deepPercentage,
    ],
  };

  await experimentService.update(experimentObject as any, user, new UpgradeLogger());
  // getOriginalUserDoc
  let experimentUserDoc = await experimentUserService.getOriginalUserDoc(experimentUsers[0].id, new UpgradeLogger());
  // log data here
  await experimentAssignmentService.dataLog(
    experimentUsers[0].id,
    [
      {
        timestamp: new Date().toISOString(),
        metrics: {
          attributes: {
            totalProblemsCompleted: 20,
          },
          groupedMetrics: [
            {
              groupClass: 'masteryWorkspace',
              groupKey: 'calculating_area_figures',
              groupUniquifier: '1',
              attributes: {
                timeSeconds: 100,
                completion: 'GRADUATED',
              },
            },
          ],
        },
      },
    ],
    { logger: new UpgradeLogger(), userDoc: experimentUserDoc }
  );
  // getOriginalUserDoc
  experimentUserDoc = await experimentUserService.getOriginalUserDoc(experimentUsers[1].id, new UpgradeLogger());
  await experimentAssignmentService.dataLog(
    experimentUsers[1].id,
    [
      {
        timestamp: new Date().toISOString(),
        metrics: {
          attributes: {
            totalProblemsCompleted: 200,
          },
          groupedMetrics: [
            {
              groupClass: 'masteryWorkspace',
              groupKey: 'calculating_area_figures',
              groupUniquifier: '1',
              attributes: { timeSeconds: 200, completion: 'GRADUATED' },
            },
          ],
        },
      },
    ],
    { logger: new UpgradeLogger(), userDoc: experimentUserDoc }
  );
  // getOriginalUserDoc
  experimentUserDoc = await experimentUserService.getOriginalUserDoc(experimentUsers[2].id, new UpgradeLogger());
  await experimentAssignmentService.dataLog(
    experimentUsers[2].id,
    [
      {
        timestamp: new Date().toISOString(),
        metrics: {
          attributes: {
            totalProblemsCompleted: 100,
          },
          groupedMetrics: [
            {
              groupClass: 'masteryWorkspace',
              groupKey: 'calculating_area_figures',
              groupUniquifier: '1',
              attributes: { timeSeconds: 300, completion: 'PROMOTED' },
            },
          ],
        },
      },
    ],
    { logger: new UpgradeLogger(), userDoc: experimentUserDoc }
  );
  // getOriginalUserDoc
  experimentUserDoc = await experimentUserService.getOriginalUserDoc(experimentUsers[3].id, new UpgradeLogger());
  await experimentAssignmentService.dataLog(
    experimentUsers[3].id,
    [
      {
        timestamp: new Date().toISOString(),
        metrics: {
          attributes: {
            totalProblemsCompleted: 50,
          },
          groupedMetrics: [
            {
              groupClass: 'masteryWorkspace',
              groupKey: 'calculating_area_figures',
              groupUniquifier: '1',
              attributes: { timeSeconds: 400, completion: 'GRADUATED' },
            },
          ],
        },
      },
    ],
    { logger: new UpgradeLogger(), userDoc: experimentUserDoc }
  );

  await experimentAssignmentService.dataLog(
    experimentUsers[3].id,
    [
      {
        timestamp: new Date().toISOString(),
        metrics: {
          attributes: {
            totalProblemsCompleted: 50,
          },
          groupedMetrics: [
            {
              groupClass: 'masteryWorkspace',
              groupKey: 'calculating_area_figures',
              groupUniquifier: '1',
              attributes: { timeSeconds: 500, completion: 'PROMOTED' },
            },
          ],
        },
      },
    ],
    { logger: new UpgradeLogger(), userDoc: experimentUserDoc }
  );

  experimentUserDoc = await experimentUserService.getOriginalUserDoc(experimentUsers[4].id, new UpgradeLogger());
  // log data for 5th user with null values:
  await experimentAssignmentService.dataLog(
    experimentUsers[4].id,
    [
      {
        timestamp: new Date().toISOString(),
        metrics: {
          attributes: {
            totalProblemsCompleted: null,
          },
          groupedMetrics: [
            {
              groupClass: 'masteryWorkspace',
              groupKey: 'calculating_area_figures',
              groupUniquifier: '1',
              attributes: {
                timeSeconds: null,
                completion: null,
              },
            },
          ],
        },
      },
    ],
    { logger: new UpgradeLogger(), userDoc: experimentUserDoc }
  );

  const allQuery = await queryService.find(new UpgradeLogger());
  expect(allQuery).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        name: 'query',
        query: { operationType: OPERATION_TYPES.SUM },
        metric: expect.objectContaining({
          key: 'totalProblemsCompleted',
          type: 'continuous',
          allowedData: null,
        }),
      }),
      expect.objectContaining({
        name: 'query',
        query: { operationType: OPERATION_TYPES.AVERAGE },
        metric: expect.objectContaining({
          key: 'totalProblemsCompleted',
          type: 'continuous',
          allowedData: null,
        }),
      }),
      expect.objectContaining({
        name: 'query',
        query: { operationType: OPERATION_TYPES.COUNT },
        metric: expect.objectContaining({
          key: 'totalProblemsCompleted',
          type: 'continuous',
          allowedData: null,
        }),
      }),
      expect.objectContaining({
        name: 'query',
        query: { operationType: OPERATION_TYPES.MAX },
        metric: expect.objectContaining({
          key: 'totalProblemsCompleted',
          type: 'continuous',
          allowedData: null,
        }),
      }),
      expect.objectContaining({
        name: 'query',
        query: { operationType: OPERATION_TYPES.MIN },
        metric: expect.objectContaining({
          key: 'totalProblemsCompleted',
          type: 'continuous',
          allowedData: null,
        }),
      }),
      expect.objectContaining({
        name: 'query',
        query: { operationType: OPERATION_TYPES.MEDIAN },
        metric: expect.objectContaining({
          key: 'totalProblemsCompleted',
          type: 'continuous',
          allowedData: null,
        }),
      }),
      expect.objectContaining({
        name: 'query',
        query: { operationType: OPERATION_TYPES.MODE },
        metric: expect.objectContaining({
          key: 'totalProblemsCompleted',
          type: 'continuous',
          allowedData: null,
        }),
      }),
      expect.objectContaining({
        name: 'query',
        query: { operationType: OPERATION_TYPES.STDEV },
        metric: expect.objectContaining({
          key: 'totalProblemsCompleted',
          type: 'continuous',
          allowedData: null,
        }),
      }),
      expect.objectContaining({
        name: 'query',
        query: { operationType: OPERATION_TYPES.SUM },
        metric: expect.objectContaining({
          key: `masteryWorkspace${METRICS_JOIN_TEXT}calculating_area_figures${METRICS_JOIN_TEXT}timeSeconds`,
          type: 'continuous',
        }),
      }),
      expect.objectContaining({
        name: 'query',
        query: { operationType: OPERATION_TYPES.AVERAGE },
        metric: expect.objectContaining({
          key: `masteryWorkspace${METRICS_JOIN_TEXT}calculating_area_figures${METRICS_JOIN_TEXT}timeSeconds`,
          type: 'continuous',
        }),
      }),
      expect.objectContaining({
        name: 'query',
        query: { operationType: OPERATION_TYPES.COUNT },
        metric: expect.objectContaining({
          key: `masteryWorkspace${METRICS_JOIN_TEXT}calculating_area_figures${METRICS_JOIN_TEXT}timeSeconds`,
          type: 'continuous',
        }),
      }),
      expect.objectContaining({
        name: 'query',
        query: { operationType: OPERATION_TYPES.MAX },
        metric: expect.objectContaining({
          key: `masteryWorkspace${METRICS_JOIN_TEXT}calculating_area_figures${METRICS_JOIN_TEXT}timeSeconds`,
          type: 'continuous',
        }),
      }),
      expect.objectContaining({
        name: 'query',
        query: { operationType: OPERATION_TYPES.MIN },
        metric: expect.objectContaining({
          key: `masteryWorkspace${METRICS_JOIN_TEXT}calculating_area_figures${METRICS_JOIN_TEXT}timeSeconds`,
          type: 'continuous',
        }),
      }),
      expect.objectContaining({
        name: 'query',
        query: { operationType: OPERATION_TYPES.MEDIAN },
        metric: expect.objectContaining({
          key: `masteryWorkspace${METRICS_JOIN_TEXT}calculating_area_figures${METRICS_JOIN_TEXT}timeSeconds`,
          type: 'continuous',
        }),
      }),
      expect.objectContaining({
        name: 'query',
        query: { operationType: OPERATION_TYPES.MODE },
        metric: expect.objectContaining({
          key: `masteryWorkspace${METRICS_JOIN_TEXT}calculating_area_figures${METRICS_JOIN_TEXT}timeSeconds`,
          type: 'continuous',
        }),
      }),
      expect.objectContaining({
        name: 'query',
        query: { operationType: OPERATION_TYPES.STDEV },
        metric: expect.objectContaining({
          key: `masteryWorkspace${METRICS_JOIN_TEXT}calculating_area_figures${METRICS_JOIN_TEXT}timeSeconds`,
          type: 'continuous',
        }),
      }),

      expect.objectContaining({
        name: 'query',
        query: { operationType: OPERATION_TYPES.COUNT },
        metric: expect.objectContaining({
          key: `masteryWorkspace${METRICS_JOIN_TEXT}calculating_area_figures${METRICS_JOIN_TEXT}completion`,
          type: 'categorical',
          allowedData: ['GRADUATED', 'PROMOTED'],
        }),
      }),

      expect.objectContaining({
        name: 'query',
        query: { operationType: OPERATION_TYPES.PERCENTAGE, compareFn: '=', compareValue: 'GRADUATED' },
        metric: expect.objectContaining({
          key: `masteryWorkspace${METRICS_JOIN_TEXT}calculating_area_figures${METRICS_JOIN_TEXT}completion`,
          type: 'categorical',
          allowedData: ['GRADUATED', 'PROMOTED'],
        }),
      }),
    ])
  );

  // Test results
  for (let i = 0; i < allQuery.length; i++) {
    const query = allQuery[i];
    const queryResult = await queryService.analyze([query.id], new UpgradeLogger());
    const res = reduceResult(queryResult[0].mainEffect);
    let expectedValue;
    // Used for console output

    switch (query.query.operationType) {
      case OPERATION_TYPES.SUM: {
        const sum = res.reduce((accu, data) => {
          return accu + data;
        }, 0);
        expectedValue = 370;
        if (query.metric.key !== 'totalProblemsCompleted') {
          expectedValue = 1100; // For completion metric
        }
        expect(sum).toEqual(expectedValue);
        break;
      }
      case OPERATION_TYPES.MIN: {
        const minValue = Math.min(...res);
        expectedValue = 20;
        if (query.metric.key !== 'totalProblemsCompleted') {
          expectedValue = 100; // For completion metric
        }
        expect(minValue).toEqual(expectedValue);
        break;
      }
      case OPERATION_TYPES.MAX: {
        const maxValue = Math.max(...res);
        expectedValue = 200;
        if (query.metric.key !== 'totalProblemsCompleted') {
          expectedValue = 500; // For completion metric
        }
        expect(maxValue).toEqual(expectedValue);
        break;
      }
      // Can not check exact values for below operations
      case OPERATION_TYPES.COUNT:
        const countValue = res.reduce((accu, data) => {
          return accu + data;
        }, 0);
        expectedValue = 4;
        if(query.metric.type === 'categorical'){
          expectedValue = 5; // For completion metric
        }
        expect(countValue).toEqual(expectedValue);
        break;
      case OPERATION_TYPES.AVERAGE:
        const aveValue = (res.reduce((accu, data) => {
          return accu + data;
        }, 0))/res.length;
        expectedValue = 128;
        if (query.metric.key !== 'totalProblemsCompleted') {
          expectedValue = 250; // For completion metric
        }
        expect(aveValue).toEqual(expectedValue);
        break;
      case OPERATION_TYPES.MODE:
        const modeValue = res[1];
        expectedValue = 20;
        if (query.metric.key !== 'totalProblemsCompleted') {
          expectedValue = 100; // For completion metric
        }
        expect(modeValue).toEqual(expectedValue);
        break;
      case OPERATION_TYPES.MEDIAN:
        const medianValue = res[1];
        expectedValue = 50;
        if (query.metric.key !== 'totalProblemsCompleted') {
          expectedValue = 300; // For completion metric
        }
        expect(medianValue).toEqual(expectedValue);
        break;
      case OPERATION_TYPES.STDEV:
        const stdValue = res[1];
        expectedValue = 40;
        if (query.metric.key !== 'totalProblemsCompleted') {
          expectedValue = 200; // For completion metric
        }
        expect(stdValue).toEqual(expectedValue);
        break;
      case OPERATION_TYPES.PERCENTAGE:
        const perValue = res[1];
        expectedValue = 33;
        expect(perValue).toEqual(expectedValue);
        break;
      default:
        break;
    }
  }
}

function makeQuery(
  metric: string,
  operationType: OPERATION_TYPES,
  experimentId: string,
  repeatedMeasure: REPEATED_MEASURE = REPEATED_MEASURE.mostRecent
): any {
  return {
    name: 'query',
    query: {
      operationType,
    },
    metric: {
      key: metric,
    },
    experimentId,
    repeatedMeasure,
  };
}

function reduceResult(result: any): number[] {
  const resultSet = [];
  result.forEach((data) => {
    resultSet.push(parseInt(data.result, 10));
  });
  return resultSet;
}
