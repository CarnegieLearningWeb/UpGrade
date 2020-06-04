import Container from 'typedi';
import { getRepository } from 'typeorm';
import { Metric } from '../../../../src/api/models/Metric';
import { MetricService } from '../../../../src/api/services/MetricService';
import { SettingService } from '../../../../src/api/services/SettingService';
import { QueryService } from '../../../../src/api/services/QueryService';
import { OPERATION_TYPES } from 'upgrade_types';
import { UserService } from '../../../../src/api/services/UserService';
import { individualAssignmentExperiment } from '../../mockData/experiment/index';
import { ExperimentService } from '../../../../src/api/services/ExperimentService';
import { systemUser } from '../../mockData/user/index';

export default async function QueryCRUD(): Promise<void> {
  const metricRepository = getRepository(Metric);
  const metricService = Container.get<MetricService>(MetricService);
  const settingService = Container.get<SettingService>(SettingService);
  const queryService = Container.get<QueryService>(QueryService);
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
  const experiments = await experimentService.find();
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

  // create metrics service
  const metricUnit = [
    {
      key: 'time',
      children: [],
      metadata: {
        type: 'continuous',
      },
      allowedData: [],
    },
    {
      key: 'w',
      children: [
        {
          key: 'time',
          children: [],
          metadata: {
            type: 'continuous',
          },
          allowedData: [],
        },
        {
          key: 'completion',
          children: [],
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

  // three query need to be generated
  const query = {
    query: {
      operationType: OPERATION_TYPES.AVERAGE,
    },
    metric: 'time',
    experimentId: experiments[0].id,
  };

  await queryService.saveQuery(query.query, query.metric, query.experimentId);

  const allQuery = await queryService.find();
  expect(allQuery).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        query: { operationType: 'avg' },
        metric: expect.objectContaining({
          key: 'time',
          type: 'continuous',
          allowedData: [],
        }),
      }),
    ])
  );
}
