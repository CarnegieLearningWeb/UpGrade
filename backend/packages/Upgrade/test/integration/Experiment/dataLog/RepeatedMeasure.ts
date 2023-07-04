import Container from 'typedi';
import { ExperimentService } from '../../../../src/api/services/ExperimentService';
import { ExperimentAssignmentService } from '../../../../src/api/services/ExperimentAssignmentService';
import { individualAssignmentExperiment } from '../../mockData/experiment/index';
import { UserService } from '../../../../src/api/services/UserService';
import { getRepository } from 'typeorm';
import { MetricService, METRICS_JOIN_TEXT } from '../../../../src/api/services/MetricService';
import { SettingService } from '../../../../src/api/services/SettingService';
import { QueryService } from '../../../../src/api/services/QueryService';
import { systemUser } from '../../mockData/user/index';
import { Metric } from '../../../../src/api/models/Metric';
import { metrics } from '../../mockData/metric/index';
import { EXPERIMENT_STATE, IMetricMetaData, OPERATION_TYPES, REPEATED_MEASURE } from 'upgrade_types';
import { checkMarkExperimentPointForUser, getAllExperimentCondition, markExperimentPoint } from '../../utils';
import { checkExperimentAssignedIsNotDefault } from '../../utils/index';
import { experimentUsers } from '../../mockData/experimentUsers/index';
import { Log } from '../../../../src/api/models/Log';
import { UpgradeLogger } from '../../../../src/lib/logger/UpgradeLogger';
import { ExperimentUserService } from '../../../../src/api/services/ExperimentUserService';

