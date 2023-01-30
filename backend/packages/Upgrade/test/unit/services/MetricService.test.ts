import { MetricService } from '../../../src/api/services/MetricService';
import { Repository } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { IGroupMetric, IMetricMetaData, ISingleMetric } from 'upgrade_types';
import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';
import { SettingService } from '../../../src/api/services/SettingService';
import { MetricRepository } from '../../../src/api/repositories/MetricRepository';
import { SettingRepository } from '../../../src/api/repositories/SettingRepository';

describe('Audit Service Testing', () => {
  let service: MetricService;
  let repo: Repository<MetricRepository>;
  let module: TestingModule;
  const settingRes = [{ id: 'id', toCheckAuth: false, toFilterMetric: true }];

  const simpleMetric: Array<ISingleMetric> = [
    {
      metric: 'totalProblemsCompleted',
      datatype: IMetricMetaData.CONTINUOUS,
    },
  ];

  const groupMetric: Array<IGroupMetric> = [
    {
      groupClass: 'masteryWorkspace',
      allowedKeys: ['calculating_area_figures', 'calculating_area_various_figures'],
      attributes: [
        {
          metric: 'timeSeconds',
          datatype: IMetricMetaData.CONTINUOUS,
        },
      ],
    },
  ];

  const metric = [
    {
      key: 'totalProblemsCompleted',
      type: IMetricMetaData.CONTINUOUS,
      allowedData: [],
      logs: [],
      queries: [],
      createdAt: new Date('2020-1-1'),
      updatedAt: new Date('2020-1-1'),
      versionNumber: 1,
    },
  ];

  const metricResult = [
    {
      key: 'totalProblemsCompleted',
      allowedData: [],
      children: [],
      metadata: {
        type: IMetricMetaData.CONTINUOUS,
      },
    },
  ];

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        MetricService,
        SettingService,
        {
          provide: getRepositoryToken(MetricRepository),
          useValue: {
            find: jest.fn().mockResolvedValue(metric),
            paginatedFind: jest.fn().mockResolvedValue(metric),
            getTotalLogs: jest.fn().mockResolvedValue(metric.length),
            count: jest.fn().mockResolvedValue(metric.length),
            deleteMetricsByKeys: jest.fn().mockResolvedValue(metric),
            getMetricsByKeys: jest.fn().mockResolvedValue(metric),
            save: jest.fn().mockResolvedValue(metric),
          },
        },
        {
          provide: getRepositoryToken(SettingRepository),
          useValue: {
            find: jest.fn().mockResolvedValue(settingRes),
          },
        },
      ],
    }).compile();

    service = module.get<MetricService>(MetricService);
    repo = module.get<Repository<MetricRepository>>(getRepositoryToken(MetricRepository));
  });

  it('should be defined', async () => {
    expect(service).toBeDefined();
  });

  it('should have the repo mocked', async () => {
    expect(await repo.find()).toEqual(metric);
  });

  it('should return all metrics', async () => {
    const res = await service.getAllMetrics(new UpgradeLogger());
    expect(res).toEqual(metricResult);
  });

  it('should save all simple metrics', async () => {
    const res = await service.saveAllMetrics(simpleMetric, new UpgradeLogger());
    expect(res).toEqual(metric);
  });

  it('should save all group metrics', async () => {
    const res = await service.saveAllMetrics(groupMetric, new UpgradeLogger());
    expect(res).toEqual(metric);
  });

  it('should upsert all metrics', async () => {
    const res = await service.upsertAllMetrics(simpleMetric, new UpgradeLogger());
    expect(res).toEqual(metricResult);
  });

  it('should delete a specific metric', async () => {
    const res = await service.deleteMetric('totalProblemsCompleted', new UpgradeLogger());
    expect(res).toEqual(metricResult);
  });

  it('should throw an error when metrics filter not enabled', async () => {
    settingRes[0].toFilterMetric = false;

    expect(async () => {
      await service.saveAllMetrics(groupMetric, new UpgradeLogger());
    }).rejects.toThrow('Metrics filter not enabled');
  });
});
