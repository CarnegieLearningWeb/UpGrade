import Container from 'typedi';
import { ExperimentService } from '../../../../src/api/services/ExperimentService';
import { individualAssignmentExperiment } from '../../mockData/experiment/index';
import { UserService } from '../../../../src/api/services/UserService';
import { getRepository } from 'typeorm';
import { Metric } from '../../../../src/api/models/Metric';
import { Log } from '../../../../src/api/models/Log';
import { systemUser } from '../../mockData/user/index';
import { ExperimentAssignmentService } from '../../../../src/api/services/ExperimentAssignmentService';
import { experimentUsers } from '../../mockData/experimentUsers/index';
import { EXPERIMENT_STATE, OPERATION_TYPES } from 'upgrade_types';
import { getAllExperimentCondition } from '../../utils';
import { checkExperimentAssignedIsNotDefault } from '../../utils/index';
import { DataLogService } from '../../../../src/api/services/DataLogService';
import { MetricService } from '../../../../src/api/services/MetricService';
import { SettingService } from '../../../../src/api/services/SettingService';
import { QueryService } from '../../../../src/api/services/QueryService';

export default async function CreateLog(): Promise<void> {
  const experimentService = Container.get<ExperimentService>(ExperimentService);
  const experimentAssignmentService = Container.get<ExperimentAssignmentService>(ExperimentAssignmentService);
  const experimentObject = individualAssignmentExperiment;
  const userService = Container.get<UserService>(UserService);
  const metricRepository = getRepository(Metric);
  const metricService = Container.get<MetricService>(MetricService);
  const settingService = Container.get<SettingService>(SettingService);
  const queryService = Container.get<QueryService>(QueryService);
  const logRepository = getRepository(Log);
  const logDataService = Container.get<DataLogService>(DataLogService);

  const user = await userService.create(systemUser as any);

  // create experiment
  await experimentService.create(experimentObject as any, user);
  let experiments = await experimentService.find();
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

  const experimentName = experimentObject.partitions[0].expId;
  const experimentPoint = experimentObject.partitions[0].expPoint;

  await settingService.setClientCheck(false, true);

  const metricUnit = [
    {
      key: 'time',
      metadata: {
        type: 'continuous',
      },
    },
    {
      key: 'w',
      children: [
        {
          key: 'time',
          metadata: {
            type: 'continuous',
          },
        },
        {
          key: 'completion',
          metadata: {
            type: 'categorical',
          },
          allowedData: ['InProgress', 'Complete'],
        },
      ],
    },
  ];

  await metricService.saveAllMetrics(metricUnit as any);

  const findMetric = await metricRepository.find();
  expect(findMetric.length).toEqual(3);

  // change experiment status to Enrolling
  const experimentId = experiments[0].id;
  await experimentService.updateState(experimentId, EXPERIMENT_STATE.ENROLLING, user);

  // fetch experiment
  experiments = await experimentService.find();
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

  // get all experiment condition for user 1
  let experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[0].id);
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName, experimentPoint);

  // get all experiment condition for user 2
  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[1].id);
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName, experimentPoint);

  // get all experiment condition for user 3
  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[2].id);
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName, experimentPoint);

  // get all experiment condition for user 4
  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[3].id);
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName, experimentPoint);

  // log data here
  await experimentAssignmentService.dataLog(experimentUsers[0].id, {
    time: 20,
    w: { time: 0, completion: 100 },
  });

  await experimentAssignmentService.dataLog(experimentUsers[1].id, { time: 200, w: { time: 20, completion: 200 } });

  await experimentAssignmentService.dataLog(experimentUsers[2].id, { time: 100, w: { time: 40, completion: 300 } });

  await experimentAssignmentService.dataLog(experimentUsers[3].id, { time: 50, w: { time: 60, completion: 400 } });

  await experimentAssignmentService.dataLog(experimentUsers[3].id, { time: 50, w: { time: 60, completion: 500 } });

  // Save queries for various operations
  const querySum = makeQuery('time', OPERATION_TYPES.SUM, experiments[0].id);
  await queryService.saveQuery(querySum.query, querySum.metric, querySum.experimentId);

  const queryMin = makeQuery('time', OPERATION_TYPES.MIN, experiments[0].id);
  await queryService.saveQuery(queryMin.query, queryMin.metric, queryMin.experimentId);

  const queryMax = makeQuery('time', OPERATION_TYPES.MAX, experiments[0].id);
  await queryService.saveQuery(queryMax.query, queryMax.metric, queryMax.experimentId);

  const queryAvg = makeQuery('time', OPERATION_TYPES.AVERAGE, experiments[0].id);
  await queryService.saveQuery(queryAvg.query, queryAvg.metric, queryAvg.experimentId);

  const queryCount = makeQuery('time', OPERATION_TYPES.COUNT, experiments[0].id);
  await queryService.saveQuery(queryCount.query, queryCount.metric, queryCount.experimentId);

  const queryMode = makeQuery('time', OPERATION_TYPES.MODE, experiments[0].id);
  await queryService.saveQuery(queryMode.query, queryMode.metric, queryMode.experimentId);

  const queryMedian = makeQuery('time', OPERATION_TYPES.MEDIAN, experiments[0].id);
  await queryService.saveQuery(queryMedian.query, queryMedian.metric, queryMedian.experimentId);

  const queryStddev = makeQuery('time', OPERATION_TYPES.STDEV, experiments[0].id);
  await queryService.saveQuery(queryStddev.query, queryStddev.metric, queryStddev.experimentId);

  // Deep state qeuries
  const deepQuerySum = makeQuery('w@__@completion', OPERATION_TYPES.SUM, experiments[0].id);
  await queryService.saveQuery(deepQuerySum.query, deepQuerySum.metric, deepQuerySum.experimentId);

  const deepQueryMin = makeQuery('w@__@completion', OPERATION_TYPES.MIN, experiments[0].id);
  await queryService.saveQuery(deepQueryMin.query, deepQueryMin.metric, deepQueryMin.experimentId);

  const deepQueryMax = makeQuery('w@__@completion', OPERATION_TYPES.MAX, experiments[0].id);
  await queryService.saveQuery(deepQueryMax.query, deepQueryMax.metric, deepQueryMax.experimentId);

  const deepQueryAvg = makeQuery('w@__@completion', OPERATION_TYPES.AVERAGE, experiments[0].id);
  await queryService.saveQuery(deepQueryAvg.query, deepQueryAvg.metric, deepQueryAvg.experimentId);

  const deepQueryCount = makeQuery('w@__@completion', OPERATION_TYPES.COUNT, experiments[0].id);
  await queryService.saveQuery(deepQueryCount.query, deepQueryCount.metric, deepQueryCount.experimentId);

  const deepQueryMode = makeQuery('w@__@completion', OPERATION_TYPES.MODE, experiments[0].id);
  await queryService.saveQuery(deepQueryMode.query, deepQueryMode.metric, deepQueryMode.experimentId);

  const deepQueryMedian = makeQuery('w@__@completion', OPERATION_TYPES.MEDIAN, experiments[0].id);
  await queryService.saveQuery(deepQueryMedian.query, deepQueryMedian.metric, deepQueryMedian.experimentId);

  const deepQueryStddev = makeQuery('w@__@completion', OPERATION_TYPES.STDEV, experiments[0].id);
  await queryService.saveQuery(deepQueryStddev.query, deepQueryStddev.metric, deepQueryStddev.experimentId);

  const allQuery = await queryService.find();
  expect(allQuery).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        query: { operationType: OPERATION_TYPES.SUM },
        metric: expect.objectContaining({
          key: 'time',
          type: 'continuous',
          allowedData: null,
        }),
      }),
      expect.objectContaining({
        query: { operationType: OPERATION_TYPES.AVERAGE },
        metric: expect.objectContaining({
          key: 'time',
          type: 'continuous',
          allowedData: null,
        }),
      }),
      expect.objectContaining({
        query: { operationType: OPERATION_TYPES.COUNT },
        metric: expect.objectContaining({
          key: 'time',
          type: 'continuous',
          allowedData: null,
        }),
      }),
      expect.objectContaining({
        query: { operationType: OPERATION_TYPES.MAX },
        metric: expect.objectContaining({
          key: 'time',
          type: 'continuous',
          allowedData: null,
        }),
      }),
      expect.objectContaining({
        query: { operationType: OPERATION_TYPES.MIN },
        metric: expect.objectContaining({
          key: 'time',
          type: 'continuous',
          allowedData: null,
        }),
      }),
      expect.objectContaining({
        query: { operationType: OPERATION_TYPES.MEDIAN },
        metric: expect.objectContaining({
          key: 'time',
          type: 'continuous',
          allowedData: null,
        }),
      }),
      expect.objectContaining({
        query: { operationType: OPERATION_TYPES.MODE },
        metric: expect.objectContaining({
          key: 'time',
          type: 'continuous',
          allowedData: null,
        }),
      }),
      expect.objectContaining({
        query: { operationType: OPERATION_TYPES.STDEV },
        metric: expect.objectContaining({
          key: 'time',
          type: 'continuous',
          allowedData: null,
        }),
      }),
      expect.objectContaining({
        query: { operationType: OPERATION_TYPES.SUM },
        metric: expect.objectContaining({
          key: 'w@__@completion',
          type: 'categorical',
          allowedData: ['InProgress', 'Complete'],
        }),
      }),
      expect.objectContaining({
        query: { operationType: OPERATION_TYPES.AVERAGE },
        metric: expect.objectContaining({
          key: 'w@__@completion',
          type: 'categorical',
          allowedData: ['InProgress', 'Complete'],
        }),
      }),
      expect.objectContaining({
        query: { operationType: OPERATION_TYPES.COUNT },
        metric: expect.objectContaining({
          key: 'w@__@completion',
          type: 'categorical',
          allowedData: ['InProgress', 'Complete'],
        }),
      }),
      expect.objectContaining({
        query: { operationType: OPERATION_TYPES.MAX },
        metric: expect.objectContaining({
          key: 'w@__@completion',
          type: 'categorical',
          allowedData: ['InProgress', 'Complete'],
        }),
      }),
      expect.objectContaining({
        query: { operationType: OPERATION_TYPES.MIN },
        metric: expect.objectContaining({
          key: 'w@__@completion',
          type: 'categorical',
          allowedData: ['InProgress', 'Complete'],
        }),
      }),
      expect.objectContaining({
        query: { operationType: OPERATION_TYPES.MEDIAN },
        metric: expect.objectContaining({
          key: 'w@__@completion',
          type: 'categorical',
          allowedData: ['InProgress', 'Complete'],
        }),
      }),
      expect.objectContaining({
        query: { operationType: OPERATION_TYPES.MODE },
        metric: expect.objectContaining({
          key: 'w@__@completion',
          type: 'categorical',
          allowedData: ['InProgress', 'Complete'],
        }),
      }),
      expect.objectContaining({
        query: { operationType: OPERATION_TYPES.STDEV },
        metric: expect.objectContaining({
          key: 'w@__@completion',
          type: 'categorical',
          allowedData: ['InProgress', 'Complete'],
        }),
      }),
    ])
  );

  // Test results
  allQuery.forEach( async (query) => {
    let res;
    // Used for console output
    const consoleString = query.metric.key === 'time' ? query.query.operationType + ' ' : query.query.operationType + ' deep';
    switch (query.query.operationType) {
      case OPERATION_TYPES.SUM:
        res = await queryService.analyse(query.id);
        console.log(consoleString, res);
        break;
      case OPERATION_TYPES.MIN:
        res = await queryService.analyse(query.id);
        console.log(consoleString, res);
        break;
      case OPERATION_TYPES.MAX:
        res = await queryService.analyse(query.id);
        console.log(consoleString, res);
        break;
      case OPERATION_TYPES.COUNT:
        res = await queryService.analyse(query.id);
        console.log(consoleString, res);
        break;
      case OPERATION_TYPES.AVERAGE:
        res = await queryService.analyse(query.id);
        console.log(consoleString, res);
        break;
      case OPERATION_TYPES.MODE:
        res = await queryService.analyse(query.id);
        console.log(consoleString, res);
        break;
      case OPERATION_TYPES.MEDIAN:
        res = await queryService.analyse(query.id);
        console.log(consoleString, res);
        break;
      case OPERATION_TYPES.STDEV:
        res = await queryService.analyse(query.id);
        console.log(consoleString, res);
        break;
      default:
        break;
    }
  });
}

function makeQuery(metric: string, operationType: OPERATION_TYPES, experimentId: string): any {
  return {
    query: {
      operationType,
    },
    metric,
    experimentId,
  };
}
