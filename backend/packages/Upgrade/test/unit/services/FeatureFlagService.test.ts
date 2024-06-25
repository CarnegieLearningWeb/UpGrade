import { DataSource } from 'typeorm';
import { Test, TestingModuleBuilder } from '@nestjs/testing';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';

import { FeatureFlag } from '../../../src/api/models/FeatureFlag';
import { Segment } from '../../../src/api/models/Segment';

import { FeatureFlagRepository } from '../../../src/api/repositories/FeatureFlagRepository';

import { ErrorService } from '../../../src/api/services/ErrorService';
import { FeatureFlagService } from '../../../src/api/services/FeatureFlagService';
import { SegmentService } from '../../../src/api/services/SegmentService';
import { ExperimentService } from '../../../src/api/services/ExperimentService';

import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';
import { FlagVariationRepository } from '../../../src/api/repositories/FlagVariationRepository';
import { FLAG_SEARCH_SORT_KEY } from '../../../src/api/controllers/validators/FeatureFlagsPaginatedParamsValidator';
import { EXPERIMENT_SORT_AS } from '../../../../../../types/src';
import { isUUID } from 'class-validator';
import { v4 as uuid } from 'uuid';
import { configureLogger } from '../../utils/logger';
import { ExperimentAssignmentService } from '../../../src/api/services/ExperimentAssignmentService';
import { Container } from '../../../src/typeorm-typedi-extensions';

