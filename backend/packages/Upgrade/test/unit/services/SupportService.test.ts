import { SupportService } from '../../../src/api/services/SupportService';
import { Test, TestingModule } from '@nestjs/testing';
import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';
import { ExperimentAssignmentService } from '../../../src/api/services/ExperimentAssignmentService';
import { ExperimentUserService } from '../../../src/api/services/ExperimentUserService';
import { ExperimentUser } from '../../../src/api/models/ExperimentUser';
import { ExperimentRepository } from '../../../src/api/repositories/ExperimentRepository';
import { ExperimentPartitionRepository } from '../../../src/api/repositories/ExperimentPartitionRepository';
import { ErrorRepository } from '../../../src/api/repositories/ErrorRepository';
import { ExplicitExperimentGroupExclusionRepository } from '../../../src/api/repositories/ExplicitExperimentGroupExclusionRepository';
import { ExplicitExperimentGroupInclusionRepository } from '../../../src/api/repositories/ExplicitExperimentGroupInclusionRepository';
import { ExplicitExperimentIndividualExclusionRepository } from '../../../src/api/repositories/ExplicitExperimentIndividualExclusionRepository';
import { ExplicitExperimentIndividualInclusionRepository } from '../../../src/api/repositories/ExplicitExperimentIndividualInclusionRepository';
import { ExplicitGroupExclusionRepository } from '../../../src/api/repositories/ExplicitGroupExclusionRepository';
import { ExplicitIndividualExclusionRepository } from '../../../src/api/repositories/ExplicitIndividualExclusionRepository';
import { GroupAssignmentRepository } from '../../../src/api/repositories/GroupAssignmentRepository';
import { GroupExclusionRepository } from '../../../src/api/repositories/GroupExclusionRepository';
import { IndividualAssignmentRepository } from '../../../src/api/repositories/IndividualAssignmentRepository';
import { IndividualExclusionRepository } from '../../../src/api/repositories/IndividualExclusionRepository';
import { LogRepository } from '../../../src/api/repositories/LogRepository';
import { MetricRepository } from '../../../src/api/repositories/MetricRepository';
import { MonitoredExperimentPointRepository } from '../../../src/api/repositories/MonitoredExperimentPointRepository';
import { MonitoredExperimentPointLogRepository } from '../../../src/api/repositories/MonitorExperimentPointLogRepository';
import { StateTimeLogsRepository } from '../../../src/api/repositories/StateTimeLogsRepository';
import { ErrorService } from '../../../src/api/services/ErrorService';
import { PreviewUserService } from '../../../src/api/services/PreviewUserService';
import { ScheduledJobService } from '../../../src/api/services/ScheduledJobService';
import { SettingService } from '../../../src/api/services/SettingService';
import { ExperimentUserRepository } from '../../../src/api/repositories/ExperimentUserRepository';
import { PreviewUserRepository } from '../../../src/api/repositories/PreviewUserRepository';
import { ExplicitIndividualAssignmentRepository } from '../../../src/api/repositories/ExplicitIndividualAssignmentRepository';
import { AWSService } from '../../../src/api/services/AWSService';
import { ScheduledJobRepository } from '../../../src/api/repositories/ScheduledJobRepository';
import { ExperimentAuditLogRepository } from '../../../src/api/repositories/ExperimentAuditLogRepository';
import { SettingRepository } from '../../../src/api/repositories/SettingRepository';


let user = new ExperimentUser();
let logger = new UpgradeLogger();


describe('Support Service Testing', () => {

    let service: SupportService;
    let module: TestingModule;

    beforeEach(async () => {
        module = await Test.createTestingModule({
            providers: [
                SupportService,
                ExperimentAssignmentService,
                ExperimentUserService,
                ExperimentRepository,
                ExperimentUserRepository,
                ExperimentPartitionRepository,
                IndividualExclusionRepository,
                GroupExclusionRepository,
                GroupAssignmentRepository,
                IndividualAssignmentRepository,
                MonitoredExperimentPointLogRepository,
                MonitoredExperimentPointRepository,
                ExplicitIndividualExclusionRepository,
                ExplicitGroupExclusionRepository,
                ExplicitExperimentIndividualExclusionRepository,
                ExplicitExperimentIndividualInclusionRepository,
                ExplicitExperimentGroupExclusionRepository,
                ExplicitExperimentGroupInclusionRepository,
                ErrorRepository,
                LogRepository,
                MetricRepository,
                StateTimeLogsRepository,
                PreviewUserService,
                ScheduledJobService,
                ErrorService,
                SettingService,
                PreviewUserRepository,
                ExplicitIndividualAssignmentRepository,
                ScheduledJobRepository,
                ExperimentAuditLogRepository,
                AWSService,
                SettingRepository
            ]
        }).compile()

        service = module.get<SupportService>(SupportService);
    })


    it('should be defined', async() => {
        expect(service).toBeDefined()
    })

    it('should return all assignments', async() => {
        service.experimentUserService.getOriginalUserDoc = jest.fn().mockReturnValue(user)
        const assignment = {
            expId: "id1",
            expPoint: "pt1",
            twoCharacterId: "AB",
            description: "test assignment",
            assignedCondition: {
              conditionCode: "code1",
              twoCharacterId: "YZ",
              description: "test assigned condition"
            }
          }
        service.experimentAssignmentService.getAllExperimentConditions = jest.fn().mockReturnValue(assignment);
        const assignments = await service.getAssignments("uuid", "assign-prog", logger);
        expect(service.experimentUserService.getOriginalUserDoc).toBeCalledWith("uuid", logger);
        expect(service.experimentAssignmentService.getAllExperimentConditions).toBeCalledWith("uuid", "assign-prog",
            { logger: new UpgradeLogger(), userDoc: user }, false);
        expect(assignments).toEqual(assignment);
    })

    it('should return all assignments without logging', async() => {
        service.experimentUserService.getOriginalUserDoc = jest.fn().mockReturnValue(user)
        const assignment = {
            expId: "id1",
            expPoint: "pt1",
            twoCharacterId: "AB",
            description: "test assignment",
            assignedCondition: {
              conditionCode: "code1",
              twoCharacterId: "YZ",
              description: "test assigned condition"
            }
          }
        service.experimentAssignmentService.getAllExperimentConditions = jest.fn().mockReturnValue(assignment);
        const assignments = await service.getAssignments("uuid", "assign-prog", null);
        expect(service.experimentUserService.getOriginalUserDoc).toBeCalledWith("uuid", null);
        expect(service.experimentAssignmentService.getAllExperimentConditions).toBeCalledWith("uuid", "assign-prog",
            { logger: new UpgradeLogger(), userDoc: user }, false);
        expect(assignments).toEqual(assignment);
    })

    
});
