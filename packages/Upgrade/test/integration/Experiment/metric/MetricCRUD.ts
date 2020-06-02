import Container from 'typedi';
import { ExperimentService } from '../../../../src/api/services/ExperimentService';
import { individualExperimentWithMetric } from '../../mockData/experiment/index';
import { UserService } from '../../../../src/api/services/UserService';
import { systemUser } from '../../mockData/user/index';
import { getRepository } from 'typeorm';
import { Metric } from '../../../../src/api/models/Metric';
import { MetricService } from '../../../../src/api/services/MetricService';
import { SettingService } from '../../../../src/api/services/SettingService';

export default async function MetricCRUD(): Promise<void> {
  const experimentService = Container.get<ExperimentService>(ExperimentService);
  const experimentObject = individualExperimentWithMetric;
  const userService = Container.get<UserService>(UserService);
  const metricRepository = getRepository(Metric);
  const metricService = Container.get<MetricService>(MetricService);
  const settingService = Container.get<SettingService>(SettingService);

  const user = await userService.create(systemUser as any);

  await settingService.setClientCheck(false, true);

  // create metrics service
  const metricUnit = [
    {
      key: 'time',
      children: [],
    },
    {
      key: 'w',
      children: [
        {
          key: 'time',
          children: [],
          operations: ['mean', 'count'],
        },
        {
          key: 'completion',
          children: [],
          operations: ['mean'],
        },
      ],
    },
  ];

  await metricService.saveAllMetrics(metricUnit);

  const findMetric = await metricRepository.find();
  expect(findMetric.length).toEqual(3);
}
