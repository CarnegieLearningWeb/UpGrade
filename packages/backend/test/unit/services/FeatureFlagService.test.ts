import { DataSource } from 'typeorm';
import { Test, TestingModuleBuilder } from '@nestjs/testing';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { FeatureFlag } from '../../../src/api/models/FeatureFlag';
import { Segment } from '../../../src/api/models/Segment';
import { FeatureFlagRepository } from '../../../src/api/repositories/FeatureFlagRepository';
import { SegmentRepository } from '../../../src/api/repositories/SegmentRepository';
import { ErrorService } from '../../../src/api/services/ErrorService';
import { FeatureFlagService } from '../../../src/api/services/FeatureFlagService';
import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';
import { configureLogger } from '../../utils/logger';
import { Container } from '../../../src/typeorm-typedi-extensions';
import {
  FLAG_SEARCH_KEY,
  FLAG_SORT_KEY,
} from '../../../src/api/controllers/validators/FeatureFlagsPaginatedParamsValidator';
import {
  LIST_FILTER_MODE,
  FEATURE_FLAG_STATUS,
  FILTER_MODE,
  IMPORT_COMPATIBILITY_TYPE,
  SEGMENT_TYPE,
  SORT_AS_DIRECTION,
  STANDARD_LIST_TYPE,
} from 'upgrade_types';
import { isUUID } from 'class-validator';

import { ExperimentAssignmentService } from '../../../src/api/services/ExperimentAssignmentService';
import { FeatureFlagValidation } from '../../../src/api/controllers/validators/FeatureFlagValidator';
import { FeatureFlagListValidator } from '../../../src/api/controllers/validators/FeatureFlagListValidator';
import { SegmentService } from '../../../src/api/services/SegmentService';
import { FeatureFlagPrecomputedSegmentService } from '../../../src/api/services/FeatureFlagPrecomputedSegmentService';
import { FeatureFlagSegmentExclusionRepository } from '../../../src/api/repositories/FeatureFlagSegmentExclusionRepository';
import { FeatureFlagSegmentInclusionRepository } from '../../../src/api/repositories/FeatureFlagSegmentInclusionRepository';
import { FeatureFlagExposureRepository } from '../../../src/api/repositories/FeatureFlagExposureRepository';
import { FeatureFlagSegmentInclusion } from '../../../src/api/models/FeatureFlagSegmentInclusion';
import { User } from '../../../src/api/models/User';
import { ExperimentAuditLogRepository } from '../../../src/api/repositories/ExperimentAuditLogRepository';
import { CacheService } from '../../../src/api/services/CacheService';
import { env } from './../../../src/env';

