import * as sinon from 'sinon';
import { Connection, ConnectionManager, DataSource } from 'typeorm';
import { Test, TestingModuleBuilder } from '@nestjs/testing';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { FeatureFlag } from '../../../src/api/models/FeatureFlag';
import { Segment } from '../../../src/api/models/Segment';
import { FeatureFlagRepository } from '../../../src/api/repositories/FeatureFlagRepository';
import { ErrorService } from '../../../src/api/services/ErrorService';
import { FeatureFlagService } from '../../../src/api/services/FeatureFlagService';
import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';
import { configureLogger } from '../../utils/logger';
import { Container } from '../../../src/typeorm-typedi-extensions';
import {
  FLAG_SEARCH_KEY,
  FLAG_SORT_KEY,
  FF_COMPATIBILITY_TYPE,
} from '../../../src/api/controllers/validators/FeatureFlagsPaginatedParamsValidator';
import {
  FEATURE_FLAG_LIST_FILTER_MODE,
  FEATURE_FLAG_STATUS,
  FILTER_MODE,
  SEGMENT_TYPE,
  SORT_AS_DIRECTION,
} from 'upgrade_types';
import { isUUID } from 'class-validator';
import { v4 as uuid } from 'uuid';
import { ExperimentAssignmentService } from '../../../src/api/services/ExperimentAssignmentService';
import { FeatureFlagValidation } from '../../../src/api/controllers/validators/FeatureFlagValidator';
import { FeatureFlagListValidator } from '../../../src/api/controllers/validators/FeatureFlagListValidator';
import { SegmentService } from '../../../src/api/services/SegmentService';
import { FeatureFlagSegmentExclusionRepository } from '../../../src/api/repositories/FeatureFlagSegmentExclusionRepository';
import { FeatureFlagSegmentInclusionRepository } from '../../../src/api/repositories/FeatureFlagSegmentInclusionRepository';
import { User } from '../../../src/api/models/User';
import { ExperimentAuditLogRepository } from '../../../src/api/repositories/ExperimentAuditLogRepository';
import { CacheService } from '../../../src/api/services/CacheService';

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
  mockFlag1.context = ['context1'];
  mockFlag1.status = FEATURE_FLAG_STATUS.ENABLED;
  mockFlag1.featureFlagSegmentInclusion = [];
  mockFlag1.featureFlagSegmentExclusion = [];

  const mockFlag2 = new FeatureFlagValidation();
  mockFlag2.id = uuid();
  mockFlag2.name = 'name';
  mockFlag2.key = 'key';
  mockFlag2.description = 'description';
  mockFlag2.context = ['context'];
  mockFlag2.status = FEATURE_FLAG_STATUS.ENABLED;

  const mockFlag3 = new FeatureFlagValidation();

  const mockFlag4 = new FeatureFlag();
  mockFlag4.name = 'name';
  mockFlag4.key = 'key4';
  mockFlag4.description = 'description';
  mockFlag4.context = ['context1'];
  mockFlag4.status = FEATURE_FLAG_STATUS.ENABLED;
  mockFlag4.filterMode = FILTER_MODE.INCLUDE_ALL;
  mockFlag4.tags = [];
  mockFlag4.featureFlagSegmentInclusion = [];
  mockFlag4.featureFlagSegmentExclusion = [];

  const mockSegment = {
    name: 'name',
    id: uuid(),
    context: 'context',
    type: SEGMENT_TYPE.PRIVATE,
    userIds: ['user1'],
    groups: [],
    subSegmentIds: [],
  };

  const mockList = new FeatureFlagListValidator();
  mockList.enabled = true;
  mockList.flagId = mockFlag1.id;
  mockList.listType = 'individual';
  mockList.segment = mockSegment;

  const mockFlagArr = [mockFlag1, mockFlag2, mockFlag3];

  const mockUser1 = new User();
  mockUser1.firstName = 'Bruce';
  mockUser1.lastName = 'Banner';
  mockUser1.email = 'bb@email.com';

  const mockExperimentAuditLogRepository = {
    saveRawJson: jest.fn().mockResolvedValue({}), // Mock the method
    save: jest.fn().mockResolvedValue({}),
  };

  const limitSpy = jest.fn().mockReturnThis();
  const offsetSpy = jest.fn().mockReturnThis();
  const addSelectSpy = jest.fn().mockReturnThis();
  const setParameterSpy = jest.fn().mockReturnThis();
  const addOrderBySpy = jest.fn().mockReturnThis();

  const queryBuilderMock = {
    addSelect: addSelectSpy,
    addOrderBy: addOrderBySpy,
    setParameter: setParameterSpy,
    where: jest.fn().mockReturnThis(),
    offset: offsetSpy,
    limit: limitSpy,
    innerJoinAndSelect: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue(mockFlagArr),
  };

  const entityManagerMock = {
    createQueryBuilder: () => queryBuilderMock,
    getRepository: jest.fn().mockReturnThis(),
    findOne: jest.fn().mockResolvedValue({
      featureFlag: { id: uuid(), name: 'flag' },
      segment: { id: 'mock-segment-id', name: 'mock-segment-name' },
    }),
    findByIds: jest.fn().mockResolvedValue([mockFlag1]),
    save: jest.fn().mockResolvedValue({}),
  };
  const exposureRepoMock = { save: jest.fn() };
  const sandbox = sinon.createSandbox();
  sandbox.stub(ConnectionManager.prototype, 'get').returns({
    transaction: jest.fn(async (passedFunction) => await passedFunction(entityManagerMock)),
    getRepository: () => exposureRepoMock,
  } as unknown as Connection);

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
          provide: CacheService,
          useValue: {
            delCache: jest.fn().mockResolvedValue(undefined),
            resetPrefixCache: jest.fn().mockResolvedValue(undefined),
            wrap: jest.fn().mockImplementation((key, cb) => cb()),
          },
        },
        {
          provide: getDataSourceToken('default'),
          useValue: dataSource,
        },
        {
          provide: ExperimentAssignmentService,
          useValue: {
            inclusionExclusionLogic: jest.fn().mockResolvedValue([[mockFlag1.id]]),
            checkUserOrGroupIsGloballyExcluded: jest.fn().mockResolvedValue([null, []]),
          },
        },
        {
          provide: SegmentService,
          useValue: {
            upsertSegmentInPipeline: jest.fn().mockResolvedValue(mockList),
            deleteSegment: jest.fn().mockResolvedValue(mockList),
            getSegmentByIds: jest.fn().mockResolvedValue([mockSegment]),
          },
        },
        {
          provide: getRepositoryToken(FeatureFlagRepository),
          useValue: {
            find: jest.fn().mockResolvedValue(mockFlagArr),
            findBy: jest.fn().mockResolvedValue(mockFlagArr),
            findOne: jest.fn().mockResolvedValue(mockFlag1),
            findWithNames: jest.fn().mockResolvedValue(mockFlagArr),
            findOneById: jest.fn().mockResolvedValue(mockFlag1),
            count: jest.fn().mockResolvedValue(mockFlagArr.length),
            findPaginated: jest.fn().mockResolvedValue(mockFlagArr),
            insertFeatureFlag: jest.fn().mockResolvedValue([mockFlag1]),
            deleteById: jest.fn().mockResolvedValue(mockFlag1.id),
            updateState: jest.fn().mockImplementation((id, status) => {
              return status;
            }),
            updateFilterMode: jest.fn().mockImplementation((id, filterMode) => {
              return filterMode;
            }),
            updateFeatureFlag: jest.fn().mockResolvedValue(mockFlagArr),
            save: jest.fn().mockImplementation((flag: Partial<FeatureFlag>) => {
              return flag.id;
            }),
            createQueryBuilder: jest.fn(() => ({
              addSelect: addSelectSpy,
              addOrderBy: addOrderBySpy,
              setParameter: setParameterSpy,
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              offset: offsetSpy,
              limit: limitSpy,
              innerJoinAndSelect: jest.fn().mockReturnThis(),
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              loadRelationCountAndMap: jest.fn().mockReturnThis(),
              getMany: jest.fn().mockResolvedValue(mockFlagArr),
              getOne: jest.fn().mockResolvedValue(mockFlag1),
            })),
            validateUniqueKey: jest.fn().mockResolvedValue(null),
          },
        },
        {
          provide: getRepositoryToken(FeatureFlagSegmentExclusionRepository),
          useValue: {
            findOne: jest.fn().mockResolvedValue({
              featureFlag: { id: uuid(), name: 'flag' },
              segment: { id: uuid(), name: 'name' },
            }),
            insertData: jest.fn().mockResolvedValue(mockList),
          },
        },
        {
          provide: getRepositoryToken(FeatureFlagSegmentInclusionRepository),
          useValue: {
            findOne: jest.fn().mockResolvedValue({
              featureFlag: { id: uuid(), name: 'flag' },
              segment: { id: uuid(), name: 'name' },
            }),
            insertData: jest.fn().mockResolvedValue(mockList),
          },
        },
        {
          provide: ErrorService,
          useValue: {
            create: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ExperimentAuditLogRepository),
          useValue: mockExperimentAuditLogRepository,
        },
      ],
    })
      .useMocker((token) => {
        return token;
      })
      .compile();

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

  it('should throw an error when create flag fails', async () => {
    const err = new Error('insert error');
    flagRepo.insertFeatureFlag = jest.fn().mockRejectedValue(err);
    expect(async () => {
      await service.create(mockFlag2, mockUser1, logger);
    }).rejects.toThrow(new Error('Error in creating feature flag document "addFeatureFlagInDB" Error: insert error'));
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
        key: FLAG_SEARCH_KEY.ALL,
        string: '',
      },
      {
        key: FLAG_SORT_KEY.NAME,
        sortAs: SORT_AS_DIRECTION.ASCENDING,
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
        key: FLAG_SEARCH_KEY.KEY,
        string: '',
      },
      {
        key: FLAG_SORT_KEY.NAME,
        sortAs: SORT_AS_DIRECTION.ASCENDING,
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
        key: FLAG_SEARCH_KEY.NAME,
        string: '',
      },
      {
        key: FLAG_SORT_KEY.NAME,
        sortAs: SORT_AS_DIRECTION.ASCENDING,
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
        key: FLAG_SEARCH_KEY.STATUS,
        string: '',
      },
      {
        key: FLAG_SORT_KEY.NAME,
        sortAs: SORT_AS_DIRECTION.ASCENDING,
      }
    );
    expect(results).toEqual(mockFlagArr);
  });

  it('should find all paginated feature flags with search string context', async () => {
    const results = await service.findPaginated(
      1,
      2,
      logger,
      {
        key: FLAG_SEARCH_KEY.CONTEXT,
        string: '',
      },
      {
        key: FLAG_SORT_KEY.NAME,
        sortAs: SORT_AS_DIRECTION.ASCENDING,
      }
    );
    expect(results).toEqual(mockFlagArr);
  });

  it('should find all paginated feature flags without search params', async () => {
    const results = await service.findPaginated(1, 2, logger);
    expect(results).toEqual(mockFlagArr);
  });

  it('should update the flag', async () => {
    const results = await service.update(mockFlag2, mockUser1, logger);
    expect(isUUID(results.id)).toBeTruthy();
  });

  it('should throw an error when unable to update flag', async () => {
    const err = new Error('insert error');
    flagRepo.updateFeatureFlag = jest.fn().mockRejectedValue(err);
    expect(async () => {
      await service.update(mockFlag2, mockUser1, logger);
    }).rejects.toThrow(
      new Error('Error in updating feature flag document "updateFeatureFlagInDB" Error: insert error')
    );
  });

  it('should update the flag state', async () => {
    const results = await service.updateState(mockFlag1.id, FEATURE_FLAG_STATUS.ENABLED, mockUser1);
    expect(results).toBeTruthy();
  });

  it('should update the filter mode', async () => {
    flagRepo.updateFilterMode = jest.fn().mockResolvedValue(mockFlag1);
    const results = await service.updateFilterMode(mockFlag1.id, FILTER_MODE.EXCLUDE_ALL, mockUser1);
    expect(results).toBeTruthy();
  });

  it('should delete the flag', async () => {
    flagRepo.updateFilterMode = jest.fn().mockResolvedValue(mockFlag1);
    const results = await service.delete(mockFlag1.id, mockUser1, logger);
    expect(results).toEqual(mockFlag1.id);
  });

  it('should return undefined when no flag to delete', async () => {
    service.findOne = jest.fn().mockResolvedValue(undefined);
    const results = await service.delete(mockFlag1.id, mockUser1, logger);
    expect(results).toEqual(undefined);
  });

  it('should return an empty array if there are no flags', async () => {
    const userDoc = { id: 'user123', group: {}, workingGroup: {} } as any;
    const context = 'context1';

    flagRepo.getFlagsFromContext = jest.fn().mockResolvedValue([]);
    const result = await service.getKeys(userDoc, context, logger);

    expect(result).toEqual([]);
  });

  it('should return all flags belonging to context', async () => {
    const userDoc = { id: 'user123', group: {}, workingGroup: {} } as any;
    const context = 'context1';

    flagRepo.getFlagsFromContext = jest.fn().mockResolvedValue([]);
    service.cacheService.wrap = jest.fn().mockResolvedValue([mockFlag1]);
    const result = await service.getKeys(userDoc, context, logger);

    expect(result.length).toEqual(1);
    expect(result).toEqual([mockFlag1.key]);
  });

  it('should add an include list', async () => {
    const result = await service.addList([mockList], FEATURE_FLAG_LIST_FILTER_MODE.INCLUSION, mockUser1, logger);

    expect(result).toBeTruthy();
  });

  it('should delete an include list', async () => {
    const result = await service.deleteList(
      mockList.segment.id,
      FEATURE_FLAG_LIST_FILTER_MODE.INCLUSION,
      mockUser1,
      logger
    );

    expect(result).toBeTruthy();
  });

  it('should import a feature flag from a valid file', async () => {
    const result = await service.importFeatureFlags(
      [{ fileName: 'import.json', fileContent: JSON.stringify(mockFlag4) }],
      mockUser1,
      logger
    );

    expect(result).toEqual([
      {
        fileName: 'import.json',
        error: null,
      },
    ]);
  });

  it('should not import a feature flag with a duplicate key', async () => {
    const result = await service.importFeatureFlags(
      [{ fileName: 'import.json', fileContent: JSON.stringify(mockFlag1) }],
      mockUser1,
      logger
    );

    expect(result).toEqual([
      {
        fileName: 'import.json',
        error: FF_COMPATIBILITY_TYPE.INCOMPATIBLE,
      },
    ]);
  });

  it('should not import a feature flag with incomplete definition', async () => {
    const result = await service.importFeatureFlags(
      [{ fileName: 'import.json', fileContent: JSON.stringify(mockFlag3) }],
      mockUser1,
      logger
    );

    expect(result).toEqual([
      {
        fileName: 'import.json',
        error: FF_COMPATIBILITY_TYPE.INCOMPATIBLE,
      },
    ]);
  });

  it('should return cached flags from context', async () => {
    const context = 'test-context';
    const mockFlags: FeatureFlag[] = [mockFlag1];

    flagRepo.getFlagsFromContext = jest.fn().mockResolvedValue(mockFlags);
    service.cacheService.wrap = jest.fn().mockImplementation((key, fn) => fn());

    const result = await service.getCachedFlagsFromContext(context);

    expect(result).toEqual(mockFlags);
    expect(flagRepo.getFlagsFromContext).toHaveBeenCalledWith(context);
    expect(service.cacheService.wrap).toHaveBeenCalled();
  });

  it('should call the cache service to delete the cache', async () => {
    await service.clearCachedFlagsForContext('test');

    expect(service.cacheService.delCache).toHaveBeenCalled();
  });
});
