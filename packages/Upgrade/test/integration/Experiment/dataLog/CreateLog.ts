import Container from 'typedi';
import { getRepository } from 'typeorm';
import { Metric } from '../../../../src/api/models/Metric';
import { MetricService, METRICS_JOIN_TEXT } from '../../../../src/api/services/MetricService';
import { SettingService } from '../../../../src/api/services/SettingService';
import { Log } from '../../../../src/api/models/Log';
import { ExperimentAssignmentService } from '../../../../src/api/services/ExperimentAssignmentService';
import { experimentUsers } from '../../mockData/experimentUsers/index';

export default async function CreateLog(): Promise<void> {
  const metricRepository = getRepository(Metric);
  const experimentAssignmentService = Container.get<ExperimentAssignmentService>(ExperimentAssignmentService);
  const metricService = Container.get<MetricService>(MetricService);
  const settingService = Container.get<SettingService>(SettingService);
  const logRepository = getRepository(Log);

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
  expect(findMetric).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        key: `w${METRICS_JOIN_TEXT}time`,
        type: 'continuous',
        allowedData: [],
      }),
      expect.objectContaining({
        key: `time`,
        type: 'continuous',
        allowedData: [],
      }),
      expect.objectContaining({
        key: `w${METRICS_JOIN_TEXT}completion`,
        type: 'categorical',
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

  // check for log data created and metrics relation
  expect(logData).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        data: { w: { time: 200, completion: 50 } },
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

  // switching off filter metrics
  await settingService.setClientCheck(false, false);

  jsonData = {
    p: { time: 200, completion: 50 },
  };

  await experimentAssignmentService.dataLog(experimentUser.id, jsonData);

  logData = await logRepository.find({
    relations: ['metrics'],
  });

  expect(logData).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        data: { p: { time: 200, completion: 50 } },
        metrics: expect.arrayContaining([
          expect.objectContaining({
            key: `p${METRICS_JOIN_TEXT}time`,
          }),
          expect.objectContaining({
            key: `p${METRICS_JOIN_TEXT}completion`,
          }),
        ]),
      }),
    ])
  );
}
