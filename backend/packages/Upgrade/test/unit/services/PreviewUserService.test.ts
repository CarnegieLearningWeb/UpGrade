import { PreviewUserService } from '../../../src/api/services/PreviewUserService';
import { Repository } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';
import { Experiment } from '../../../src/api/models/Experiment';
import { ErrorService } from '../../../src/api/services/ErrorService';
import { ExplicitIndividualAssignmentRepository } from '../../../src/api/repositories/ExplicitIndividualAssignmentRepository';
import { UserRepository } from '../../../src/api/repositories/UserRepository';
import { PreviewUserRepository } from '../../../src/api/repositories/PreviewUserRepository';
import { ExplicitIndividualAssignment } from '../../../src/api/models/ExplicitIndividualAssignment';
import { ExperimentCondition } from '../../../src/api/models/ExperimentCondition';
import { PreviewUser } from '../../../src/api/models/PreviewUser';
import { isUUID } from 'class-validator';

let logger = new UpgradeLogger();

describe('Preview User Service Testing', () => {

    let service: PreviewUserService;
    let userRepo: Repository<PreviewUserRepository>;
    let module: TestingModule;

    let assign1 = new ExplicitIndividualAssignment();
    let exp1 = new Experiment();
    let cond1 = new ExperimentCondition()
    let mockUser1 = new PreviewUser();
    mockUser1.id = 'user1'
    exp1.id = 'exp1'
    cond1.id = 'cond1'
    assign1.id = 'assign1'
    assign1.experiment = exp1;
    assign1.experimentCondition = cond1;
    mockUser1.assignments = [assign1]

    let assign2 = new ExplicitIndividualAssignment();
    let exp2 = new Experiment();
    let cond2 = new ExperimentCondition()
    let mockUser2 = new PreviewUser();
    mockUser2.id = 'user2'
    exp2.id = 'exp2'
    cond2.id = 'cond2'
    assign2.id = 'assign2'
    assign2.experiment = exp2;
    assign2.experimentCondition = cond2;
    mockUser2.assignments = [assign1, assign2]

    let mockUserArr = [mockUser1, mockUser2]

    beforeEach(async () => {
        module = await Test.createTestingModule({
            providers: [
                PreviewUserService,
                PreviewUserRepository,
                UserRepository,
                ExplicitIndividualAssignmentRepository,
                {
                    provide: getRepositoryToken(PreviewUserRepository),
                    useValue: {
                        find: jest.fn().mockResolvedValue(mockUserArr),
                        findOne: jest.fn().mockResolvedValue(mockUser1),
                        findWithNames: jest.fn().mockResolvedValue(mockUserArr),
                        findOneById: jest.fn().mockResolvedValue(mockUser1),
                        count: jest.fn().mockResolvedValue(mockUserArr.length),
                        findPaginated: jest.fn().mockResolvedValue(mockUserArr),
                        save: jest.fn().mockImplementation((user: Partial<PreviewUser>)=> {return user.id})
                    }
                },
                {
                    provide: getRepositoryToken(ExplicitIndividualAssignmentRepository),
                    useValue: {
                        find: jest.fn().mockResolvedValue(mockUserArr),
                    }
                },
                {
                    provide: ErrorService,
                    useValue: {
                        create: jest.fn()
                    }
                }
            ]
        }).compile()

        service = module.get<PreviewUserService>(PreviewUserService);
        userRepo = module.get<Repository<PreviewUserRepository>>(getRepositoryToken(PreviewUserRepository));
    })


    it('should be defined', async () => {
        expect(service).toBeDefined()
    })

    it('should have the repo mocked', async () => {
        expect(await userRepo.find()).toEqual(mockUserArr)
    })

    
    it('should find all preview users', async() => {
        const results = await service.find(logger)
        expect(results).toEqual(mockUserArr)
    })

    it('should find all preview users with id', async() => {
        const results = await service.findOne('user1', logger)
        expect(results).toEqual(mockUser1)
    })

    it('should return a count of preview users', async() =>{
        const results = await service.getTotalCount(logger);
        expect(results).toEqual(mockUserArr.length)
    })

    it('should find all paginated preview users', async() => {
        const results = await service.findPaginated(1, 2, logger)
        expect(results).toEqual(mockUserArr)
    })

    it('should create a user', async() => {
        const results = await service.create( {assignments: [assign1]}, logger);
        expect(isUUID(results)).toBeTruthy()
    })

    it('should update the user id', async() => {
        const newId = 'newId'
        const results = await service.update(newId, mockUser1, logger);
        expect(results).toEqual(newId)
    })
    
});