export default async function RepeatedMeasure(): Promise<void> {
  const experimentService = Container.get<ExperimentService>(ExperimentService);
  const experimentAssignmentService = Container.get<ExperimentAssignmentService>(ExperimentAssignmentService);
  const experimentUserService = Container.get<ExperimentUserService>(ExperimentUserService);
  let experimentObject = individualAssignmentExperiment;
  const userService = Container.get<UserService>(UserService);
  const metricRepository = getRepository(Metric);
  const metricService = Container.get<MetricService>(MetricService);
  const settingService = Container.get<SettingService>(SettingService);
  const queryService = Container.get<QueryService>(QueryService);
  const logRepository = getRepository(Log);

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

  const findMetric = await metricRepository.find();
  expect(findMetric.length).toEqual(36);
  expect(findMetric).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        key: `totalTimeSeconds`,
        type: IMetricMetaData.CONTINUOUS,
      }),
      expect.objectContaining({
        key: `totalMasteryWorkspacesCompleted`,
        type: IMetricMetaData.CONTINUOUS,
      }),
      expect.objectContaining({
        key: `totalConceptBuildersCompleted`,
        type: IMetricMetaData.CONTINUOUS,
      }),
      expect.objectContaining({
        key: `totalMasteryWorkspacesGraduated`,
        type: IMetricMetaData.CONTINUOUS,
      }),
      expect.objectContaining({
        key: `totalSessionsCompleted`,
        type: IMetricMetaData.CONTINUOUS,
      }),
      expect.objectContaining({
        key: `totalProblemsCompleted`,
        type: IMetricMetaData.CONTINUOUS,
      }),

      expect.objectContaining({
        key: `masteryWorkspace${METRICS_JOIN_TEXT}calculating_area_figures${METRICS_JOIN_TEXT}timeSeconds`,
        type: IMetricMetaData.CONTINUOUS,
      }),
      expect.objectContaining({
        key: `masteryWorkspace${METRICS_JOIN_TEXT}calculating_area_figures${METRICS_JOIN_TEXT}hintCount`,
        type: IMetricMetaData.CONTINUOUS,
      }),
      expect.objectContaining({
        key: `masteryWorkspace${METRICS_JOIN_TEXT}calculating_area_figures${METRICS_JOIN_TEXT}errorCount`,
        type: IMetricMetaData.CONTINUOUS,
      }),
      expect.objectContaining({
        key: `masteryWorkspace${METRICS_JOIN_TEXT}calculating_area_figures${METRICS_JOIN_TEXT}completionCount`,
        type: IMetricMetaData.CONTINUOUS,
      }),
      expect.objectContaining({
        key: `masteryWorkspace${METRICS_JOIN_TEXT}calculating_area_figures${METRICS_JOIN_TEXT}problemsCompleted`,
        type: IMetricMetaData.CONTINUOUS,
      }),
      expect.objectContaining({
        key: `masteryWorkspace${METRICS_JOIN_TEXT}calculating_area_figures${METRICS_JOIN_TEXT}workspaceCompletionStatus`,
        type: IMetricMetaData.CATEGORICAL,
        allowedData: ['GRADUATED', 'PROMOTED'],
      }),

      expect.objectContaining({
        key: `conceptBuilderWorkspace${METRICS_JOIN_TEXT}adding_and_subtracting_decimals${METRICS_JOIN_TEXT}timeSeconds`,
        type: IMetricMetaData.CONTINUOUS,
      }),
      expect.objectContaining({
        key: `conceptBuilderWorkspace${METRICS_JOIN_TEXT}adding_and_subtracting_decimals${METRICS_JOIN_TEXT}hintCount`,
        type: IMetricMetaData.CONTINUOUS,
      }),
      expect.objectContaining({
        key: `conceptBuilderWorkspace${METRICS_JOIN_TEXT}adding_and_subtracting_decimals${METRICS_JOIN_TEXT}errorCount`,
        type: IMetricMetaData.CONTINUOUS,
      }),
      expect.objectContaining({
        key: `conceptBuilderWorkspace${METRICS_JOIN_TEXT}adding_and_subtracting_decimals${METRICS_JOIN_TEXT}completionCount`,
        type: IMetricMetaData.CONTINUOUS,
      }),
    ])
  );

  const masteryWorkspaceFiguresTimeSecondsSumLatest = makeQuery(
    `masteryWorkspace${METRICS_JOIN_TEXT}calculating_area_various_figures${METRICS_JOIN_TEXT}timeSeconds`,
    OPERATION_TYPES.SUM,
    experiments[0].id,
    REPEATED_MEASURE.mostRecent
  );

  const masteryWorkspaceFiguresTimeSecondsSumEarliest = makeQuery(
    `masteryWorkspace${METRICS_JOIN_TEXT}calculating_area_various_figures${METRICS_JOIN_TEXT}timeSeconds`,
    OPERATION_TYPES.SUM,
    experiments[0].id,
    REPEATED_MEASURE.earliest
  );

  const masteryWorkspaceFiguresTimeSecondsSumMean = makeQuery(
    `masteryWorkspace${METRICS_JOIN_TEXT}calculating_area_various_figures${METRICS_JOIN_TEXT}timeSeconds`,
    OPERATION_TYPES.SUM,
    experiments[0].id,
    REPEATED_MEASURE.mean
  );

  experimentObject = {
    ...experimentObject,
    queries: [
      masteryWorkspaceFiguresTimeSecondsSumLatest,
      masteryWorkspaceFiguresTimeSecondsSumEarliest,
      masteryWorkspaceFiguresTimeSecondsSumMean,
    ],
  };

  await experimentService.update(experimentObject as any, user, new UpgradeLogger());

  const experimentUser = experimentUsers[0];

  let timestamp = new Date().toISOString();
  let jsonData: any = [
    {
      timestamp,
      metrics: {
        groupedMetrics: [
          {
            groupClass: 'masteryWorkspace',
            groupKey: 'calculating_area_various_figures',
            groupUniquifier: '1',
            attributes: {
              timeSeconds: 10,
            },
          },
        ],
      },
    },
  ];
  // getOriginalUserDoc
  let experimentUserDoc = await experimentUserService.getOriginalUserDoc(experimentUser.id, new UpgradeLogger());
  // log data here
  await experimentAssignmentService.dataLog(experimentUser.id, jsonData, {
    logger: new UpgradeLogger(),
    userDoc: experimentUserDoc,
  });

  let logData = await logRepository.find({
    relations: ['metrics'],
  });

  expect(logData.length).toEqual(1);
  expect(logData).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        uniquifier: '1',
        timeStamp: new Date(timestamp),
        data: {
          masteryWorkspace: {
            calculating_area_various_figures: {
              timeSeconds: 10,
            },
          },
        },
      }),
    ])
  );

  timestamp = new Date().toISOString();
  jsonData = [
    {
      timestamp,
      metrics: {
        groupedMetrics: [
          {
            groupClass: 'masteryWorkspace',
            groupKey: 'calculating_area_various_figures',
            groupUniquifier: '2',
            attributes: {
              timeSeconds: 20,
            },
          },
        ],
      },
    },
  ];

  // log data here
  await experimentAssignmentService.dataLog(experimentUser.id, jsonData, {
    logger: new UpgradeLogger(),
    userDoc: experimentUserDoc,
  });

  logData = await logRepository.find({
    relations: ['metrics'],
  });
  expect(logData.length).toEqual(2);

  const queries = await queryService.find(new UpgradeLogger());
  // now do the query
  let queryResult = await queryService.analyze([queries[0].id], new UpgradeLogger());
  expect(parseInt(queryResult[0].mainEffect[0].result, 10)).toEqual(20);

  queryResult = await queryService.analyze([queries[1].id], new UpgradeLogger());
  expect(parseInt(queryResult[0].mainEffect[0].result, 10)).toEqual(10);

  queryResult = await queryService.analyze([queries[2].id], new UpgradeLogger());
  expect(parseInt(queryResult[0].mainEffect[0].result, 10)).toEqual(15);

  // create log for second user
  timestamp = new Date().toISOString();
  jsonData = [
    {
      timestamp,
      metrics: {
        groupedMetrics: [
          {
            groupClass: 'masteryWorkspace',
            groupKey: 'calculating_area_various_figures',
            groupUniquifier: '1',
            attributes: {
              timeSeconds: 10,
            },
          },
        ],
      },
    },
  ];
  // getOriginalUserDoc
  experimentUserDoc = await experimentUserService.getOriginalUserDoc(experimentUsers[1].id, new UpgradeLogger());
  await experimentAssignmentService.dataLog(experimentUsers[1].id, jsonData, {
    logger: new UpgradeLogger(),
    userDoc: experimentUserDoc,
  });

  logData = await logRepository.find({
    relations: ['metrics'],
  });
  expect(logData.length).toEqual(3);

  queryResult = await queryService.analyze([queries[0].id], new UpgradeLogger());
  let totalSum = queryResult[0].mainEffect.reduce((acc, { result }) => {
    return acc + parseInt(result, 10);
  }, 0);
  expect(parseInt(totalSum, 10)).toEqual(30);

  queryResult = await queryService.analyze([queries[1].id], new UpgradeLogger());
  totalSum = queryResult[0].mainEffect.reduce((acc, { result }) => {
    return acc + parseInt(result, 10);
  }, 0);
  expect(parseInt(totalSum, 10)).toEqual(20);

  queryResult = await queryService.analyze([queries[2].id], new UpgradeLogger());
  totalSum = queryResult[0].mainEffect.reduce((acc, { result }) => {
    return acc + parseInt(result, 10);
  }, 0);
  expect(parseInt(totalSum, 10)).toEqual(25);

  // create log for second user
  timestamp = new Date().toISOString();
  jsonData = [
    {
      timestamp,
      metrics: {
        groupedMetrics: [
          {
            groupClass: 'masteryWorkspace',
            groupKey: 'calculating_area_various_figures',
            groupUniquifier: '2',
            attributes: {
              timeSeconds: 20,
            },
          },
        ],
      },
    },
  ];

  await experimentAssignmentService.dataLog(experimentUsers[1].id, jsonData, {
    logger: new UpgradeLogger(),
    userDoc: experimentUserDoc,
  });
  queryResult = await queryService.analyze([queries[0].id], new UpgradeLogger());
  totalSum = queryResult[0].mainEffect.reduce((acc, { result }) => {
    return acc + parseInt(result, 10);
  }, 0);
  expect(parseInt(totalSum, 10)).toEqual(40);

  queryResult = await queryService.analyze([queries[1].id], new UpgradeLogger());
  totalSum = queryResult[0].mainEffect.reduce((acc, { result }) => {
    return acc + parseInt(result, 10);
  }, 0);
  expect(parseInt(totalSum, 10)).toEqual(20);

  queryResult = await queryService.analyze([queries[2].id], new UpgradeLogger());
  totalSum = queryResult[0].mainEffect.reduce((acc, { result }) => {
    return acc + parseInt(result, 10);
  }, 0);
  expect(parseInt(totalSum, 10)).toEqual(30);
}

function makeQuery(
  metric: string,
  operationType: OPERATION_TYPES,
  experimentId: string,
  repeatedMeasure: REPEATED_MEASURE
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
