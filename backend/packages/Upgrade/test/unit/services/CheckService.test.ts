import { IndividualEnrollmentRepository } from './../../../src/api/repositories/IndividualEnrollmentRepository';
import { GroupEnrollmentRepository } from './../../../src/api/repositories/GroupEnrollmentRepository';
import { CheckService } from '../../../src/api/services/CheckService';
import { Repository } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GroupExclusionRepository } from '../../../src/api/repositories/GroupExclusionRepository';
import { IndividualExclusionRepository } from '../../../src/api/repositories/IndividualExclusionRepository';
import { MonitoredDecisionPointRepository } from '../../../src/api/repositories/MonitoredDecisionPointRepository';

const checkArr = [1, 2, 3];

describe('Check Service Testing', () => {
  let service: CheckService;
  let groupEnrollmentRepository: Repository<GroupEnrollmentRepository>;
  let individualEnrollmentRepository: Repository<IndividualEnrollmentRepository>;
  let groupExclusionRepository: Repository<GroupExclusionRepository>;
  let individualExclusionRepository: Repository<IndividualExclusionRepository>;
  let monitoredDecisionPointRepository: Repository<MonitoredDecisionPointRepository>;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        CheckService,
        GroupEnrollmentRepository,
        IndividualEnrollmentRepository,
        GroupExclusionRepository,
        IndividualExclusionRepository,
        MonitoredDecisionPointRepository,
        {
          provide: getRepositoryToken(GroupEnrollmentRepository),
          useValue: {
            find: jest.fn().mockResolvedValue(checkArr),
          },
        },
        {
          provide: getRepositoryToken(IndividualEnrollmentRepository),
          useValue: {
            find: jest.fn().mockResolvedValue(checkArr),
          },
        },
        {
          provide: getRepositoryToken(GroupExclusionRepository),
          useValue: {
            find: jest.fn().mockResolvedValue(checkArr),
          },
        },
        {
          provide: getRepositoryToken(IndividualExclusionRepository),
          useValue: {
            find: jest.fn().mockResolvedValue(checkArr),
          },
        },
        {
          provide: getRepositoryToken(MonitoredDecisionPointRepository),
          useValue: {
            find: jest.fn().mockResolvedValue(checkArr),
          },
        },
      ],
    }).compile();

    service = module.get<CheckService>(CheckService);
    groupEnrollmentRepository = module.get<Repository<GroupEnrollmentRepository>>(
      getRepositoryToken(GroupEnrollmentRepository)
    );
    individualEnrollmentRepository = module.get<Repository<IndividualEnrollmentRepository>>(
      getRepositoryToken(IndividualEnrollmentRepository)
    );
    groupExclusionRepository = module.get<Repository<GroupExclusionRepository>>(
      getRepositoryToken(GroupExclusionRepository)
    );
    individualExclusionRepository = module.get<Repository<IndividualExclusionRepository>>(
      getRepositoryToken(IndividualExclusionRepository)
    );
    monitoredDecisionPointRepository = module.get<Repository<MonitoredDecisionPointRepository>>(
      getRepositoryToken(MonitoredDecisionPointRepository)
    );
  });

  it('should be defined', async () => {
    expect(service).toBeDefined();
  });

  it('should have the group assignment repository mocked', async () => {
    expect(await groupEnrollmentRepository.find()).toEqual(checkArr);
  });

  it('should have the individual assignment repository mocked', async () => {
    expect(await individualEnrollmentRepository.find()).toEqual(checkArr);
  });

  it('should have the group exclusion repository mocked', async () => {
    expect(await groupExclusionRepository.find()).toEqual(checkArr);
  });

  it('should have the individual exclusion repository mocked', async () => {
    expect(await individualExclusionRepository.find()).toEqual(checkArr);
  });

  it('should have the monitored experiment point repository mocked', async () => {
    expect(await monitoredDecisionPointRepository.find()).toEqual(checkArr);
  });

  it('should return all group assignments', async () => {
    const flags = await service.getAllGroupAssignments();
    expect(flags).toEqual(checkArr);
  });

  it('should return all individual assignments', async () => {
    const flags = await service.getAllIndividualAssignment();
    expect(flags).toEqual(checkArr);
  });

  it('should return all group exclusions', async () => {
    const flags = await service.getAllGroupExclusions();
    expect(flags).toEqual(checkArr);
  });

  it('should return all individual exclusions', async () => {
    const flags = await service.getAllIndividualExclusion();
    expect(flags).toEqual(checkArr);
  });

  it('should return all marked experiment points', async () => {
    const flags = await service.getAllMarkedExperimentPoints();
    expect(flags).toEqual(checkArr);
  });
});
