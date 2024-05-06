import * as sinon from 'sinon';
import { Connection, ConnectionManager } from 'typeorm';
import { Test, TestingModuleBuilder } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { FeatureFlag } from '../../../src/api/models/FeatureFlag';
import { Segment } from '../../../src/api/models/Segment';

import { FeatureFlagRepository } from '../../../src/api/repositories/FeatureFlagRepository';
import { FeatureFlagSegmentInclusionRepository } from '../../../src/api/repositories/FeatureFlagSegmentInclusionRepository';
import { FeatureFlagSegmentExclusionRepository } from '../../../src/api/repositories/FeatureFlagSegmentExclusionRepository';

import { ErrorService } from '../../../src/api/services/ErrorService';
import { FeatureFlagService } from '../../../src/api/services/FeatureFlagService';
import { SegmentService } from '../../../src/api/services/SegmentService';
import { ExperimentService } from '../../../src/api/services/ExperimentService';

import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';

import {
  FLAG_SEARCH_KEY,
  FLAG_SORT_KEY,
} from '../../../src/api/controllers/validators/FeatureFlagsPaginatedParamsValidator';
import { SORT_AS_DIRECTION } from '../../../../../../types/src';
import { isUUID } from 'class-validator';
import { v4 as uuid } from 'uuid';
import { FEATURE_FLAG_STATUS } from 'upgrade_types';

describe('Feature Flag Service Testing', () => {
  let service: FeatureFlagService;
  let flagRepo: FeatureFlagRepository;
  let flagSegmentInclusionRepo: FeatureFlagSegmentInclusionRepository;
  let flagSegmentExclusionRepo: FeatureFlagSegmentExclusionRepository;
  let segmentService: SegmentService;

  let module: Awaited<ReturnType<TestingModuleBuilder['compile']>>;

  const logger = new UpgradeLogger();

  const seg1 = new Segment();

  const mockFlag1 = new FeatureFlag();
  mockFlag1.id = uuid();
  mockFlag1.name = 'name';
  mockFlag1.key = 'key';
  mockFlag1.description = 'description';
  mockFlag1.context = ['context'];
  mockFlag1.status = FEATURE_FLAG_STATUS.ENABLED;
  mockFlag1.featureFlagSegmentExclusion = {
    createdAt: new Date(),
    updatedAt: new Date(),
    versionNumber: 1,
    segment: seg1,
    featureFlag: mockFlag1,
  };
  mockFlag1.featureFlagSegmentInclusion = {
    createdAt: new Date(),
    updatedAt: new Date(),
    versionNumber: 1,
    segment: seg1,
    featureFlag: mockFlag1,
  };

  const mockFlag2 = new FeatureFlag();
  mockFlag2.id = uuid();
  mockFlag2.name = 'name';
  mockFlag2.key = 'key';
  mockFlag2.description = 'description';
  mockFlag2.context = ['context'];
  mockFlag2.status = FEATURE_FLAG_STATUS.ENABLED;
  mockFlag2.featureFlagSegmentExclusion = {
    createdAt: new Date(),
    updatedAt: new Date(),
    versionNumber: 1,
    segment: seg1,
    featureFlag: mockFlag2,
  };
  mockFlag2.featureFlagSegmentInclusion = {
    createdAt: new Date(),
    updatedAt: new Date(),
    versionNumber: 1,
    segment: seg1,
    featureFlag: mockFlag2,
  };

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
  const sandbox = sinon.createSandbox();
  sandbox.stub(ConnectionManager.prototype, 'get').returns({
    transaction: jest.fn(async (passedFunction) => await passedFunction(entityManagerMock)),
  } as unknown as Connection);

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        FeatureFlagService,
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
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              getMany: jest.fn().mockResolvedValue(mockFlagArr),
              getOne: jest.fn().mockResolvedValue(mockFlag1),
            })),
          },
        },
        {
          provide: getRepositoryToken(FeatureFlagSegmentInclusionRepository),
          useValue: {
            find: jest.fn().mockResolvedValue(''),
            insertData: jest.fn().mockResolvedValue(''),
            getFeatureFlagSegmentInclusionData: jest.fn().mockResolvedValue(''),
            deleteData: jest.fn().mockImplementation((seg) => {
              return seg;
            }),
          },
        },
        {
          provide: getRepositoryToken(FeatureFlagSegmentExclusionRepository),
          useValue: {
            find: jest.fn().mockResolvedValue(''),
            insertData: jest.fn().mockResolvedValue(''),
            getFeatureFlagSegmentExclusionData: jest.fn().mockResolvedValue(''),
            deleteData: jest.fn().mockImplementation((seg) => {
              return seg;
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
    flagSegmentInclusionRepo = module.get<FeatureFlagSegmentInclusionRepository>(
      getRepositoryToken(FeatureFlagSegmentInclusionRepository)
    );
    flagSegmentExclusionRepo = module.get<FeatureFlagSegmentExclusionRepository>(
      getRepositoryToken(FeatureFlagSegmentExclusionRepository)
    );
    segmentService = module.get<SegmentService>(SegmentService);
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
    expect(isUUID(results.featureFlagSegmentInclusion.segment.id)).toBeTruthy();
    expect(isUUID(results.featureFlagSegmentExclusion.segment.id)).toBeTruthy();
  });

  it('should throw an error when create flag fails', async () => {
    const err = new Error('insert error');
    flagRepo.insertFeatureFlag = jest.fn().mockRejectedValue(err);
    expect(async () => {
      await service.create(mockFlag1, logger);
    }).rejects.toThrow(new Error('Error in creating feature flag document "addFeatureFlagInDB" Error: insert error'));
  });

  it('should throw an error when create segment inclusion fails', async () => {
    const err = new Error('insert error');
    flagSegmentInclusionRepo.insertData = jest.fn().mockRejectedValue(err);
    expect(async () => {
      await service.create(mockFlag1, logger);
    }).rejects.toThrow(new Error('Error in creating inclusion or exclusion segments "addFeatureFlagInDB"'));
  });

  it('should throw an error when create segment exclusion fails', async () => {
    const err = new Error('insert error');
    flagSegmentExclusionRepo.insertData = jest.fn().mockRejectedValue(err);
    expect(async () => {
      await service.create(mockFlag1, logger);
    }).rejects.toThrow(new Error('Error in creating inclusion or exclusion segments "addFeatureFlagInDB"'));
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
    const results = await service.update(mockFlag1, logger);
    expect(isUUID(results.id)).toBeTruthy();
  });

  it('should update the flag with no id and no context', async () => {
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

  it('should throw an error when unable to update segment (for inclusion or exclusion', async () => {
    const err = new Error('insert error');
    segmentService.upsertSegment = jest.fn().mockRejectedValue(err);
    expect(async () => {
      await service.update(mockFlag1, logger);
    }).rejects.toThrow(err);
  });

  it('should update the flag state', async () => {
    const results = await service.updateState(mockFlag1.id, FEATURE_FLAG_STATUS.ENABLED);
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
