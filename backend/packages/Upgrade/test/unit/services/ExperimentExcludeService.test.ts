import { ExperimentExcludeService } from '../../../src/api/services/ExperimentExcludeService';
import { Repository } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ExplicitExperimentGroupExclusionRepository } from '../../../src/api/repositories/ExplicitExperimentGroupExclusionRepository';
import { ExplicitExperimentIndividualExclusionRepository } from '../../../src/api/repositories/ExplicitExperimentIndividualExclusionRepository';
import { ExplicitExperimentIndividualExclusion } from '../../../src/api/models/ExplicitExperimentIndividualExclusion';
import { ExplicitExperimentGroupExclusion } from '../../../src/api/models/ExplicitExperimentGroupExclusion';
import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';
import { ExperimentService } from '../../../src/api/services/ExperimentService';
import { ExperimentAuditLogRepository } from '../../../src/api/repositories/ExperimentAuditLogRepository';
import { ExperimentConditionRepository } from '../../../src/api/repositories/ExperimentConditionRepository';
import { ExperimentPartitionRepository } from '../../../src/api/repositories/ExperimentPartitionRepository';
import { ExperimentRepository } from '../../../src/api/repositories/ExperimentRepository';
import { ExperimentUserRepository } from '../../../src/api/repositories/ExperimentUserRepository';
import { GroupExclusionRepository } from '../../../src/api/repositories/GroupExclusionRepository';
import { IndividualExclusionRepository } from '../../../src/api/repositories/IndividualExclusionRepository';
import { MetricRepository } from '../../../src/api/repositories/MetricRepository';
import { MonitoredExperimentPointRepository } from '../../../src/api/repositories/MonitoredExperimentPointRepository';
import { QueryRepository } from '../../../src/api/repositories/QueryRepository';
import { StateTimeLogsRepository } from '../../../src/api/repositories/StateTimeLogsRepository';
import { ErrorService } from '../../../src/api/services/ErrorService';
import { PreviewUserService } from '../../../src/api/services/PreviewUserService';
import { ScheduledJobService } from '../../../src/api/services/ScheduledJobService';
import { ExplicitIndividualAssignmentRepository } from '../../../src/api/repositories/ExplicitIndividualAssignmentRepository';
import { PreviewUserRepository } from '../../../src/api/repositories/PreviewUserRepository';
import { ErrorRepository } from '../../../src/api/repositories/ErrorRepository';
import { ScheduledJobRepository } from '../../../src/api/repositories/ScheduledJobRepository';
import { AWSService } from '../../../src/api/services/AWSService';
import { Experiment } from '../../../src/api/models/Experiment';
import { EXPERIMENT_STATE } from '../../../../../../types/src';


let excludeArr = [1, 2, 3];
let explicitExperimentIndividualExclusion = new ExplicitExperimentIndividualExclusion();
let explicitExperimentGroupExclusion = new ExplicitExperimentGroupExclusion();
let logger = new UpgradeLogger();
let exp = new Experiment();
exp.state = EXPERIMENT_STATE.ENROLLING;
exp.id = 'exp1'
let expNotFoundError = new Error('experiment not found')


