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
import { metrics } from '../../mockData/metric';
import { UpgradeLogger } from '../../../../src/lib/logger/UpgradeLogger';

export default async function QueryCRUD(): Promise<void> {
  const metricRepository = getRepository(Metric);
  const metricService = Container.get<MetricService>(MetricService);
  const settingService = Container.get<SettingService>(SettingService);
  const queryService = Container.get<QueryService>(QueryService);
  const userService = Container.get<UserService>(UserService);
  const experimentService = Container.get<ExperimentService>(ExperimentService);

  await settingService.setClientCheck(false, true, new UpgradeLogger());

  // create an experiment
  // creating new user
  const user = await userService.upsertUser(systemUser as any, new UpgradeLogger());

  // experiment object
  let experimentObject = individualAssignmentExperiment;

  // create experiment
  await experimentService.create(experimentObject as any, user, new UpgradeLogger());
  const experiments = await experimentService.find(new UpgradeLogger());
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
  await metricService.saveAllMetrics(metrics as any, new UpgradeLogger());

  const findMetric = await metricRepository.find();
  expect(findMetric.length).toEqual(36);

  // three query need to be generated
  const query = {
    name: 'timeAverage',
    query: {
      operationType: OPERATION_TYPES.AVERAGE,
    },
    metric: {
      key: 'totalProblemsCompleted',
    },
    experimentId: experiments[0].id,
  };

  experimentObject = {
    ...experimentObject,
    queries: [query],
  };

  await experimentService.update(experimentObject as any, user, new UpgradeLogger());

  let allQuery = await queryService.find(new UpgradeLogger());
  expect(allQuery).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        query: { operationType: 'avg' },
        metric: expect.objectContaining({
          key: 'totalProblemsCompleted',
          type: 'continuous',
          allowedData: null,
        }),
      }),
    ])
  );

  experimentObject = {
    ...experimentObject,
    queries: [],
  };

  await experimentService.update(experimentObject as any, user, new UpgradeLogger());

  allQuery = await queryService.find(new UpgradeLogger());
  expect(allQuery.length).toEqual(0);
}
