import Container from 'typedi';
import { getRepository } from 'typeorm';
import { Metric } from '../../../../src/api/models/Metric';
import { MetricService } from '../../../../src/api/services/MetricService';
import { SettingService } from '../../../../src/api/services/SettingService';
import { metrics } from '../../mockData/metric';

export default async function MetricCRUD(): Promise<void> {
  const metricRepository = getRepository(Metric);
  const metricService = Container.get<MetricService>(MetricService);
  const settingService = Container.get<SettingService>(SettingService);

  await settingService.setClientCheck(false, true);

  // create metrics service

  await metricService.saveAllMetrics(metrics as any);

  let findMetric = await metricRepository.find();
  expect(findMetric.length).toEqual(3);

  await metricService.deleteMetric('totalProblemsCompleted');
  findMetric = await metricRepository.find();
  expect(findMetric.length).toEqual(2);
}
