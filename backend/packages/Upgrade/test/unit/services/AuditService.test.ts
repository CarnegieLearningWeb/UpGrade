import { AuditService } from '../../../src/api/services/AuditService';
import { Repository } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ExperimentAuditLogRepository } from '../../../src/api/repositories/ExperimentAuditLogRepository';
import { EXPERIMENT_LOG_TYPE } from '../../../../../../types/src';


//CHANGE MOCK ARR APPROPRIATELY
let auditArr = [1, 2, 3]


describe('Audit Service Testing', () => {

    let service: AuditService;
    let repo: Repository<ExperimentAuditLogRepository>;
    let module: TestingModule;

    beforeEach(async () => {
        module = await Test.createTestingModule({
            providers: [
                AuditService,
                ExperimentAuditLogRepository,
                {
                    provide: getRepositoryToken(ExperimentAuditLogRepository),
                    useValue: {
                        find: jest.fn().mockResolvedValue(auditArr), //ADD OTHER CALLED FUNCTIONS TO MOCK RETURN VALUES
                        getTotalLogs: jest.fn().mockResolvedValue(auditArr.length)
                    }
                }
            ]
        }).compile()

        service = module.get<AuditService>(AuditService);
        repo = module.get<Repository<ExperimentAuditLogRepository>>(getRepositoryToken(ExperimentAuditLogRepository))
    })


    it('should be defined', async() => {
        expect(service).toBeDefined()
    })

    it('should have the repo mocked', async() => {
        expect(await repo.find()).toEqual(auditArr)
    })

    it('should return an array of audit logs by type', async() => {
        const flags = await service.getAuditLogByType(EXPERIMENT_LOG_TYPE.EXPERIMENT_CREATED);
        //CHANGE THE MOCK VALUE APPROPRIATELY
        expect(flags).toEqual(auditArr)
    })

    it('should return a count of audit logs', async() => {
        const flags = await service.getTotalLogs(EXPERIMENT_LOG_TYPE.EXPERIMENT_CREATED);
        //CHANGE THE MOCK VALUE APPROPRIATELY
        expect(flags).toEqual(auditArr.length)
    })
});
