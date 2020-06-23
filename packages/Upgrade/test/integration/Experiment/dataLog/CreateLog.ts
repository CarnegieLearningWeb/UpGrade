import Container from 'typedi';
import { getRepository } from 'typeorm';
import { Metric } from '../../../../src/api/models/Metric';
import { MetricService, METRICS_JOIN_TEXT } from '../../../../src/api/services/MetricService';
import { SettingService } from '../../../../src/api/services/SettingService';
import { Log } from '../../../../src/api/models/Log';
import { ExperimentAssignmentService } from '../../../../src/api/services/ExperimentAssignmentService';
import { experimentUsers } from '../../mockData/experimentUsers/index';
import { IMetricMetaData } from 'upgrade_types';
import { metrics } from '../../mockData/metric';

export default async function CreateLog(): Promise<void> {
  const metricRepository = getRepository(Metric);
  const experimentAssignmentService = Container.get<ExperimentAssignmentService>(ExperimentAssignmentService);
  const metricService = Container.get<MetricService>(MetricService);
  const settingService = Container.get<SettingService>(SettingService);
  const logRepository = getRepository(Log);

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

  // check for log data created and metrics relation
  expect(logData).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        data: { masteryWorkspace: { calculating_area_figures: { timeSeconds: 200 } }},
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
        data: { masteryWorkspace: { calculating_area_figures: { timeSeconds: 200, completion: 'GRADUATED' } }},
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
    masteryWorkspace: { calculating_area_figures: { timeSeconds: '300', completion: 'GRADU ATED', name: 'Sita' }},
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
        data: { masteryWorkspace: { calculating_area_figures: { timeSeconds: 300 } }},
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

  // // switching off filter metrics
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
    masteryWorkspace: { calculating_area_figures: { timeSeconds: 200, completion: 'I am incorrect', error: 'abc' }},
  };

  await experimentAssignmentService.dataLog(experimentUser.id, jsonData);

  logData = await logRepository.find({
    relations: ['metrics'],
  });

  expect(logData).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        data: { masteryWorkspace: { calculating_area_figures: { timeSeconds: 200, error: 'abc' } }},
        metrics: expect.arrayContaining([
          expect.objectContaining({
            key: `masteryWorkspace${METRICS_JOIN_TEXT}calculating_area_figures${METRICS_JOIN_TEXT}timeSeconds`,
          }),
          expect.objectContaining({
            key: `masteryWorkspace${METRICS_JOIN_TEXT}calculating_area_figures${METRICS_JOIN_TEXT}error`,
          }),
        ]),
      }),
    ])
  );
}
