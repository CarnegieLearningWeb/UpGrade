import Container from 'typedi';
import { getRepository } from 'typeorm';
import { Metric } from '../../../../src/api/models/Metric';
import { MetricService } from '../../../../src/api/services/MetricService';
import { SettingService } from '../../../../src/api/services/SettingService';

export default async function MetricCRUD(): Promise<void> {
  const metricRepository = getRepository(Metric);
  const metricService = Container.get<MetricService>(MetricService);
  const settingService = Container.get<SettingService>(SettingService);

  await settingService.setClientCheck(false, true);

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
}
