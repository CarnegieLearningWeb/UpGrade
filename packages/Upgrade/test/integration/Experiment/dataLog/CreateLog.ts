import Container from 'typedi';
import { getRepository } from 'typeorm';
import { Metric } from '../../../../src/api/models/Metric';
import { MetricService, METRICS_JOIN_TEXT } from '../../../../src/api/services/MetricService';
import { SettingService } from '../../../../src/api/services/SettingService';
import { Log } from '../../../../src/api/models/Log';
import { ExperimentAssignmentService } from '../../../../src/api/services/ExperimentAssignmentService';
import { experimentUsers } from '../../mockData/experimentUsers/index';
import { IMetricMetaData, OPERATION_TYPES } from 'upgrade_types';
import { metrics } from '../../mockData/metric';
import { ExperimentService } from '../../../../src/api/services/ExperimentService';
import { individualAssignmentExperiment } from '../../mockData/experiment/index';
import { UserService } from '../../../../src/api/services/UserService';
import { systemUser } from '../../mockData/user/index';

export default async function CreateLog(): Promise<void> {
  const experimentService = Container.get<ExperimentService>(ExperimentService);
  const metricRepository = getRepository(Metric);
  const experimentAssignmentService = Container.get<ExperimentAssignmentService>(ExperimentAssignmentService);
  const metricService = Container.get<MetricService>(MetricService);
  const settingService = Container.get<SettingService>(SettingService);
  let experimentObject: any = individualAssignmentExperiment;
  const userService = Container.get<UserService>(UserService);
  const logRepository = getRepository(Log);

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

  await metricService.saveAllMetrics(metrics as any);

  const findMetric = await metricRepository.find();
  expect(findMetric.length).toEqual(3);
  expect(findMetric).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        key: `masteryWorkspace${METRICS_JOIN_TEXT}calculating_area_figures${METRICS_JOIN_TEXT}timeSeconds`,
        type: IMetricMetaData.CONTINUOUS,
      }),
      expect.objectContaining({
        key: `totalProblemsCompleted`,
        type: IMetricMetaData.CONTINUOUS,
      }),
      expect.objectContaining({
        key: `masteryWorkspace${METRICS_JOIN_TEXT}calculating_area_figures${METRICS_JOIN_TEXT}completion`,
        type: IMetricMetaData.CATEGORICAL,
        allowedData: ['GRADUATED', 'PROMOTED'],
      }),
    ])
  );

  // create log
  const experimentUser = experimentUsers[0];
  let jsonData: any = {
    masteryWorkspace: { calculating_area_figures: { timeSeconds: 200, completion: 50, name: 'Vivek' } },
  };

  // log data here
  await experimentAssignmentService.dataLog(experimentUser.id, jsonData);

  let logData = await logRepository.find({
    relations: ['metrics'],
  });

  expect(logData.length).toEqual(0);

  // create queries for all metrics
  const queryTimeSeconds = makeQuery(
    `masteryWorkspace${METRICS_JOIN_TEXT}calculating_area_figures${METRICS_JOIN_TEXT}timeSeconds`,
    OPERATION_TYPES.SUM,
    experiments[0].id
  );

  experimentObject = {
    ...experimentObject,
    queries: [queryTimeSeconds],
  };

  await experimentService.update(experimentObject.id, experimentObject as any, user);

  jsonData = {
    masteryWorkspace: { calculating_area_figures: { timeSeconds: 200, completion: 50, name: 'Vivek' } },
  };

  // log data here
  await experimentAssignmentService.dataLog(experimentUser.id, jsonData);

  logData = await logRepository.find({
    relations: ['metrics'],
  });

  expect(logData).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        data: { masteryWorkspace: { calculating_area_figures: { timeSeconds: 200 } } },
        metrics: expect.arrayContaining([
          expect.objectContaining({
            key: `masteryWorkspace${METRICS_JOIN_TEXT}calculating_area_figures${METRICS_JOIN_TEXT}timeSeconds`,
          }),
        ]),
      }),
    ])
  );

  await experimentService.update(experimentObject.id, experimentObject as any, user);

  // create queries for all metrics
  const queryProblemsComplete = makeQuery(
    `masteryWorkspace${METRICS_JOIN_TEXT}calculating_area_figures${METRICS_JOIN_TEXT}completion`,
    OPERATION_TYPES.SUM,
    experiments[0].id
  );

  const experiment = await experimentService.find();

  experimentObject = {
    ...experiment[0],
    queries: [...experiment[0].queries, queryProblemsComplete],
  };

  const experimentUpdatedObject = await experimentService.update(experimentObject.id, experimentObject as any, user);

  jsonData = {
    masteryWorkspace: { calculating_area_figures: { timeSeconds: 300, completion: 50, name: 'Vivek' } },
  };

  // log data here
  await experimentAssignmentService.dataLog(experimentUser.id, jsonData);

  logData = await logRepository.find({
    relations: ['metrics'],
  });

  // check for log data created and metrics relation
  expect(logData).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        data: {
          masteryWorkspace: { calculating_area_figures: { timeSeconds: 300 } },
        },
        metrics: expect.arrayContaining([
          expect.objectContaining({
            key: `masteryWorkspace${METRICS_JOIN_TEXT}calculating_area_figures${METRICS_JOIN_TEXT}timeSeconds`,
          }),
        ]),
      }),
    ])
  );

  // // adding string in continuous data
  jsonData = {
    masteryWorkspace: { calculating_area_figures: { timeSeconds: '200', completion: 'GRADUATED', name: 'Sam' } },
  };

  // log data here
  await experimentAssignmentService.dataLog(experimentUser.id, jsonData);

  logData = await logRepository.find({
    relations: ['metrics'],
  });

  // check for log data created and metrics relation
  expect(logData).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        data: { masteryWorkspace: { calculating_area_figures: { timeSeconds: 200, completion: 'GRADUATED' } } },
        metrics: expect.arrayContaining([
          expect.objectContaining({
            key: `masteryWorkspace${METRICS_JOIN_TEXT}calculating_area_figures${METRICS_JOIN_TEXT}timeSeconds`,
          }),
          expect.objectContaining({
            key: `masteryWorkspace${METRICS_JOIN_TEXT}calculating_area_figures${METRICS_JOIN_TEXT}completion`,
          }),
        ]),
      }),
    ])
  );

  // // adding different string in categorical data
  // // adding string in continuous data
  jsonData = {
    masteryWorkspace: { calculating_area_figures: { timeSeconds: '300', completion: 'GRADU ATED', name: 'Sita' } },
  };

  // log data here
  await experimentAssignmentService.dataLog(experimentUser.id, jsonData);

  logData = await logRepository.find({
    relations: ['metrics'],
  });

  // check for log data created and metrics relation
  expect(logData).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        data: { masteryWorkspace: { calculating_area_figures: { timeSeconds: 300 } } },
        metrics: expect.arrayContaining([
          expect.objectContaining({
            key: `masteryWorkspace${METRICS_JOIN_TEXT}calculating_area_figures${METRICS_JOIN_TEXT}timeSeconds`,
          }),
        ]),
      }),
    ])
  );

  // delete queries
  const queryIndex = experimentUpdatedObject.queries.findIndex(({ metric }) => {
    return metric.key === `masteryWorkspace${METRICS_JOIN_TEXT}calculating_area_figures${METRICS_JOIN_TEXT}timeSeconds`;
  });

  experimentUpdatedObject.queries.splice(queryIndex, 1);

  await experimentService.update(experimentObject.id, experimentUpdatedObject as any, user);

  logData = await logRepository.find({
    relations: ['metrics'],
  });

  expect(logData.length).toEqual(1);

  expect(logData).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        data: { masteryWorkspace: { calculating_area_figures: { timeSeconds: 200, completion: 'GRADUATED' } } },
        metrics: expect.arrayContaining([
          expect.objectContaining({
            key: `masteryWorkspace${METRICS_JOIN_TEXT}calculating_area_figures${METRICS_JOIN_TEXT}timeSeconds`,
          }),
          expect.objectContaining({
            key: `masteryWorkspace${METRICS_JOIN_TEXT}calculating_area_figures${METRICS_JOIN_TEXT}completion`,
          }),
        ]),
      }),
    ])
  );

  experimentUpdatedObject.queries = [];
  await experimentService.update(experimentObject.id, experimentUpdatedObject as any, user);

  logData = await logRepository.find({
    relations: ['metrics'],
  });

  expect(logData.length).toEqual(0);
}

function makeQuery(metric: string, operationType: OPERATION_TYPES, experimentId: string): any {
  return {
    name: 'query',
    query: {
      operationType,
    },
    metric: {
      key: metric,
    },
    experimentId,
  };
}
