import { FeatureFlagService } from '../../../src/api/services/FeatureFlagService';
import * as sinon from 'sinon';
import { Connection, ConnectionManager, Repository } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';
import { ErrorService } from '../../../src/api/services/ErrorService';
import { FeatureFlagRepository } from '../../../src/api/repositories/FeatureFlagRepository';
import { FeatureFlag } from '../../../src/api/models/FeatureFlag';
import { FlagVariationRepository } from '../../../src/api/repositories/FlagVariationRepository';
import { FLAG_SEARCH_SORT_KEY } from '../../../src/api/controllers/validators/FeatureFlagsPaginatedParamsValidator';
import { EXPERIMENT_SORT_AS } from '../../../../../../types/src';
import { FlagVariation } from '../../../src/api/models/FlagVariation';
import { isUUID } from 'class-validator';

describe('Feature Flag Service Testing', () => {
  let service: FeatureFlagService;
  let flagRepo: Repository<FeatureFlagRepository>;
  let flagVariationRepo: Repository<FlagVariationRepository>;
  let module: TestingModule;

  const logger = new UpgradeLogger();
  const var1 = new FlagVariation();
  var1.id = 'var1';
  const var2 = new FlagVariation();
  var2.id = 'var2';
  const var3 = new FlagVariation();

  const mockFlag1 = new FeatureFlag();
  mockFlag1.id = 'flag1';
  mockFlag1.variations = [var1, var2, var3];

  const mockFlag2 = new FeatureFlag();
  mockFlag2.id = 'flag2';
  mockFlag1.variations = [var2, var3];

  const mockFlag3 = new FeatureFlag();

  const mockFlagArr = [mockFlag1, mockFlag2, mockFlag3];

  const takeSpy = jest.fn().mockReturnThis();
  const skipSpy = jest.fn().mockReturnThis();
  const addSelectSpy = jest.fn().mockReturnThis();
  const setParamaterSpy = jest.fn().mockReturnThis();
  const addOrderBySpy = jest.fn().mockReturnThis();

  const queryBuilderMock = {
    addSelect: addSelectSpy,
    addOrderBy: addOrderBySpy,
    setParameter: setParamaterSpy,
    where: jest.fn().mockReturnThis(),
    skip: skipSpy,
    take: takeSpy,
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
        FeatureFlagRepository,
        FlagVariationRepository,
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
              skip: skipSpy,
              take: takeSpy,
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
    flagRepo = module.get<Repository<FeatureFlagRepository>>(getRepositoryToken(FeatureFlagRepository));
    flagVariationRepo = module.get<Repository<FlagVariationRepository>>(getRepositoryToken(FlagVariationRepository));
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
    }).rejects.toThrow(err);
  });

  it('should throw an error when create variation fails', async () => {
    const err = new Error('insert error');
    flagVariationRepo.insertVariations = jest.fn().mockRejectedValue(err);
    expect(async () => {
      await service.create(mockFlag1, logger);
    }).rejects.toThrow(err);
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
    mockFlag3.variations = [var3];
    const results = await service.update(mockFlag3, logger);
    expect(isUUID(results.id)).toBeTruthy();
  });

  it('should throw an error when unable to update flag', async () => {
    const err = new Error('insert error');
    flagRepo.updateFeatureFlag = jest.fn().mockRejectedValue(err);
    expect(async () => {
      await service.update(mockFlag1, logger);
    }).rejects.toThrow(err);
  });

  it('should throw an error when unable to update flag variation', async () => {
    const err = new Error('insert error');
    flagVariationRepo.upsertFlagVariation = jest.fn().mockRejectedValue(err);
    expect(async () => {
      await service.update(mockFlag1, logger);
    }).rejects.toThrow(err);
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
