import { MetricService, METRICS_JOIN_TEXT } from '../../../src/api/services/MetricService';
import { Repository } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { IGroupMetric, IMetricMetaData, ISingleMetric } from 'upgrade_types';
import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';
import { SettingService } from '../../../src/api/services/SettingService';
import { MetricRepository } from '../../../src/api/repositories/MetricRepository';
import { QueryRepository } from '../../../src/api/repositories/QueryRepository';
import { SettingRepository } from '../../../src/api/repositories/SettingRepository';
import { CacheService } from '../../../src/api/services/CacheService';
import { configureLogger } from '../../utils/logger';

describe('Audit Service Testing', () => {
  let service: MetricService;
  let repo: Repository<MetricRepository>;
  let queryRepositoryMock: { getMetricKeysWithQueries: jest.Mock };
  let module: TestingModule;
  const settingRes = [{ id: 'id', toCheckAuth: false, toFilterMetric: true }];

  const contexts = ['home'];

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
      context: ['home'],
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
      context: ['home'],
      metadata: {
        type: IMetricMetaData.CONTINUOUS,
      },
    },
  ];

  const metricResultWithHasQuery = [
    {
      ...metricResult[0],
      hasQuery: true,
    },
  ];

  beforeAll(() => {
    configureLogger();
  });

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
          provide: getRepositoryToken(QueryRepository),
          useValue: {
            getMetricKeysWithQueries: jest.fn().mockResolvedValue(['totalProblemsCompleted']),
          },
        },
        {
          provide: getRepositoryToken(SettingRepository),
          useValue: {
            find: jest.fn().mockResolvedValue(settingRes),
          },
        },
        {
          // Pass-through, mirroring CacheService's behaviour when CACHING_ENABLED is false. These
          // tests swap the setting repository mock between assertions, so a caching stub would
          // change what they exercise.
          provide: CacheService,
          useValue: {
            wrap: jest.fn((_key: string, fn: () => Promise<unknown>) => fn()),
            delCache: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<MetricService>(MetricService);
    repo = module.get<Repository<MetricRepository>>(getRepositoryToken(MetricRepository));
    queryRepositoryMock = module.get(getRepositoryToken(QueryRepository));
  });

  it('should be defined', async () => {
    expect(service).toBeDefined();
  });

  it('should have the repo mocked', async () => {
    expect(await repo.find()).toEqual(metric);
  });

  it('should return all metrics', async () => {
    const res = await service.getAllMetrics(new UpgradeLogger());
    expect(res).toEqual(metricResultWithHasQuery);
  });

  it('should only set hasQuery on the top-level metric object for grouped metrics', async () => {
    const groupKey = `masteryWorkspace${METRICS_JOIN_TEXT}calculating_area_figures${METRICS_JOIN_TEXT}timeSeconds`;
    const groupedMetricRows = [
      {
        key: groupKey,
        type: IMetricMetaData.CONTINUOUS,
        allowedData: [],
        context: ['home'],
      },
    ];
    (repo.find as jest.Mock).mockResolvedValueOnce(groupedMetricRows);
    queryRepositoryMock.getMetricKeysWithQueries.mockResolvedValueOnce([groupKey]);

    const res = await service.getAllMetrics(new UpgradeLogger());

    expect(res).toEqual([
      {
        key: 'masteryWorkspace',
        hasQuery: true,
        allowedData: [],
        context: ['home'],
        metadata: { type: IMetricMetaData.CONTINUOUS },
        children: [
          {
            key: 'calculating_area_figures',
            allowedData: [],
            context: ['home'],
            metadata: { type: IMetricMetaData.CONTINUOUS },
            children: [
              {
                key: 'timeSeconds',
                allowedData: [],
                context: ['home'],
                metadata: { type: IMetricMetaData.CONTINUOUS },
                children: [],
              },
            ],
          },
        ],
      },
    ]);
  });

  it('should save all simple metrics', async () => {
    const res = await service.saveAllMetrics(simpleMetric, contexts, new UpgradeLogger());
    expect(res).toEqual(metric);
  });

  it('should save all group metrics', async () => {
    const res = await service.saveAllMetrics(groupMetric, contexts, new UpgradeLogger());
    expect(res).toEqual(metric);
  });

  it('should upsert all metrics', async () => {
    const res = await service.upsertAllMetrics(simpleMetric, contexts, new UpgradeLogger());
    expect(res).toEqual(metricResult);
  });

  it('should delete a specific metric', async () => {
    const res = await service.deleteMetric('totalProblemsCompleted', new UpgradeLogger());
    expect(res).toEqual(metricResult);
  });

  it('should throw an error when metrics filter not enabled', async () => {
    settingRes[0].toFilterMetric = false;

    expect(async () => {
      await service.saveAllMetrics(groupMetric, contexts, new UpgradeLogger());
    }).rejects.toThrow('Metrics filter not enabled');
  });
});
