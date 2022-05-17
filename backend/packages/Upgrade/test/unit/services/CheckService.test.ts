import { CheckService } from '../../../src/api/services/CheckService';
import { Repository } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GroupAssignmentRepository } from '../../../src/api/repositories/GroupAssignmentRepository';
import { IndividualAssignmentRepository } from '../../../src/api/repositories/IndividualAssignmentRepository';
import { GroupExclusionRepository } from '../../../src/api/repositories/GroupExclusionRepository';
import { IndividualExclusionRepository } from '../../../src/api/repositories/IndividualExclusionRepository';
import { MonitoredExperimentPointRepository } from '../../../src/api/repositories/MonitoredExperimentPointRepository';


let checkArr = [1, 2, 3];


describe('Check Service Testing', () => {

    let service: CheckService;
    let groupAssignmentRepository: Repository<GroupAssignmentRepository>;
    let individualAssignmentRepository: Repository<IndividualAssignmentRepository>;
    let groupExclusionRepository: Repository<GroupExclusionRepository>;
    let individualExclusionRepository: Repository<IndividualExclusionRepository>;
    let monitoredExperimentPointRepository: Repository<MonitoredExperimentPointRepository>;
    let module: TestingModule;

    beforeEach(async () => {
        module = await Test.createTestingModule({
            providers: [
                CheckService,
                GroupAssignmentRepository,
                IndividualAssignmentRepository,
                GroupExclusionRepository,
                IndividualExclusionRepository,
                MonitoredExperimentPointRepository,
                {
                    provide: getRepositoryToken(GroupAssignmentRepository),
                    useValue: {
                        find: jest.fn().mockResolvedValue(checkArr)
                    }
                },
                {
                    provide: getRepositoryToken(IndividualAssignmentRepository),
                    useValue: {
                        find: jest.fn().mockResolvedValue(checkArr)
                    }
                },
                {
                    provide: getRepositoryToken(GroupExclusionRepository),
                    useValue: {
                        find: jest.fn().mockResolvedValue(checkArr)
                    }
                },
                {
                    provide: getRepositoryToken(IndividualExclusionRepository),
                    useValue: {
                        find: jest.fn().mockResolvedValue(checkArr)
                    }
                },
                {
                    provide: getRepositoryToken(MonitoredExperimentPointRepository),
                    useValue: {
                        find: jest.fn().mockResolvedValue(checkArr)
                    }
                }
            ]
        }).compile()

        service = module.get<CheckService>(CheckService);
        groupAssignmentRepository = module.get<Repository<GroupAssignmentRepository>>(getRepositoryToken(GroupAssignmentRepository));
        individualAssignmentRepository = module.get<Repository<IndividualAssignmentRepository>>(getRepositoryToken(IndividualAssignmentRepository));
        groupExclusionRepository = module.get<Repository<GroupExclusionRepository>>(getRepositoryToken(GroupExclusionRepository));
        individualExclusionRepository = module.get<Repository<IndividualExclusionRepository>>(getRepositoryToken(IndividualExclusionRepository));
        monitoredExperimentPointRepository = module.get<Repository<MonitoredExperimentPointRepository>>(getRepositoryToken(MonitoredExperimentPointRepository));
    })


    it('should be defined', async() => {
        expect(service).toBeDefined()
    })

    it('should have the group assignment repository mocked', async() => {
        expect(await groupAssignmentRepository.find()).toEqual(checkArr)
    })

    it('should have the individual assignment repository mocked', async() => {
        expect(await individualAssignmentRepository.find()).toEqual(checkArr)
    })

    it('should have the group exclusion repository mocked', async() => {
        expect(await groupExclusionRepository.find()).toEqual(checkArr)
    })

    it('should have the individual exclusion repository mocked', async() => {
        expect(await individualExclusionRepository.find()).toEqual(checkArr)
    })
    
    it('should have the monitored experiment point repository mocked', async() => {
        expect(await monitoredExperimentPointRepository.find()).toEqual(checkArr)
    })

    it('should return all group assignments', async() => {
        const flags = await service.getAllGroupAssignments();
        expect(flags).toEqual(checkArr)
    })

    it('should return all individual assignments', async() => {
        const flags = await service.getAllIndividualAssignment();
        expect(flags).toEqual(checkArr)
    })

    it('should return all group exclusions', async() => {
        const flags = await service.getAllGroupExclusions();
        expect(flags).toEqual(checkArr)
    })

    it('should return all individual exclusions', async() => {
        const flags = await service.getAllIndividualExclusion();
        expect(flags).toEqual(checkArr)
    })

    it('should return all marked experiment points', async() => {
        const flags = await service.getAllMarkedExperimentPoints();
        expect(flags).toEqual(checkArr)
    })
});

