import * as sinon from 'sinon';
import { Connection, ConnectionManager } from 'typeorm';
import { Test, TestingModuleBuilder } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { FeatureFlag } from '../../../src/api/models/FeatureFlag';

import { FeatureFlagRepository } from '../../../src/api/repositories/FeatureFlagRepository';

import { ErrorService } from '../../../src/api/services/ErrorService';
import { FeatureFlagService } from '../../../src/api/services/FeatureFlagService';

import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';

import {
  FLAG_SEARCH_KEY,
  FLAG_SORT_KEY,
} from '../../../src/api/controllers/validators/FeatureFlagsPaginatedParamsValidator';
import { FEATURE_FLAG_STATUS, FILTER_MODE, SEGMENT_TYPE, SORT_AS_DIRECTION } from 'upgrade_types';
import { isUUID } from 'class-validator';
import { v4 as uuid } from 'uuid';
import { ExperimentAssignmentService } from '../../../src/api/services/ExperimentAssignmentService';
import { FeatureFlagValidation } from '../../../src/api/controllers/validators/FeatureFlagValidator';
import { FeatureFlagListValidator } from '../../../src/api/controllers/validators/FeatureFlagListValidator';
import { SegmentService } from '../../../src/api/services/SegmentService';
import { FeatureFlagSegmentExclusionRepository } from '../../../src/api/repositories/FeatureFlagSegmentExclusionRepository';
import { FeatureFlagSegmentInclusionRepository } from '../../../src/api/repositories/FeatureFlagSegmentInclusionRepository';

describe('Feature Flag Service Testing', () => {
  let service: FeatureFlagService;
  let flagRepo: FeatureFlagRepository;

  let module: Awaited<ReturnType<TestingModuleBuilder['compile']>>;

  const logger = new UpgradeLogger();

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

  const mockList = new FeatureFlagListValidator();
  mockList.enabled = true;
  mockList.flagId = uuid();
  mockList.listType = 'individual';
  mockList.list = {
    name: 'name',
    id: uuid(),
    context: 'context',
    type: SEGMENT_TYPE.PRIVATE,
    userIds: ['user1'],
    groups: [],
    subSegmentIds: [],
  };
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

  const exposureRepoMock = { save: jest.fn() };
  const entityManagerMock = { createQueryBuilder: () => queryBuilderMock };
  const sandbox = sinon.createSandbox();
  sandbox.stub(ConnectionManager.prototype, 'get').returns({
    transaction: jest.fn(async (passedFunction) => await passedFunction(entityManagerMock)),
    getRepository: () => exposureRepoMock,
  } as unknown as Connection);

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        FeatureFlagService,
        {
          provide: ExperimentAssignmentService,
          useValue: {
            inclusionExclusionLogic: jest.fn().mockResolvedValue([[mockFlag1.id]]),
          },
        },
        {
          provide: SegmentService,
          useValue: {
            upsertSegmentInPipeline: jest.fn().mockResolvedValue(mockList),
            deleteSegment: jest.fn().mockResolvedValue(mockList),
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
          provide: getRepositoryToken(FeatureFlagSegmentExclusionRepository),
          useValue: {
            insertData: jest.fn().mockResolvedValue(mockList),
          },
        },
        {
          provide: getRepositoryToken(FeatureFlagSegmentInclusionRepository),
          useValue: {
            insertData: jest.fn().mockResolvedValue(mockList),
          },
        },

        {
          provide: ErrorService,
          useValue: {
            create: jest.fn(),
          },
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
      await service.create(mockFlag2, logger);
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
    const results = await service.update(mockFlag2, logger);
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
      await service.update(mockFlag2, logger);
    }).rejects.toThrow(
      new Error('Error in updating feature flag document "updateFeatureFlagInDB" Error: insert error')
    );
  });

  it('should update the flag state', async () => {
    const results = await service.updateState(mockFlag1.id, FEATURE_FLAG_STATUS.ENABLED);
    expect(results).toBeTruthy();
  });

  it('should update the filter mode', async () => {
    const results = await service.updateFilterMode(mockFlag1.id, FILTER_MODE.EXCLUDE_ALL);
    expect(results).toBeTruthy();
  });

  it('should delete the flag', async () => {
    const results = await service.delete(mockFlag1.id, logger);
    expect(results).toEqual(mockFlag1.id);
  });

  it('should return undefined when no flag to delete', async () => {
    service.findOne = jest.fn().mockResolvedValue(undefined);
    const results = await service.delete(mockFlag1.id, logger);
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

    flagRepo.getFlagsFromContext = jest.fn().mockResolvedValue([mockFlag1]);
    const result = await service.getKeys(userDoc, context, logger);

    expect(result.length).toEqual(1);
    expect(result).toEqual([mockFlag1.key]);
    expect(exposureRepoMock.save).toHaveBeenCalledTimes(1);
  });

  it('should add an include list', async () => {
    const result = await service.addList(mockList, 'include', logger);

    expect(result).toBeTruthy();
  });

  it('should delete an include list', async () => {
    const result = await service.deleteList(mockList.list.id, logger);

    expect(result).toBeTruthy();
  });
});