describe('Experiment Exclude Service Testing', () => {

    let service: ExperimentExcludeService;
    let explicitExperimentGroupExclusionRepository: Repository<ExplicitExperimentGroupExclusionRepository>;
    let explicitExperimentIndividualExclusionRepository: Repository<ExplicitExperimentIndividualExclusionRepository>;
    let module: TestingModule;

    beforeEach(async () => {
        module = await Test.createTestingModule({
            providers: [
                ExperimentService,
                ExperimentExcludeService,
                ExplicitExperimentGroupExclusionRepository,
                ExplicitExperimentIndividualExclusionRepository,
                ExperimentRepository,
                ExperimentConditionRepository,
                ExperimentPartitionRepository,
                ExperimentAuditLogRepository,
                IndividualExclusionRepository,
                GroupExclusionRepository,
                MonitoredExperimentPointRepository,
                ExperimentUserRepository,
                MetricRepository,
                QueryRepository,
                StateTimeLogsRepository,
                PreviewUserService,
                ScheduledJobService,
                ErrorService,
                PreviewUserRepository,
                ExplicitIndividualAssignmentRepository,
                ScheduledJobRepository,
                ErrorRepository,
                AWSService,
                {
                    provide: getRepositoryToken(ExplicitExperimentGroupExclusionRepository),
                    useValue: {
                        find: jest.fn().mockResolvedValue(excludeArr),
                        saveRawJson: jest.fn().mockResolvedValue(explicitExperimentGroupExclusion),
                        deleteGroup: jest.fn().mockResolvedValue(explicitExperimentGroupExclusion),
                        findOneById: jest.fn().mockResolvedValue(excludeArr[0]),
                        findAllGroups: jest.fn().mockResolvedValue(excludeArr),
                        insertExplicitExperimentGroupExclusion: jest.fn().mockResolvedValue(excludeArr)
                    }
                },
                {
                    provide: getRepositoryToken(ExplicitExperimentIndividualExclusionRepository),
                    useValue: {
                        find: jest.fn().mockResolvedValue(excludeArr),
                        saveRawJson: jest.fn().mockResolvedValue(explicitExperimentIndividualExclusion),
                        deleteById: jest.fn().mockResolvedValue(explicitExperimentIndividualExclusion),
                        findOneById: jest.fn().mockResolvedValue(excludeArr[0]),
                        findAllUsers: jest.fn().mockResolvedValue(excludeArr),
                        insertExplicitExperimentIndividualExclusion: jest.fn().mockResolvedValue(excludeArr)
                    }
                }
            ]
        }).compile()

        service = module.get<ExperimentExcludeService>(ExperimentExcludeService);
        explicitExperimentGroupExclusionRepository = module.get<Repository<ExplicitExperimentGroupExclusionRepository>>(getRepositoryToken(ExplicitExperimentGroupExclusionRepository));
        explicitExperimentIndividualExclusionRepository = module.get<Repository<ExplicitExperimentIndividualExclusionRepository>>(getRepositoryToken(ExplicitExperimentIndividualExclusionRepository));
    })


    it('should be defined', async() => {
        expect(service).toBeDefined()
    })

    it('should have the explicit group exclusion repository mocked', async() => {
        expect(await explicitExperimentGroupExclusionRepository.find()).toEqual(excludeArr)
    })

    it('should have the explicit individual exclusion repository mocked', async() => {
        expect(await explicitExperimentIndividualExclusionRepository.find()).toEqual(excludeArr)
    })

    it('should return an array of all users', async() => {
        const users = await service.getAllExperimentUser(logger);
        expect(users).toEqual(excludeArr)
    })

    it('should return a single user', async() => {
        const user = await service.getExperimentUserById('uid', 'expid',logger);
        expect(user).toEqual(excludeArr[0])
    })

    it('should return excluded users', async() => {
        service.experimentService.findOne = jest.fn().mockResolvedValue(exp);
        const user = await service.experimentExcludeUser(['uid1', 'uid2'], 'expid', logger);
        expect(user).toEqual(excludeArr)
    })

    it('should returnan empty excluded user doc', async() => {
        service.experimentService.findOne = jest.fn().mockResolvedValue(exp);
        const user = await service.experimentExcludeUser([], 'expid', logger);
        expect(user).toEqual(excludeArr)
    })

    it('should throw an error when experiment is not found for user exclusion', async() => {
        service.experimentService.findOne = jest.fn().mockResolvedValue(null);
        expect(async ()=>{await service.experimentExcludeUser(['uid1', 'uid2'], 'expid', logger)}).rejects.toThrow(expNotFoundError);
    })

    it('should delete a user', async() => {
        const user = await service.deleteExperimentUser('uId', 'expid', logger);
        expect(user).toEqual(explicitExperimentIndividualExclusion)
    })

    it('should return an array of all groups', async() => {
        const groups = await service.getAllExperimentGroups(logger);
        expect(groups).toEqual(excludeArr)
    })

    it('should return a single group', async() => {
        const group = await service.getExperimentGroupById('type', 'gid', 'expid', logger);
        expect(group).toEqual(excludeArr[0])
    })

    it('should return excluded groups', async() => {
        service.experimentService.findOne = jest.fn().mockResolvedValue(exp);
        const groups = await service.experimentExcludeGroup([{groupId: "gid", type: "type"}], 'expid', logger);
        expect(groups).toEqual(excludeArr)
    })

    it('should return an empty excluded group doc', async() => {
        service.experimentService.findOne = jest.fn().mockResolvedValue(exp);
        const groups = await service.experimentExcludeGroup([], 'expid', logger);
        expect(groups).toEqual(excludeArr)
    })

    it('should throw an error when experiment is not found for group exclusion', async() => {
        service.experimentService.findOne = jest.fn().mockResolvedValue(null);
        expect(async ()=>{await service.experimentExcludeGroup([{groupId: "gid", type: "type"}], 'expid', logger)}).rejects.toThrow(expNotFoundError);
    })

    it('should delete a group', async() => {
        const group = await service.deleteExperimentGroup('groupId', 'type', 'expid', logger);
        expect(group).toEqual(explicitExperimentGroupExclusion)
    })
});
