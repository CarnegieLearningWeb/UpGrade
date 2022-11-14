import { ExcludeService } from '../../../src/api/services/ExcludeService';
import { Repository } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ExplicitGroupExclusionRepository } from '../../../src/api/repositories/ExplicitGroupExclusionRepository';
import { ExplicitIndividualExclusionRepository } from '../../../src/api/repositories/ExplicitIndividualExclusionRepository';
import { ExplicitIndividualExclusion } from '../../../src/api/models/ExplicitIndividualExclusion';
import { ExplicitGroupExclusion } from '../../../src/api/models/ExplicitGroupExclusion';

let exludeArr = [1, 2, 3];
let explicitIndividualExclusion = new ExplicitIndividualExclusion();
let explicitGroupExclusion = new ExplicitGroupExclusion();

describe('Exclude Service Testing', () => {
  let service: ExcludeService;
  let explicitGroupExclusionRepository: Repository<ExplicitGroupExclusionRepository>;
  let explicitIndividualExclusionRepository: Repository<ExplicitIndividualExclusionRepository>;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        ExcludeService,
        ExplicitGroupExclusionRepository,
        ExplicitIndividualExclusionRepository,
        {
          provide: getRepositoryToken(ExplicitGroupExclusionRepository),
          useValue: {
            find: jest.fn().mockResolvedValue(exludeArr),
            saveRawJson: jest.fn().mockResolvedValue(explicitGroupExclusion),
            deleteGroup: jest.fn().mockResolvedValue(explicitGroupExclusion),
          },
        },
        {
          provide: getRepositoryToken(ExplicitIndividualExclusionRepository),
          useValue: {
            find: jest.fn().mockResolvedValue(exludeArr),
            saveRawJson: jest.fn().mockResolvedValue(explicitIndividualExclusion),
            deleteById: jest.fn().mockResolvedValue(explicitIndividualExclusion),
          },
        },
      ],
    }).compile();

    service = module.get<ExcludeService>(ExcludeService);
    explicitGroupExclusionRepository = module.get<Repository<ExplicitGroupExclusionRepository>>(
      getRepositoryToken(ExplicitGroupExclusionRepository)
    );
    explicitIndividualExclusionRepository = module.get<Repository<ExplicitIndividualExclusionRepository>>(
      getRepositoryToken(ExplicitIndividualExclusionRepository)
    );
  });

  it('should be defined', async () => {
    expect(service).toBeDefined();
  });

  it('should have the explicit group exclusion repository mocked', async () => {
    expect(await explicitGroupExclusionRepository.find()).toEqual(exludeArr);
  });

  it('should have the explicit individual exclusion repository mocked', async () => {
    expect(await explicitIndividualExclusionRepository.find()).toEqual(exludeArr);
  });

  it('should return an array of all users', async () => {
    const flags = await service.getAllUser();
    expect(flags).toEqual(exludeArr);
  });

  it('should return a user', async () => {
    const flags = await service.excludeUser('userId');
    expect(flags).toEqual(explicitIndividualExclusion);
  });

  it('should return a user', async () => {
    const flags = await service.deleteUser('userId');
    expect(flags).toEqual(explicitIndividualExclusion);
  });

  it('should return an array of all groups', async () => {
    const flags = await service.getAllGroups();
    expect(flags).toEqual(exludeArr);
  });

  it('should return a group', async () => {
    const flags = await service.excludeGroup('groupId', 'type');
    expect(flags).toEqual(explicitGroupExclusion);
  });

  it('should return a group', async () => {
    const flags = await service.deleteGroup('groupId', 'type');
    expect(flags).toEqual(explicitGroupExclusion);
  });
});