describe('Feature Flag Service Testing', () => {
  let service: FeatureFlagService;
  let flagRepo: FeatureFlagRepository;

  let module: Awaited<ReturnType<TestingModuleBuilder['compile']>>;

  const logger = new UpgradeLogger();
  let dataSource: DataSource;

  const mockFlag1 = new FeatureFlag();
  mockFlag1.id = uuid();
  mockFlag1.name = 'name';
  mockFlag1.key = 'key';
  mockFlag1.description = 'description';
  mockFlag1.variationType = 'variationType';
  mockFlag1.status = true;

  const mockFlag2 = new FeatureFlag();
  mockFlag2.id = uuid();
  mockFlag2.name = 'name';
  mockFlag2.key = 'key';
  mockFlag2.description = 'description';
  mockFlag2.variationType = 'variationType';
  mockFlag2.status = true;

  const mockFlag3 = new FeatureFlag();

  const mockFlagArr = [mockFlag1, mockFlag2, mockFlag3];

  const limitSpy = jest.fn().mockReturnThis();
  const offsetSpy = jest.fn().mockReturnThis();
  const addSelectSpy = jest.fn().mockReturnThis();
  const setParamaterSpy = jest.fn().mockReturnThis();
  const addOrderBySpy = jest.fn().mockReturnThis();

  const queryBuilderMock = {
    addSelect: addSelectSpy,
    addOrderBy: addOrderBySpy,
    setParameter: setParamaterSpy,
    where: jest.fn().mockReturnThis(),
    offset: offsetSpy,
    limit: limitSpy,
    innerJoinAndSelect: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue(mockFlagArr),
  };

  const entityManagerMock = { createQueryBuilder: () => queryBuilderMock };

  beforeAll(() => {
    configureLogger();
  });

  beforeEach(async () => {
    dataSource = new DataSource({
      type: 'postgres',
      database: 'postgres',
      entities: [FeatureFlag, Segment],
      synchronize: true,
    });

    const mockTransaction = jest.fn(async (passedFunction) => await passedFunction(entityManagerMock));
    dataSource.transaction = mockTransaction;
    Container.setDataSource('default', dataSource);

    module = await Test.createTestingModule({
      providers: [
        DataSource,
        FeatureFlagService,
        {
          provide: getDataSourceToken('default'),
          useValue: dataSource,
        },
        {
          provide: ExperimentService,
          useValue: {
            includeExcludeSegmentCreation: jest.fn().mockResolvedValue({ subSegmentIds: [], userIds: [], groups: [] }),
          },
        },
        {
          provide: SegmentService,
          useValue: {
            upsertSegment: jest.fn().mockResolvedValue({ id: uuid() }),
            addSegmentDataInDB: jest.fn().mockResolvedValue({ id: uuid() }),
            find: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: ExperimentAssignmentService,
          useValue: {
            inclusionExclusionLogic: jest.fn().mockResolvedValue([[mockFlag1.id]]),
          },
        },
        {
          provide: getRepositoryToken(FeatureFlagRepository),
          useValue: {
            find: jest.fn().mockResolvedValue(mockFlagArr),
            findOne: jest.fn().mockResolvedValue(mockFlag1),
            findWithNames: jest.fn().mockResolvedValue(mockFlagArr),
            findOneById: jest.fn().mockResolvedValue(mockFlag1),
            count: jest.fn().mockResolvedValue(mockFlagArr.length),
            findPaginated: jest.fn().mockResolvedValue(mockFlagArr),
            insertFeatureFlag: jest.fn().mockResolvedValue(mockFlag1),
            deleteById: jest.fn().mockResolvedValue(mockFlag1.id),
            updateState: jest.fn().mockImplementation((id, status) => {
              return status;
            }),
            updateFeatureFlag: jest.fn().mockResolvedValue(mockFlagArr),
            save: jest.fn().mockImplementation((flag: Partial<FeatureFlag>) => {
              return flag.id;
            }),
            createQueryBuilder: jest.fn(() => ({
              addSelect: addSelectSpy,
              addOrderBy: addOrderBySpy,
              setParameter: setParamaterSpy,
              where: jest.fn().mockReturnThis(),
              offset: offsetSpy,
              limit: limitSpy,
              innerJoinAndSelect: jest.fn().mockReturnThis(),
              getMany: jest.fn().mockResolvedValue(mockFlagArr),
            })),
          },
        },
        {
          provide: getRepositoryToken(FlagVariationRepository),
          useValue: {
            find: jest.fn().mockResolvedValue(mockFlagArr),
            insertVariations: jest.fn().mockResolvedValue(mockFlagArr),
            upsertFlagVariation: jest.fn().mockResolvedValue(mockFlagArr),
            deleteVariation: jest.fn().mockImplementation((flag) => {
              return flag;
            }),
          },
        },
        {
          provide: ErrorService,
          useValue: {
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<FeatureFlagService>(FeatureFlagService);
    flagRepo = module.get<FeatureFlagRepository>(getRepositoryToken(FeatureFlagRepository));
  });

  it('should be defined', async () => {
    expect(service).toBeDefined();
  });

  it('should have the repo mocked', async () => {
    expect(await flagRepo.find()).toEqual(mockFlagArr);
  });

  it('should find all feature flags', async () => {
    const results = await service.find(logger);
    expect(results).toEqual(mockFlagArr);
  });

  it('should create a feature flag with uuid', async () => {
    const results = await service.create(mockFlag1, logger);
    expect(isUUID(results.variations[0].id)).toBeTruthy();
  });

  it('should throw an error when create flag fails', async () => {
    const err = new Error('insert error');
    flagRepo.insertFeatureFlag = jest.fn().mockRejectedValue(err);
    expect(async () => {
      await service.create(mockFlag1, logger);
    }).rejects.toThrow(new Error('Error in creating feature flag document "addFeatureFlagInDB" Error: insert error'));
  });

  it('should throw an error when create variation fails', async () => {
    expect(async () => {
      await service.create(mockFlag1, logger);
    }).rejects.toThrow(new Error('Error in creating variation "addFeatureFlagInDB" Error: insert error'));
  });

  it('should return a count of feature flags', async () => {
    const results = await service.getTotalCount();
    expect(results).toEqual(mockFlagArr.length);
  });

  it('should find all paginated feature flags with search string all', async () => {
    const results = await service.findPaginated(
      1,
      2,
      logger,
      {
        key: FLAG_SEARCH_SORT_KEY.ALL,
        string: '',
      },
      {
        key: FLAG_SEARCH_SORT_KEY.ALL,
        sortAs: EXPERIMENT_SORT_AS.ASCENDING,
      }
    );
    expect(results).toEqual(mockFlagArr);
  });

  it('should find all paginated feature flags with search string key', async () => {
    const results = await service.findPaginated(
      1,
      2,
      logger,
      {
        key: FLAG_SEARCH_SORT_KEY.KEY,
        string: '',
      },
      {
        key: FLAG_SEARCH_SORT_KEY.ALL,
        sortAs: EXPERIMENT_SORT_AS.ASCENDING,
      }
    );
    expect(results).toEqual(mockFlagArr);
  });

  it('should find all paginated feature flags with search string name', async () => {
    const results = await service.findPaginated(
      1,
      2,
      logger,
      {
        key: FLAG_SEARCH_SORT_KEY.NAME,
        string: '',
      },
      {
        key: FLAG_SEARCH_SORT_KEY.ALL,
        sortAs: EXPERIMENT_SORT_AS.ASCENDING,
      }
    );
    expect(results).toEqual(mockFlagArr);
  });

  it('should find all paginated feature flags with search string status', async () => {
    const results = await service.findPaginated(
      1,
      2,
      logger,
      {
        key: FLAG_SEARCH_SORT_KEY.STATUS,
        string: '',
      },
      {
        key: FLAG_SEARCH_SORT_KEY.ALL,
        sortAs: EXPERIMENT_SORT_AS.ASCENDING,
      }
    );
    expect(results).toEqual(mockFlagArr);
  });

  it('should find all paginated feature flags with search string variation type', async () => {
    const results = await service.findPaginated(
      1,
      2,
      logger,
      {
        key: FLAG_SEARCH_SORT_KEY.VARIATION_TYPE,
        string: '',
      },
      {
        key: FLAG_SEARCH_SORT_KEY.ALL,
        sortAs: EXPERIMENT_SORT_AS.ASCENDING,
      }
    );
    expect(results).toEqual(mockFlagArr);
  });

  it('should find all paginated feature flags without search params', async () => {
    const results = await service.findPaginated(1, 2, logger);
    expect(results).toEqual(mockFlagArr);
  });

  it('should update the flag', async () => {
    const results = await service.update(mockFlag1, logger);
    expect(isUUID(results.id)).toBeTruthy();
  });

  it('should update the flag with no id and no variations', async () => {
    const results = await service.update(mockFlag3, logger);
    expect(isUUID(results.id)).toBeTruthy();
  });

  it('should update the flag with no id', async () => {
    const results = await service.update(mockFlag3, logger);
    expect(isUUID(results.id)).toBeTruthy();
  });

  it('should throw an error when unable to update flag', async () => {
    const err = new Error('insert error');
    flagRepo.updateFeatureFlag = jest.fn().mockRejectedValue(err);
    expect(async () => {
      await service.update(mockFlag1, logger);
    }).rejects.toThrow(
      new Error('Error in updating feature flag document "updateFeatureFlagInDB" Error: insert error')
    );
  });

  it('should throw an error when unable to update flag variation', async () => {
    expect(async () => {
      await service.update(mockFlag1, logger);
    }).rejects.toThrow(new Error('Error in creating variations "updateFeatureFlagInDB" Error: insert error'));
  });

  it('should update the flag state', async () => {
    const results = await service.updateState(mockFlag1.id, true);
    expect(results).toBeTruthy();
  });

  it('should delete the flag', async () => {
    const results = await service.delete(mockFlag1.id, logger);
    expect(results).toEqual(mockFlag1.id);
  });

  it('should return undefined when no flag to delete', async () => {
    flagRepo.find = jest.fn().mockResolvedValue(undefined);
    const results = await service.delete(mockFlag1.id, logger);
    expect(results).toEqual(undefined);
  });
});
