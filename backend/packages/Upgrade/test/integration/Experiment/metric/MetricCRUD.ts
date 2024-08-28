import { Container as tteContainer } from './../../../../src/typeorm-typedi-extensions/Container';
import Container from 'typedi';
import { MetricService } from '../../../../src/api/services/MetricService';
import { SettingService } from '../../../../src/api/services/SettingService';
import { UpgradeLogger } from '../../../../src/lib/logger/UpgradeLogger';
import { metrics } from '../../mockData/metric';
import { MetricRepository } from '../../../../src/api/repositories/MetricRepository';

export default async function MetricCRUD(): Promise<void> {
  const metricRepository = tteContainer.getCustomRepository(MetricRepository);
  const metricService = Container.get<MetricService>(MetricService);
  const settingService = Container.get<SettingService>(SettingService);

  await settingService.setClientCheck(false, true, new UpgradeLogger());

  // create metrics service
  await metricService.saveAllMetrics(metrics as any, ['home'], new UpgradeLogger());

  let findMetric = await metricRepository.find();
  expect(findMetric.length).toEqual(36);

  await metricService.deleteMetric('totalProblemsCompleted', new UpgradeLogger());
  findMetric = await metricRepository.find();
  expect(findMetric.length).toEqual(35);
}
