import Container from 'typedi';
import { getRepository } from 'typeorm';
import { Metric } from '../../../../src/api/models/Metric';
import { MetricService, METRICS_JOIN_TEXT } from '../../../../src/api/services/MetricService';
import { SettingService } from '../../../../src/api/services/SettingService';
import { Log } from '../../../../src/api/models/Log';
import { ExperimentAssignmentService } from '../../../../src/api/services/ExperimentAssignmentService';
import { experimentUsers } from '../../mockData/experimentUsers/index';
import { IMetricMetaData, OPERATION_TYPES, EXPERIMENT_STATE } from 'upgrade_types';
import { UserService } from '../../../../src/api/services/UserService';
import { systemUser } from '../../mockData/user/index';
import { individualAssignmentExperiment } from '../../mockData/experiment/index';
import { ExperimentService } from '../../../../src/api/services/ExperimentService';
import { QueryService } from '../../../../src/api/services/QueryService';
import { Query } from '../../../../src/api/models/Query';

export default async function CreateLog(): Promise<void> {
  const metricRepository = getRepository(Metric);
  const experimentAssignmentService = Container.get<ExperimentAssignmentService>(ExperimentAssignmentService);
  const metricService = Container.get<MetricService>(MetricService);
  const settingService = Container.get<SettingService>(SettingService);
  const queryService = Container.get<QueryService>(QueryService);
  const queryRepository = getRepository(Query);
  const logRepository = getRepository(Log);
  const userService = Container.get<UserService>(UserService);
  const experimentService = Container.get<ExperimentService>(ExperimentService);

  await settingService.setClientCheck(false, true);

  // create an experiment
  // creating new user
  const user = await userService.create(systemUser as any);

  // experiment object
  const experimentObject = individualAssignmentExperiment;

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

  // create metrics service
  const metricUnit = [
    {
      key: 'time',
      children: [],
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
  expect(findMetric).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        key: `w${METRICS_JOIN_TEXT}time`,
        type: IMetricMetaData.CONTINUOUS,
      }),
      expect.objectContaining({
        key: `time`,
        type: IMetricMetaData.CONTINUOUS,
      }),
      expect.objectContaining({
        key: `w${METRICS_JOIN_TEXT}completion`,
        type: IMetricMetaData.CATEGORICAL,
        allowedData: ['InProgress', 'Complete'],
      }),
    ])
  );

  // create log
  const experimentUser = experimentUsers[0];
  let jsonData: any = {
    w: { time: 200, completion: 50, name: 'Vivek' },
  };

  // log data here
  await experimentAssignmentService.dataLog(experimentUser.id, jsonData);

  let logData = await logRepository.find({
    relations: ['metrics'],
  });

  expect(logData.length).toEqual(0);

  // create a query for the metrics
  let query = {
    name: 'timeAverage',
    query: {
      operationType: OPERATION_TYPES.AVERAGE,
    },
    metric: `w${METRICS_JOIN_TEXT}time`,
    experimentId: experiments[0].id,
  };

  const timeQuery = await queryService.saveQuery(query.query, query.metric, query.experimentId);

  jsonData = {
    w: { time: 200, completion: 50, name: 'Vivek' },
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
        data: { w: { time: 200 } },
        metrics: expect.arrayContaining([
          expect.objectContaining({
            key: `w${METRICS_JOIN_TEXT}time`,
          }),
        ]),
      }),
    ])
  );

  // create a query for the metrics
  query = {
    name: 'completionAverage',
    query: {
      operationType: OPERATION_TYPES.AVERAGE,
    },
    metric: `w${METRICS_JOIN_TEXT}completion`,
    experimentId: experiments[0].id,
  };

  const completionQuery = await queryService.saveQuery(query.query, query.metric, query.experimentId);

  jsonData = { w: { time: 200, completion: 'InProgress' } };

  // log data here
  await experimentAssignmentService.dataLog(experimentUser.id, jsonData);

  logData = await logRepository.find({
    relations: ['metrics'],
  });

  // check for log data created and metrics relation
  expect(logData).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        data: { w: { time: 200, completion: 'InProgress' } },
        metrics: expect.arrayContaining([
          expect.objectContaining({
            key: `w${METRICS_JOIN_TEXT}time`,
          }),
          expect.objectContaining({
            key: `w${METRICS_JOIN_TEXT}completion`,
          }),
        ]),
      }),
    ])
  );

  // adding different string in categorical data
  // adding string in continuous data
  jsonData = {
    w: { time: '300', completion: 'In Progress', name: 'Sita' },
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
        data: { w: { time: 300 } },
        metrics: expect.arrayContaining([
          expect.objectContaining({
            key: `w${METRICS_JOIN_TEXT}time`,
          }),
        ]),
      }),
    ])
  );

  experiments = await experimentService.find();

  const indexToRemove = experiments[0].queries.findIndex((queryDoc) => {
    return queryDoc.id === timeQuery.id;
  });
  experiments[0].queries.splice(indexToRemove, 1);

  await experimentService.update(experiments[0].id, experiments[0], user);

  // check all logs for time metrics is deleted
  logData = await logRepository.find({
    relations: ['metrics'],
  });

  expect(logData.length).toEqual(1);

  // Also remove relationship of metrics when query deletes
  // check for log data created and metrics relation
  expect(logData).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        data: { w: { time: 200, completion: 'InProgress' } },
        metrics: expect.arrayContaining([
          expect.objectContaining({
            key: `w${METRICS_JOIN_TEXT}time`,
          }),
          expect.objectContaining({
            key: `w${METRICS_JOIN_TEXT}completion`,
          }),
        ]),
      }),
    ])
  );

  // remove all queries
  experiments[0].queries = [];
  await experimentService.update(experiments[0].id, experiments[0], user);

  // check all logs for time metrics is deleted
  logData = await logRepository.find({
    relations: ['metrics'],
  });

  expect(logData.length).toEqual(0);
}
