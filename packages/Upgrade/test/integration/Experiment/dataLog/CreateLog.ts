import Container from 'typedi';
import { getRepository } from 'typeorm';
import { Metric } from '../../../../src/api/models/Metric';
import { MetricService, METRICS_JOIN_TEXT } from '../../../../src/api/services/MetricService';
import { SettingService } from '../../../../src/api/services/SettingService';
import { Log } from '../../../../src/api/models/Log';
import { ExperimentAssignmentService } from '../../../../src/api/services/ExperimentAssignmentService';
import { experimentUsers } from '../../mockData/experimentUsers/index';
import { IMetricMetaData } from 'upgrade_types';

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

  // check for log data created and metrics relation
  expect(logData).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        data: { w: { time: 200 } },
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

  // adding string in continuous data
  jsonData = {
    w: { time: '200', completion: 'InProgress', name: 'Sam' },
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
    p: { time: 200, completion: 200 },
  };

  await experimentAssignmentService.dataLog(experimentUser.id, jsonData);

  logData = await logRepository.find({
    relations: ['metrics'],
  });

  expect(logData).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        data: { p: { time: 200, completion: 200 } },
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

  jsonData = {
    p: { time: 200, completion: 'I am incorrect' },
  };

  await experimentAssignmentService.dataLog(experimentUser.id, jsonData);

  logData = await logRepository.find({
    relations: ['metrics'],
  });

  expect(logData).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        data: { p: { time: 200 } },
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

  jsonData = {
    w: { time: 200, completion: 'I am incorrect', error: 'abc' },
  };

  await experimentAssignmentService.dataLog(experimentUser.id, jsonData);

  logData = await logRepository.find({
    relations: ['metrics'],
  });

  expect(logData).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        data: { w: { time: 200, error: 'abc' } },
        metrics: expect.arrayContaining([
          expect.objectContaining({
            key: `w${METRICS_JOIN_TEXT}time`,
          }),
          expect.objectContaining({
            key: `w${METRICS_JOIN_TEXT}error`,
          }),
        ]),
      }),
    ])
  );
}
