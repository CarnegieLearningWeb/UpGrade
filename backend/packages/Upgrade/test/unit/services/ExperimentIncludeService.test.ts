import { ExperimentIncludeService } from '../../../src/api/services/ExperimentIncludeService';
import { Repository } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ExplicitExperimentGroupInclusionRepository } from '../../../src/api/repositories/ExplicitExperimentGroupInclusionRepository';
import { ExplicitExperimentIndividualInclusionRepository } from '../../../src/api/repositories/ExplicitExperimentIndividualInclusionRepository';
import { ExplicitExperimentIndividualInclusion } from '../../../src/api/models/ExplicitExperimentIndividualInclusion';
import { ExplicitExperimentGroupInclusion } from '../../../src/api/models/ExplicitExperimentGroupInclusion';
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


let includeArr = [1, 2, 3];
let explicitExperimentIndividualInclusion = new ExplicitExperimentIndividualInclusion();
let explicitExperimentGroupInclusion = new ExplicitExperimentGroupInclusion();
let logger = new UpgradeLogger();
let exp = new Experiment();
exp.state = EXPERIMENT_STATE.ENROLLING;
exp.id = 'exp1'
let expNotFoundError = new Error('experiment not found')


describe('Experiment Include Service Testing', () => {

    let service: ExperimentIncludeService;
    let explicitExperimentGroupInclusionRepository: Repository<ExplicitExperimentGroupInclusionRepository>;
    let explicitExperimentIndividualInclusionRepository: Repository<ExplicitExperimentIndividualInclusionRepository>;
    let module: TestingModule;

    beforeEach(async () => {
        module = await Test.createTestingModule({
            providers: [
                ExperimentService,
                ExperimentIncludeService,
                ExplicitExperimentGroupInclusionRepository,
                ExplicitExperimentIndividualInclusionRepository,
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
                    provide: getRepositoryToken(ExplicitExperimentGroupInclusionRepository),
                    useValue: {
                        find: jest.fn().mockResolvedValue(includeArr),
                        saveRawJson: jest.fn().mockResolvedValue(explicitExperimentGroupInclusion),
                        deleteGroup: jest.fn().mockResolvedValue(explicitExperimentGroupInclusion),
                        findOneById: jest.fn().mockResolvedValue(includeArr[0]),
                        findAllGroups: jest.fn().mockResolvedValue(includeArr),
                        insertExplicitExperimentGroupInclusion: jest.fn().mockResolvedValue(includeArr)
                    }
                },
                {
                    provide: getRepositoryToken(ExplicitExperimentIndividualInclusionRepository),
                    useValue: {
                        find: jest.fn().mockResolvedValue(includeArr),
                        saveRawJson: jest.fn().mockResolvedValue(explicitExperimentIndividualInclusion),
                        deleteById: jest.fn().mockResolvedValue(explicitExperimentIndividualInclusion),
                        findOneById: jest.fn().mockResolvedValue(includeArr[0]),
                        findAllUsers: jest.fn().mockResolvedValue(includeArr),
                        insertExplicitExperimentIndividualInclusion: jest.fn().mockResolvedValue(includeArr)
                    }
                }
            ]
        }).compile()

        service = module.get<ExperimentIncludeService>(ExperimentIncludeService);
        explicitExperimentGroupInclusionRepository = module.get<Repository<ExplicitExperimentGroupInclusionRepository>>(getRepositoryToken(ExplicitExperimentGroupInclusionRepository));
        explicitExperimentIndividualInclusionRepository = module.get<Repository<ExplicitExperimentIndividualInclusionRepository>>(getRepositoryToken(ExplicitExperimentIndividualInclusionRepository));
    })


    it('should be defined', async() => {
        expect(service).toBeDefined()
    })

    it('should have the explicit group exclusion repository mocked', async() => {
        expect(await explicitExperimentGroupInclusionRepository.find()).toEqual(includeArr)
    })

    it('should have the explicit individual exclusion repository mocked', async() => {
        expect(await explicitExperimentIndividualInclusionRepository.find()).toEqual(includeArr)
    })

    it('should return an array of all users', async() => {
        const users = await service.getAllExperimentUser(logger);
        expect(users).toEqual(includeArr)
    })

    it('should return a single user', async() => {
        const user = await service.getExperimentUserById('uid', 'expid',logger);
        expect(user).toEqual(includeArr[0])
    })

    it('should return included users', async() => {
        service.experimentService.findOne = jest.fn().mockResolvedValue(exp);
        const user = await service.experimentIncludeUser(['uid1', 'uid2'], 'expid', logger);
        expect(user).toEqual(includeArr)
    })

    it('should returnan empty included user doc', async() => {
        service.experimentService.findOne = jest.fn().mockResolvedValue(exp);
        const user = await service.experimentIncludeUser([], 'expid', logger);
        expect(user).toEqual(includeArr)
    })

    it('should throw an error when experiment is not found for user exclusion', async() => {
        service.experimentService.findOne = jest.fn().mockResolvedValue(null);
        expect(async ()=>{await service.experimentIncludeUser(['uid1', 'uid2'], 'expid', logger)}).rejects.toThrow(expNotFoundError);
    })

    it('should delete a user', async() => {
        const user = await service.deleteExperimentUser('uId', 'expid', logger);
        expect(user).toEqual(explicitExperimentIndividualInclusion)
    })

    it('should return an array of all groups', async() => {
        const groups = await service.getAllExperimentGroups(logger);
        expect(groups).toEqual(includeArr)
    })

    it('should return a single group', async() => {
        const group = await service.getExperimentGroupById('type', 'gid', 'expid', logger);
        expect(group).toEqual(includeArr[0])
    })

    it('should return included groups', async() => {
        service.experimentService.findOne = jest.fn().mockResolvedValue(exp);
        const groups = await service.experimentIncludeGroup([{groupId: "gid", type: "type"}], 'expid', logger);
        expect(groups).toEqual(includeArr)
    })

    it('should return an empty included group doc', async() => {
        service.experimentService.findOne = jest.fn().mockResolvedValue(exp);
        const groups = await service.experimentIncludeGroup([], 'expid', logger);
        expect(groups).toEqual(includeArr)
    })

    it('should throw an error when experiment is not found for group exclusion', async() => {
        service.experimentService.findOne = jest.fn().mockResolvedValue(null);
        expect(async ()=>{await service.experimentIncludeGroup([{groupId: "gid", type: "type"}], 'expid', logger)}).rejects.toThrow(expNotFoundError);
    })

    it('should delete a group', async() => {
        const group = await service.deleteExperimentGroup('groupId', 'type', 'expid', logger);
        expect(group).toEqual(explicitExperimentGroupInclusion)
    })
});