describe('Feature Flag Service Testing', () => {
  let service: FeatureFlagService;
  let flagRepo: FeatureFlagRepository;

  let module: Awaited<ReturnType<TestingModuleBuilder['compile']>>;

  const logger = new UpgradeLogger();
  let dataSource: DataSource;
  env.initialization.contextMetadata = {
    context1: { EXP_POINTS: [], EXP_IDS: [], GROUP_TYPES: [], CONDITIONS: [] },
  };

  const mockFlag1 = new FeatureFlag();
  mockFlag1.id = crypto.randomUUID();
  mockFlag1.name = 'name';
  mockFlag1.key = 'key';
  mockFlag1.description = 'description';
  mockFlag1.context = ['context1'];
  mockFlag1.status = FEATURE_FLAG_STATUS.ENABLED;
  mockFlag1.featureFlagSegmentInclusion = [];
  mockFlag1.featureFlagSegmentExclusion = [];

  const mockFlag2 = new FeatureFlagValidation();
  mockFlag2.id = crypto.randomUUID();
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

  const inclusionSegmentForExcludeAll = { id: 'seg-include-for-exclude-all' } as any;
  const excludeAllFlagWithInclusion = new FeatureFlag();
  excludeAllFlagWithInclusion.id = 'exclude-all-flag-id';
  excludeAllFlagWithInclusion.key = 'exclude-all-key';
  excludeAllFlagWithInclusion.filterMode = FILTER_MODE.EXCLUDE_ALL;
  excludeAllFlagWithInclusion.featureFlagSegmentInclusion = [
    { enabled: true, segment: inclusionSegmentForExcludeAll } as FeatureFlagSegmentInclusion,
  ];
  excludeAllFlagWithInclusion.featureFlagSegmentExclusion = [];

  const inclusionSegmentForIncludeAll = { id: 'seg-include-for-include-all' } as any;
  const includeAllFlagWithInclusion = new FeatureFlag();
  includeAllFlagWithInclusion.id = 'include-all-flag-id';
  includeAllFlagWithInclusion.key = 'include-all-key';
  includeAllFlagWithInclusion.filterMode = FILTER_MODE.INCLUDE_ALL;
  includeAllFlagWithInclusion.featureFlagSegmentInclusion = [
    { enabled: true, segment: inclusionSegmentForIncludeAll } as FeatureFlagSegmentInclusion,
  ];
  includeAllFlagWithInclusion.featureFlagSegmentExclusion = [];

  const mockSegment = {
    name: 'name',
    id: crypto.randomUUID(),
    context: 'context',
    type: SEGMENT_TYPE.PRIVATE,
    userIds: ['user1'],
    groups: [],
    subSegmentIds: [],
  };

  const mockList = new FeatureFlagListValidator();
  mockList.enabled = true;
  mockList.id = mockFlag1.id;
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
      featureFlag: { id: crypto.randomUUID(), name: 'flag' },
      segment: { id: 'mock-segment-id', name: 'mock-segment-name' },
    }),
    findBy: jest.fn().mockResolvedValue([mockFlag1]),
    save: jest.fn().mockResolvedValue({}),
  };

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
            checkUserOrGroupIsGloballyExcluded: jest.fn().mockResolvedValue([false, false]),
            resolveSegmentsForEntities: jest.fn().mockResolvedValue([]),
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
          provide: FeatureFlagPrecomputedSegmentService,
          useValue: {
            // Empty map by default => every flag is "missing" a precomputed row, so getKeys
            // routes through the on-the-fly fallback (resolveSegmentsForEntities/inclusionExclusionLogic).
            // Individual tests override getPrecomputedSets to exercise the fast in-memory path.
            getPrecomputedSets: jest.fn().mockResolvedValue(new Map()),
            recomputeForFlag: jest.fn().mockResolvedValue(undefined),
            seedEmptyRowForFlag: jest.fn().mockResolvedValue(undefined),
            scheduleRecomputeForSegment: jest.fn(),
            scheduleRecomputeForFlags: jest.fn(),
            // Faithful stub: run the resolver + work so the mutation still executes; the real
            // wrapper's fire-and-forget recompute behavior is covered in the precompute service's suite.
            withRecompute: jest.fn(async (_logger, resolveAffectedFlagIds, work) => {
              await resolveAffectedFlagIds();
              return work();
            }),
            getAffectedFlagIds: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: getRepositoryToken(FeatureFlagRepository),
          useValue: {
            find: jest.fn().mockResolvedValue(mockFlagArr),
            findBy: jest.fn().mockResolvedValue(mockFlagArr),
            getFlagsForKeys: jest.fn().mockResolvedValue(mockFlagArr),
            getFlagsFromContext: jest.fn().mockResolvedValue(mockFlagArr),
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
              clone: jest.fn().mockReturnThis(),
              getCount: jest.fn().mockResolvedValue(mockFlagArr.length),
            })),
            validateUniqueKey: jest.fn().mockResolvedValue(null),
          },
        },
        {
          provide: getRepositoryToken(SegmentRepository),
          useValue: {
            deleteSegments: jest.fn().mockResolvedValue(undefined),
            getAllSegmentByType: jest.fn().mockResolvedValue([]),
            findOneSegmentByContextAndType: jest.fn().mockResolvedValue(undefined),
            createQueryBuilder: jest.fn(() => ({
              addSelect: jest.fn().mockReturnThis(),
              addOrderBy: jest.fn().mockReturnThis(),
              setParameter: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              offset: jest.fn().mockReturnThis(),
              limit: jest.fn().mockReturnThis(),
              innerJoinAndSelect: jest.fn().mockReturnThis(),
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              getMany: jest.fn().mockResolvedValue([]),
              getOne: jest.fn().mockResolvedValue(null),
            })),
          },
        },
        {
          provide: getRepositoryToken(FeatureFlagExposureRepository),
          useValue: {
            recordExposureIfNotExists: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: getRepositoryToken(FeatureFlagSegmentExclusionRepository),
          useValue: {
            findOne: jest.fn().mockResolvedValue({
              featureFlag: { id: crypto.randomUUID(), name: 'flag' },
              segment: { id: crypto.randomUUID(), name: 'name' },
            }),
            insertData: jest.fn().mockResolvedValue(mockList),
          },
        },
        {
          provide: getRepositoryToken(FeatureFlagSegmentInclusionRepository),
          useValue: {
            findOne: jest.fn().mockResolvedValue({
              featureFlag: { id: crypto.randomUUID(), name: 'flag' },
              segment: { id: crypto.randomUUID(), name: 'name' },
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
    expect(results).toEqual([mockFlagArr, 3]);
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
    expect(results).toEqual([mockFlagArr, 3]);
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
    expect(results).toEqual([mockFlagArr, 3]);
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
    expect(results).toEqual([mockFlagArr, 3]);
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
    expect(results).toEqual([mockFlagArr, 3]);
  });

  it('should find all paginated feature flags without search params', async () => {
    const results = await service.findPaginated(1, 2, logger);
    expect(results).toEqual([mockFlagArr, 3]);
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

  it('recomputes the precomputed row when a flag update changes its context (lists are deleted)', async () => {
    const precomputed = module.get<FeatureFlagPrecomputedSegmentService>(FeatureFlagPrecomputedSegmentService);
    // old flag has a different context than the incoming mockFlag2 (context: ['context']) and has lists.
    // updateFeatureFlagInDB reads the old flag through the counts-only findOneForDetails.
    service.findOneForDetails = jest.fn().mockResolvedValue({
      id: mockFlag2.id,
      name: 'name',
      key: 'key',
      description: 'description',
      context: ['old-context'],
      status: FEATURE_FLAG_STATUS.ENABLED,
      featureFlagSegmentInclusion: [{ segment: { id: 'inc-seg' } }],
      featureFlagSegmentExclusion: [{ segment: { id: 'exc-seg' } }],
    });

    await service.update(mockFlag2, mockUser1, logger);

    expect(precomputed.withRecompute).toHaveBeenCalled();
    // the resolver targets this flag so its (now empty) row is rebuilt instead of left stale
    const [, resolveAffectedFlagIds] = (precomputed.withRecompute as jest.Mock).mock.calls[0];
    expect(await resolveAffectedFlagIds()).toEqual([mockFlag2.id]);
  });

  it('does not recompute the precomputed row when a flag update leaves the context unchanged', async () => {
    const precomputed = module.get<FeatureFlagPrecomputedSegmentService>(FeatureFlagPrecomputedSegmentService);
    // old flag has the SAME context as the incoming mockFlag2 (context: ['context']) — lists untouched.
    // updateFeatureFlagInDB reads the old flag through the counts-only findOneForDetails.
    service.findOneForDetails = jest.fn().mockResolvedValue({
      id: mockFlag2.id,
      name: 'name',
      key: 'key',
      description: 'description',
      context: ['context'],
      status: FEATURE_FLAG_STATUS.ENABLED,
      featureFlagSegmentInclusion: [],
      featureFlagSegmentExclusion: [],
    });

    await service.update(mockFlag2, mockUser1, logger);

    // withRecompute still wraps the write, but its resolver yields no flags => no recompute fired
    const [, resolveAffectedFlagIds] = (precomputed.withRecompute as jest.Mock).mock.calls[0];
    expect(await resolveAffectedFlagIds()).toEqual([]);
  });

  it('should update the flag state', async () => {
    const results = await service.updateState(mockFlag1.id, FEATURE_FLAG_STATUS.ENABLED, mockUser1);
    expect(results).toBeTruthy();
  });

  it('should use the counts-only fetch (not the full-member findOne) when toggling flag state', async () => {
    const detailsSpy = jest.spyOn(service, 'findOneForDetails');
    const findOneSpy = jest.spyOn(service, 'findOne');
    await service.updateState(mockFlag1.id, FEATURE_FLAG_STATUS.ENABLED, mockUser1);
    expect(detailsSpy).toHaveBeenCalledWith(mockFlag1.id);
    expect(findOneSpy).not.toHaveBeenCalled();
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
    service.findOneForDetails = jest.fn().mockResolvedValue(undefined);
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
    const inclusionRepo = module.get(
      getRepositoryToken(FeatureFlagSegmentInclusionRepository)
    ) as FeatureFlagSegmentInclusionRepository;
    const result = await service.addList([mockList], LIST_FILTER_MODE.INCLUSION, mockUser1, logger);

    expect(result).toBeTruthy();
    expect(inclusionRepo.insertData).toHaveBeenCalledWith(
      [expect.objectContaining({ listType: STANDARD_LIST_TYPE.INDIVIDUAL })],
      logger,
      expect.anything()
    );
  });

  it('should normalize the list type when updating an include list', async () => {
    const inclusionRepo = module.get(
      getRepositoryToken(FeatureFlagSegmentInclusionRepository)
    ) as FeatureFlagSegmentInclusionRepository;
    const existingRecord = {
      enabled: true,
      listType: 'individual',
      featureFlag: mockFlag1,
      segment: { ...mockSegment, listType: 'individual' },
    };
    inclusionRepo.findOne = jest.fn().mockResolvedValue(existingRecord);

    const result = await service.updateList(
      { ...mockList, listType: 'iNdIvIdUaL' },
      LIST_FILTER_MODE.INCLUSION,
      mockUser1,
      logger
    );

    expect(result.listType).toBe(STANDARD_LIST_TYPE.INDIVIDUAL);
    expect(entityManagerMock.save).toHaveBeenCalledWith(
      FeatureFlagSegmentInclusion,
      expect.objectContaining({ listType: STANDARD_LIST_TYPE.INDIVIDUAL })
    );
  });

  it('should delete an include list', async () => {
    const result = await service.deleteList(mockList.segment.id, LIST_FILTER_MODE.INCLUSION, mockUser1, logger);

    expect(result).toBeTruthy();
  });

  it('should find one flag for the details view', async () => {
    const result = await service.findOneForDetails(mockFlag1.id, logger);
    expect(result).toEqual(mockFlag1);
  });

  describe('updateListStatus', () => {
    it('should update an inclusion list enabled status without rewriting its members', async () => {
      const inclusionRepo = module.get(getRepositoryToken(FeatureFlagSegmentInclusionRepository)) as any;
      const segmentService = module.get<SegmentService>(SegmentService);
      inclusionRepo.findOne = jest.fn().mockResolvedValue({
        enabled: false,
        featureFlag: { id: mockFlag1.id, name: mockFlag1.name, context: ['context1'] },
        segment: { id: 'segment-1', name: 'list' },
      });
      inclusionRepo.save = jest.fn().mockResolvedValue({});
      mockExperimentAuditLogRepository.saveRawJson.mockClear();

      const result = await service.updateListStatus('segment-1', true, LIST_FILTER_MODE.INCLUSION, mockUser1, logger);

      expect(result.enabled).toBe(true);
      expect(inclusionRepo.save).toHaveBeenCalled();
      // a status-only toggle must NOT re-upsert the segment (which would rewrite all members)
      expect(segmentService.upsertSegmentInPipeline).not.toHaveBeenCalled();
      // a status change is recorded in the audit log
      expect(mockExperimentAuditLogRepository.saveRawJson).toHaveBeenCalled();
    });

    it('should update an exclusion list enabled status', async () => {
      const exclusionRepo = module.get(getRepositoryToken(FeatureFlagSegmentExclusionRepository)) as any;
      exclusionRepo.findOne = jest.fn().mockResolvedValue({
        enabled: true,
        featureFlag: { id: mockFlag1.id, name: mockFlag1.name, context: ['context1'] },
        segment: { id: 'segment-2', name: 'list' },
      });
      exclusionRepo.save = jest.fn().mockResolvedValue({});

      const result = await service.updateListStatus('segment-2', false, LIST_FILTER_MODE.EXCLUSION, mockUser1, logger);

      expect(result.enabled).toBe(false);
      expect(exclusionRepo.save).toHaveBeenCalled();
    });

    it('should throw when no existing list record is found', async () => {
      const inclusionRepo = module.get(getRepositoryToken(FeatureFlagSegmentInclusionRepository)) as any;
      inclusionRepo.findOne = jest.fn().mockResolvedValue(undefined);

      await expect(
        service.updateListStatus('missing-segment', true, LIST_FILTER_MODE.INCLUSION, mockUser1, logger)
      ).rejects.toThrow();
    });

    it('recomputes the affected flag after a status toggle via withRecompute', async () => {
      const precomputed = module.get<FeatureFlagPrecomputedSegmentService>(FeatureFlagPrecomputedSegmentService);
      const inclusionRepo = module.get(getRepositoryToken(FeatureFlagSegmentInclusionRepository)) as any;
      inclusionRepo.findOne = jest.fn().mockResolvedValue({
        enabled: false,
        featureFlag: { id: mockFlag1.id, name: mockFlag1.name, context: ['context1'] },
        segment: { id: 'segment-1', name: 'list' },
      });
      inclusionRepo.save = jest.fn().mockResolvedValue({});
      (precomputed.withRecompute as jest.Mock).mockClear();

      await service.updateListStatus('segment-1', true, LIST_FILTER_MODE.INCLUSION, mockUser1, logger);

      expect(precomputed.withRecompute).toHaveBeenCalled();
      // the resolver handed to withRecompute yields the affected flag id
      const [, resolveAffectedFlagIds] = (precomputed.withRecompute as jest.Mock).mock.calls[0];
      expect(await resolveAffectedFlagIds()).toContain(mockFlag1.id);
    });

    it('does not recompute when the status is unchanged', async () => {
      const precomputed = module.get<FeatureFlagPrecomputedSegmentService>(FeatureFlagPrecomputedSegmentService);
      const inclusionRepo = module.get(getRepositoryToken(FeatureFlagSegmentInclusionRepository)) as any;
      inclusionRepo.findOne = jest.fn().mockResolvedValue({
        enabled: true,
        featureFlag: { id: mockFlag1.id, name: mockFlag1.name, context: ['context1'] },
        segment: { id: 'segment-1', name: 'list' },
      });
      inclusionRepo.save = jest.fn().mockResolvedValue({});
      (precomputed.withRecompute as jest.Mock).mockClear();

      // toggling to the value it already has => no change, so the resolver yields no flags
      await service.updateListStatus('segment-1', true, LIST_FILTER_MODE.INCLUSION, mockUser1, logger);

      const [, resolveAffectedFlagIds] = (precomputed.withRecompute as jest.Mock).mock.calls[0];
      expect(await resolveAffectedFlagIds()).toEqual([]);
    });
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
        error: IMPORT_COMPATIBILITY_TYPE.INCOMPATIBLE,
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
        error: IMPORT_COMPATIBILITY_TYPE.INCOMPATIBLE,
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

  describe('getKeys - global exclusion removed', () => {
    it('should not call checkUserOrGroupIsGloballyExcluded', async () => {
      const userDoc = { id: 'user123', group: {}, workingGroup: {} } as any;
      const experimentAssignmentService = module.get<ExperimentAssignmentService>(ExperimentAssignmentService);

      flagRepo.getFlagsFromContext = jest.fn().mockResolvedValue([]);
      service.cacheService.wrap = jest.fn().mockResolvedValue([mockFlag1]);

      await service.getKeys(userDoc, 'context1', logger);

      expect(experimentAssignmentService.checkUserOrGroupIsGloballyExcluded).not.toHaveBeenCalled();
    });
  });

  describe('getKeys - exposure recording', () => {
    it('should call recordExposureIfNotExists with included flag ids and user id', async () => {
      const userDoc = { id: 'user123', group: {}, workingGroup: {} } as any;
      const exposureRepo = module.get(getRepositoryToken(FeatureFlagExposureRepository)) as any;
      const experimentAssignmentService = module.get<ExperimentAssignmentService>(ExperimentAssignmentService);

      flagRepo.getFlagsFromContext = jest.fn().mockResolvedValue([]);
      service.cacheService.wrap = jest.fn().mockResolvedValue([mockFlag1]);
      (experimentAssignmentService.inclusionExclusionLogic as jest.Mock).mockResolvedValue([[mockFlag1.id], []]);

      await service.getKeys(userDoc, 'context1', logger);

      expect(exposureRepo.recordExposureIfNotExists).toHaveBeenCalledWith([mockFlag1.id], userDoc.id);
    });

    it('should not call recordExposureIfNotExists when no flags are included', async () => {
      const userDoc = { id: 'user123', group: {}, workingGroup: {} } as any;
      const exposureRepo = module.get(getRepositoryToken(FeatureFlagExposureRepository)) as any;
      const experimentAssignmentService = module.get<ExperimentAssignmentService>(ExperimentAssignmentService);

      flagRepo.getFlagsFromContext = jest.fn().mockResolvedValue([]);
      service.cacheService.wrap = jest.fn().mockResolvedValue([mockFlag1]);
      (experimentAssignmentService.inclusionExclusionLogic as jest.Mock).mockResolvedValue([[], []]);

      await service.getKeys(userDoc, 'context1', logger);

      expect(exposureRepo.recordExposureIfNotExists).not.toHaveBeenCalled();
    });

    it('should not use dataSource.transaction for exposure recording', async () => {
      const userDoc = { id: 'user123', group: {}, workingGroup: {} } as any;
      const experimentAssignmentService = module.get<ExperimentAssignmentService>(ExperimentAssignmentService);

      flagRepo.getFlagsFromContext = jest.fn().mockResolvedValue([]);
      service.cacheService.wrap = jest.fn().mockResolvedValue([mockFlag1]);
      (experimentAssignmentService.inclusionExclusionLogic as jest.Mock).mockResolvedValue([[mockFlag1.id], []]);

      await service.getKeys(userDoc, 'context1', logger);

      expect(dataSource.transaction).not.toHaveBeenCalled();
    });
  });

  describe('featureFlagLevelInclusionExclusion - filterMode segment handling', () => {
    it('EXCLUDE_ALL: passes enabled inclusion segment IDs to resolveSegmentsForEntities', async () => {
      const userDoc = { id: 'user123', group: {}, workingGroup: {} } as any;
      const experimentAssignmentService = module.get<ExperimentAssignmentService>(ExperimentAssignmentService);
      const resolveSegmentsSpy = experimentAssignmentService.resolveSegmentsForEntities as jest.Mock;

      flagRepo.getFlagsFromContext = jest.fn().mockResolvedValue([]);
      service.cacheService.wrap = jest.fn().mockResolvedValue([excludeAllFlagWithInclusion]);
      resolveSegmentsSpy.mockResolvedValue([{}, {}]);

      await service.getKeys(userDoc, 'context1', logger);

      expect(resolveSegmentsSpy).toHaveBeenCalledTimes(1);
      const segmentObjMap = resolveSegmentsSpy.mock.calls[0][0];
      expect(segmentObjMap[excludeAllFlagWithInclusion.id].currentIncludedSegmentIds).toEqual([
        inclusionSegmentForExcludeAll.id,
      ]);
    });

    it('INCLUDE_ALL: does not pass inclusion segment IDs to resolveSegmentsForEntities', async () => {
      const userDoc = { id: 'user123', group: {}, workingGroup: {} } as any;
      const experimentAssignmentService = module.get<ExperimentAssignmentService>(ExperimentAssignmentService);
      const resolveSegmentsSpy = experimentAssignmentService.resolveSegmentsForEntities as jest.Mock;

      flagRepo.getFlagsFromContext = jest.fn().mockResolvedValue([]);
      service.cacheService.wrap = jest.fn().mockResolvedValue([includeAllFlagWithInclusion]);
      resolveSegmentsSpy.mockResolvedValue([{}, {}]);

      await service.getKeys(userDoc, 'context1', logger);

      expect(resolveSegmentsSpy).toHaveBeenCalledTimes(1);
      const segmentObjMap = resolveSegmentsSpy.mock.calls[0][0];
      expect(segmentObjMap[includeAllFlagWithInclusion.id].currentIncludedSegmentIds).toEqual([]);
    });

    it('should exclude disabled inclusion segments regardless of filterMode', async () => {
      const userDoc = { id: 'user123', group: {}, workingGroup: {} } as any;
      const experimentAssignmentService = module.get<ExperimentAssignmentService>(ExperimentAssignmentService);
      const resolveSegmentsSpy = experimentAssignmentService.resolveSegmentsForEntities as jest.Mock;

      const flagWithDisabledInclusion = new FeatureFlag();
      flagWithDisabledInclusion.id = 'flag-disabled-inclusion';
      flagWithDisabledInclusion.key = 'flag-disabled-key';
      flagWithDisabledInclusion.filterMode = FILTER_MODE.EXCLUDE_ALL;
      flagWithDisabledInclusion.featureFlagSegmentInclusion = [
        { enabled: false, segment: { id: 'disabled-seg-id' } } as FeatureFlagSegmentInclusion,
      ];
      flagWithDisabledInclusion.featureFlagSegmentExclusion = [];

      flagRepo.getFlagsFromContext = jest.fn().mockResolvedValue([]);
      service.cacheService.wrap = jest.fn().mockResolvedValue([flagWithDisabledInclusion]);
      resolveSegmentsSpy.mockResolvedValue([{}, {}]);

      await service.getKeys(userDoc, 'context1', logger);

      expect(resolveSegmentsSpy).toHaveBeenCalledTimes(1);
      const segmentObjMap = resolveSegmentsSpy.mock.calls[0][0];
      expect(segmentObjMap[flagWithDisabledInclusion.id].currentIncludedSegmentIds).toEqual([]);
    });
  });

  describe('getKeys - precomputed segment fast path', () => {
    const fastFlag = { id: 'fast-flag-id', key: 'fast-key', filterMode: FILTER_MODE.INCLUDE_ALL };

    it('uses the precomputed set and skips on-the-fly resolution when a row exists', async () => {
      const userDoc = { id: 'user123', group: {}, workingGroup: {} } as any;
      const experimentAssignmentService = module.get<ExperimentAssignmentService>(ExperimentAssignmentService);
      const precomputed = module.get<FeatureFlagPrecomputedSegmentService>(FeatureFlagPrecomputedSegmentService);

      service.cacheService.wrap = jest.fn().mockResolvedValue([fastFlag]);
      (precomputed.getPrecomputedSets as jest.Mock).mockResolvedValue(
        new Map([[fastFlag.id, { inclusionIds: [], exclusionIds: ['user123'] }]])
      );

      const result = await service.getKeys(userDoc, 'context1', logger);

      // user123 is individually excluded -> flag filtered out
      expect(result).toEqual([]);
      // fast path must not fall back to recursive resolution
      expect(experimentAssignmentService.resolveSegmentsForEntities).not.toHaveBeenCalled();
    });

    it('INCLUDE_ALL ignores individual inclusion: a group exclusion still excludes the user', async () => {
      const userDoc = { id: 'user123', group: { classId: ['bad-class'] }, workingGroup: {} } as any;
      const precomputed = module.get<FeatureFlagPrecomputedSegmentService>(FeatureFlagPrecomputedSegmentService);

      service.cacheService.wrap = jest.fn().mockResolvedValue([fastFlag]);
      // stored group IDs are namespaced with their type (classId:bad-class); individuals stay bare.
      // The user is individually on the include list AND their group is on the exclude list. Under
      // INCLUDE_ALL, include lists are not an explicit override, so the group exclusion wins.
      (precomputed.getPrecomputedSets as jest.Mock).mockResolvedValue(
        new Map([[fastFlag.id, { inclusionIds: ['user123'], exclusionIds: ['classId:bad-class'] }]])
      );

      const result = await service.getKeys(userDoc, 'context1', logger);

      expect(result).toEqual([]);
    });

    it('EXCLUDE_ALL still honors individual inclusion over a group exclusion', async () => {
      const excludeAllFlag = { id: 'ea-flag-id', key: 'ea-key', filterMode: FILTER_MODE.EXCLUDE_ALL };
      const userDoc = { id: 'user123', group: { classId: ['bad-class'] }, workingGroup: {} } as any;
      const precomputed = module.get<FeatureFlagPrecomputedSegmentService>(FeatureFlagPrecomputedSegmentService);

      service.cacheService.wrap = jest.fn().mockResolvedValue([excludeAllFlag]);
      // Same data as the INCLUDE_ALL case above. Under EXCLUDE_ALL, individual inclusion IS explicit,
      // so it bypasses the group exclusion and the user is included.
      (precomputed.getPrecomputedSets as jest.Mock).mockResolvedValue(
        new Map([[excludeAllFlag.id, { inclusionIds: ['user123'], exclusionIds: ['classId:bad-class'] }]])
      );

      const result = await service.getKeys(userDoc, 'context1', logger);

      expect(result).toEqual([excludeAllFlag.key]);
    });

    it('matches a group exclusion only when the group type also matches (type-aware)', async () => {
      const excludeFlag = { id: 'ex-flag-id', key: 'ex-key', filterMode: FILTER_MODE.INCLUDE_ALL };
      const precomputed = module.get<FeatureFlagPrecomputedSegmentService>(FeatureFlagPrecomputedSegmentService);
      service.cacheService.wrap = jest.fn().mockResolvedValue([excludeFlag]);

      // User is in group 'grpA' under type 'classId'. The stored exclusion targets 'grpA' under a
      // DIFFERENT type ('schoolId'), so with type-aware matching the user is NOT excluded.
      const wrongType = { id: 'user123', group: { classId: ['grpA'] }, workingGroup: {} } as any;
      (precomputed.getPrecomputedSets as jest.Mock).mockResolvedValue(
        new Map([[excludeFlag.id, { inclusionIds: [], exclusionIds: ['schoolId:grpA'] }]])
      );
      expect(await service.getKeys(wrongType, 'context1', logger)).toEqual([excludeFlag.key]);

      // Same group ID under the MATCHING type -> excluded.
      const rightType = { id: 'user123', group: { schoolId: ['grpA'] }, workingGroup: {} } as any;
      (precomputed.getPrecomputedSets as jest.Mock).mockResolvedValue(
        new Map([[excludeFlag.id, { inclusionIds: [], exclusionIds: ['schoolId:grpA'] }]])
      );
      expect(await service.getKeys(rightType, 'context1', logger)).toEqual([]);
    });

    it('does not treat a group ID that collides with the user ID as an individual match', async () => {
      // A group named the same string as the user's individual ID is excluded. Because groups are
      // namespaced (schoolId:user123) and the individual check is bare (user123), the user must NOT
      // be individually excluded — they are only excluded if they actually belong to that group.
      const collideFlag = { id: 'col-flag-id', key: 'col-key', filterMode: FILTER_MODE.INCLUDE_ALL };
      const precomputed = module.get<FeatureFlagPrecomputedSegmentService>(FeatureFlagPrecomputedSegmentService);
      service.cacheService.wrap = jest.fn().mockResolvedValue([collideFlag]);

      const userDoc = { id: 'user123', group: {}, workingGroup: {} } as any;
      (precomputed.getPrecomputedSets as jest.Mock).mockResolvedValue(
        new Map([[collideFlag.id, { inclusionIds: [], exclusionIds: ['schoolId:user123'] }]])
      );

      // Not in the excluded group -> stays included (INCLUDE_ALL)
      expect(await service.getKeys(userDoc, 'context1', logger)).toEqual([collideFlag.key]);
    });

    it('falls back to on-the-fly resolution when the precomputed row is missing', async () => {
      const userDoc = { id: 'user123', group: {}, workingGroup: {} } as any;
      const experimentAssignmentService = module.get<ExperimentAssignmentService>(ExperimentAssignmentService);
      const resolveSegmentsSpy = experimentAssignmentService.resolveSegmentsForEntities as jest.Mock;
      const precomputed = module.get<FeatureFlagPrecomputedSegmentService>(FeatureFlagPrecomputedSegmentService);

      service.cacheService.wrap = jest.fn().mockResolvedValue([fastFlag]);
      (precomputed.getPrecomputedSets as jest.Mock).mockResolvedValue(new Map()); // no row -> fallback
      resolveSegmentsSpy.mockResolvedValue([{}, {}]);

      await service.getKeys(userDoc, 'context1', logger);

      expect(resolveSegmentsSpy).toHaveBeenCalledTimes(1);
    });

    it('falls back to on-the-fly resolution (does not throw) when the precomputed table read fails', async () => {
      const userDoc = { id: 'user123', group: {}, workingGroup: {} } as any;
      const experimentAssignmentService = module.get<ExperimentAssignmentService>(ExperimentAssignmentService);
      const resolveSegmentsSpy = experimentAssignmentService.resolveSegmentsForEntities as jest.Mock;
      const precomputed = module.get<FeatureFlagPrecomputedSegmentService>(FeatureFlagPrecomputedSegmentService);

      service.cacheService.wrap = jest.fn().mockResolvedValue([fastFlag]);
      // Simulates the table not existing yet (e.g. migration not run): getPrecomputedSets rejects.
      (precomputed.getPrecomputedSets as jest.Mock).mockRejectedValue(
        new Error('relation "feature_flag_precomputed_segment" does not exist')
      );
      resolveSegmentsSpy.mockResolvedValue([{}, {}]);

      // must resolve (not reject) and still route through the on-the-fly fallback
      await expect(service.getKeys(userDoc, 'context1', logger)).resolves.toBeDefined();
      expect(resolveSegmentsSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('precomputed recompute + seed triggers', () => {
    it('seeds an empty precomputed row in-transaction when a flag is created', async () => {
      const precomputed = module.get<FeatureFlagPrecomputedSegmentService>(FeatureFlagPrecomputedSegmentService);
      flagRepo.insertFeatureFlag = jest.fn().mockResolvedValue([mockFlag1]);

      await service.create(mockFlag2, mockUser1, logger);

      expect(precomputed.seedEmptyRowForFlag).toHaveBeenCalledWith(mockFlag1.id, expect.anything());
    });

    it('recomputes the affected flag after addList (standalone) via withRecompute', async () => {
      const precomputed = module.get<FeatureFlagPrecomputedSegmentService>(FeatureFlagPrecomputedSegmentService);

      await service.addList([mockList], LIST_FILTER_MODE.INCLUSION, mockUser1, logger);

      expect(precomputed.withRecompute).toHaveBeenCalled();
      // the resolver handed to withRecompute yields the affected flag id
      const [, resolveAffectedFlagIds] = (precomputed.withRecompute as jest.Mock).mock.calls[0];
      expect(await resolveAffectedFlagIds()).toEqual([mockList.id]);
    });

    it('recomputes imported flags after the import transaction commits', async () => {
      const precomputed = module.get<FeatureFlagPrecomputedSegmentService>(FeatureFlagPrecomputedSegmentService);

      await service.importFeatureFlags(
        [{ fileName: 'import.json', fileContent: JSON.stringify(mockFlag4) }],
        mockUser1,
        logger
      );

      expect(precomputed.recomputeForFlag).toHaveBeenCalled();
    });
  });
});
