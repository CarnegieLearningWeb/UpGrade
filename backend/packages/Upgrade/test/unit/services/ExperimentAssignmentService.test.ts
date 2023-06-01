import sinon from 'sinon';
import { AnalyticsRepository } from '../../../src/api/repositories/AnalyticsRepository';
import { DecisionPointRepository } from '../../../src/api/repositories/DecisionPointRepository';
import { ErrorRepository } from '../../../src/api/repositories/ErrorRepository';
import { ExperimentRepository } from '../../../src/api/repositories/ExperimentRepository';
import { GroupEnrollmentRepository } from '../../../src/api/repositories/GroupEnrollmentRepository';
import { GroupExclusionRepository } from '../../../src/api/repositories/GroupExclusionRepository';
import { IndividualEnrollmentRepository } from '../../../src/api/repositories/IndividualEnrollmentRepository';
import { IndividualExclusionRepository } from '../../../src/api/repositories/IndividualExclusionRepository';
import { LogRepository } from '../../../src/api/repositories/LogRepository';
import { MetricRepository } from '../../../src/api/repositories/MetricRepository';
import { MonitoredDecisionPointLogRepository } from '../../../src/api/repositories/MonitoredDecisionPointLogRepository';
import { MonitoredDecisionPointRepository } from '../../../src/api/repositories/MonitoredDecisionPointRepository';
import { StateTimeLogsRepository } from '../../../src/api/repositories/StateTimeLogsRepository';
import { ErrorService } from '../../../src/api/services/ErrorService';
import { ExperimentAssignmentService } from '../../../src/api/services/ExperimentAssignmentService';
import { ExperimentService } from '../../../src/api/services/ExperimentService';
import { ExperimentUserService } from '../../../src/api/services/ExperimentUserService';
import { PreviewUserService } from '../../../src/api/services/PreviewUserService';
import { ScheduledJobService } from '../../../src/api/services/ScheduledJobService';
import { SegmentService } from '../../../src/api/services/SegmentService';
import { SettingService } from '../../../src/api/services/SettingService';
import { SERVER_ERROR } from 'upgrade_types';
import { firstFactorialExperiment, individualAssignmentExperiment } from '../mockdata';
import { ConditionPayloadRepository } from '../../../src/api/repositories/ConditionPayloadRepository';

describe('Expeirment Assignment Service Test', () => {
  let sandbox;
  let testedModule;
  const experimentRepositoryMock = sinon.createStubInstance(ExperimentRepository);
    const decisionPointRepositoryMock = sinon.createStubInstance(DecisionPointRepository);
    const individualExclusionRepositoryMock = sinon.createStubInstance(IndividualExclusionRepository);
    const groupExclusionRepositoryMock = sinon.createStubInstance(GroupExclusionRepository);
    const groupEnrollmentRepositoryMock = sinon.createStubInstance(GroupEnrollmentRepository);
    const individualEnrollmentRepositoryMock = sinon.createStubInstance(IndividualEnrollmentRepository);
    const monitoredDecisionPointLogRepositoryMock = sinon.createStubInstance(MonitoredDecisionPointLogRepository);
    const monitoredDecisionPointRepositoryMock = sinon.createStubInstance(MonitoredDecisionPointRepository);
    const errorRepositoryMock = sinon.createStubInstance(ErrorRepository);
    const logRepositoryMock = sinon.createStubInstance(LogRepository);
    const metricRepositoryMock = sinon.createStubInstance(MetricRepository);
    const stateTimeLogsRepositoryMock = sinon.createStubInstance(StateTimeLogsRepository);
    const analyticsRepositoryMock = sinon.createStubInstance(AnalyticsRepository);
    const conditionPayloadRepositoryMock = sinon.createStubInstance(ConditionPayloadRepository);
    const previewUserServiceMock = sinon.createStubInstance(PreviewUserService);
    const experimentUserServiceMock = sinon.createStubInstance(ExperimentUserService);
    const scheduledJobServiceMock = sinon.createStubInstance(ScheduledJobService);
    const errorServiceMock = sinon.createStubInstance(ErrorService);
    const settingServiceMock = sinon.createStubInstance(SettingService);
    const segmentServiceMock = sinon.createStubInstance(SegmentService);
    const experimentServiceMock = sinon.createStubInstance(ExperimentService);
    experimentServiceMock.formatingConditionPayload.restore()
    experimentServiceMock.formatingPayload.restore()

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    testedModule = new ExperimentAssignmentService(
        experimentRepositoryMock,
         decisionPointRepositoryMock,
         individualExclusionRepositoryMock,
         groupExclusionRepositoryMock,
         groupEnrollmentRepositoryMock,
         individualEnrollmentRepositoryMock,
         monitoredDecisionPointLogRepositoryMock, 
         monitoredDecisionPointRepositoryMock, 
         errorRepositoryMock, 
         logRepositoryMock, 
         metricRepositoryMock, 
         stateTimeLogsRepositoryMock, 
         analyticsRepositoryMock, 
         conditionPayloadRepositoryMock, 
         previewUserServiceMock, 
         experimentUserServiceMock, 
         scheduledJobServiceMock, 
         errorServiceMock, 
         settingServiceMock, 
         segmentServiceMock, 
         experimentServiceMock
      );
      testedModule.segmentService.getSegmentByIds.withArgs([ '77777777-7777-7777-7777-777777777777' ]).resolves([
        {
          id: '77777777-7777-7777-7777-777777777777',
          name: 'Global Exclude',
          description: 'Globally excluded Users, Groups and Segments',
          context: 'ALL',
          type: 'global_exclude',
          individualForSegment: [],
          groupForSegment: [],
          subSegments: []
        }
      ])
      testedModule.segmentService.getSegmentByIds.withArgs([
        '89246cff-c81f-4515-91f3-c033341e45b9',
        'd958bf52-7066-4594-ad8a-baf2e75324cf'
      ]).resolves([
        {
          id: '89246cff-c81f-4515-91f3-c033341e45b9',
          name: 'edf54471-5266-4a52-a058-90fac2d03678 Inclusion Segment',
          description: 'edf54471-5266-4a52-a058-90fac2d03678 Inclusion Segment',
          context: 'add',
          type: 'private',
          individualForSegment: [],
          groupForSegment: [],
          subSegments: []
        },
        {
          id: 'd958bf52-7066-4594-ad8a-baf2e75324cf',
          name: 'edf54471-5266-4a52-a058-90fac2d03678 Exclusion Segment',
          description: 'edf54471-5266-4a52-a058-90fac2d03678 Exclusion Segment',
          context: 'add',
          type: 'private',
          individualForSegment: [],
          groupForSegment: [],
          subSegments: []
        }
      ])
    
      });

      

  afterEach(() => {
    sandbox.restore();
  });

  it('should be defined', async() => {
    expect(testedModule).toBeDefined()
    })

  it('should throw an error if user is not defined', async () => {
    const loggerMock = { error: sandbox.stub(), info: sandbox.stub()  };
    const requestContext = { logger: loggerMock, userDoc: null };
    const userId = '12345';
    const context = 'context';

    const previewUserServiceMock = { findOne: sandbox.stub().resolves([]) };
    const experimentUserServiceMock = { getOriginalUserDoc: sandbox.stub().resolves(null) };

    testedModule.previewUserServiceMock = previewUserServiceMock;
    testedModule.experimentUserService = experimentUserServiceMock;

    const err = new Error(
        JSON.stringify({
          type: SERVER_ERROR.EXPERIMENT_USER_NOT_DEFINED,
          message: `User not defined in getAllExperimentConditions: ${userId}`,
        })
      );
    (err as any).type = SERVER_ERROR.EXPERIMENT_USER_NOT_DEFINED;
    (err as any).httpCode = 404;    

    expect(async() => {await testedModule.getAllExperimentConditions(userId, context, requestContext)}).rejects.toThrow(err);
  });

  it('should return an empty array if there are no experiments', async () => {
    const loggerMock = { info: sandbox.stub() };
    const requestContext = { logger: loggerMock, userDoc: { id: 'user123', group: 'group', workingGroup: {} } };
    const userId = '12345';
    const context = 'context';
    const experimentRepositoryMock = { getValidExperiments: sandbox.stub().resolves([]) };
    const experimentUserServiceMock = { getOriginalUserDoc: sandbox.stub().resolves({ id: 'user123', createdAt: new Date(), group: 'group', workingGroup: {} }) };
    
    testedModule.experimentRepository = experimentRepositoryMock;
    testedModule.experimentUserService = experimentUserServiceMock;
    testedModule.segmentService.getSegmentByIds.resolves([{id: '77777777-7777-7777-7777-777777777777', subSegments: [], individualForSegment: [], groupForSegment: []} ])

    const result = await testedModule.getAllExperimentConditions(userId, context, requestContext);

    expect(result).toEqual([]);
    sinon.assert.calledWith(loggerMock.info, { message: `getAllExperimentConditions: User: ${userId}` });
  });

  it('should return the assigned condition for a simple individual experiment', async () => {
    const loggerMock = { info: sandbox.stub(), error: sandbox.stub() };
    const requestContext = { logger: loggerMock, userDoc: { id: 'user123', group: {'schoolId': ['school1']}, workingGroup: {} } };
    const userId = 'user123';
    const context = 'context';
    const exp = individualAssignmentExperiment;
    exp.factors = []
    const experimentRepositoryMock = { getValidExperiments: sandbox.stub().resolves([exp]) };
    const experimentUserServiceMock = { getOriginalUserDoc: sandbox.stub().resolves({ id: 'user123', createdAt: new Date(), group: {'schoolId': ['school1']}, workingGroup: {} }) };
    const previewUserServiceMock = { findOne: sandbox.stub().resolves(undefined) };

    const individualEnrollmentRepositoryMock = { findEnrollments: sandbox.stub().resolves([]) }
    const individualExclusionRepositoryMock = { findExcluded: sandbox.stub().resolves([]) }

    testedModule.experimentRepository = experimentRepositoryMock;
    testedModule.experimentUserService = experimentUserServiceMock;
    testedModule.previewUserServiceMock = previewUserServiceMock;
    testedModule.individualEnrollmentRepository = individualEnrollmentRepositoryMock;
    testedModule.individualExclusionRepository = individualExclusionRepositoryMock;

    const result = await testedModule.getAllExperimentConditions(userId, context, requestContext);

    const cond = {...exp.conditions[0], experimentId: exp.id, payload: undefined}
    expect(result.length).toEqual(1);
    expect(result[0].site).toEqual(exp.partitions[0].site);
    expect(result[0].target).toEqual(exp.partitions[0].target);
    expect(result[0].assignedFactor).toBeNull();
    expect(result[0].assignedCondition).toEqual(cond)
  });

  it('should return the assigned condition for a factorial individual experiment', async () => {
    const loggerMock = { info: sandbox.stub(), error: sandbox.stub() };
    const requestContext = { logger: loggerMock, userDoc: { id: 'user123', group: {'schoolId': ['school1']}, workingGroup: {} } };
    const userId = 'user123';
    const context = 'context';
    const exp = firstFactorialExperiment;
    const experimentRepositoryMock = { getValidExperiments: sandbox.stub().resolves([exp]) };
    const experimentUserServiceMock = { getOriginalUserDoc: sandbox.stub().resolves({ id: 'user123', createdAt: new Date(), group: {'schoolId': ['school1']}, workingGroup: {} }) };
    const previewUserServiceMock = { findOne: sandbox.stub().resolves(undefined) };
    const individualEnrollmentRepositoryMock = { findEnrollments: sandbox.stub().resolves([]) }
    const individualExclusionRepositoryMock = { findExcluded: sandbox.stub().resolves([]) }

    testedModule.experimentRepository = experimentRepositoryMock;
    testedModule.experimentUserService = experimentUserServiceMock;
    
    

    testedModule.previewUserServiceMock = previewUserServiceMock;
    testedModule.individualEnrollmentRepository = individualEnrollmentRepositoryMock;
    testedModule.individualExclusionRepository = individualExclusionRepositoryMock;

    const result = await testedModule.getAllExperimentConditions(userId, context, requestContext);

    const factor = {
        "Color": {
          "level": "Blue",
          "payload": {
            "type": "string",
            "value": "Dark blue - Blue color Alias"
          }
        },
        "Shape": {
          "level": "Rectangle",
          "payload": {
            "type": "string",
            "value": "Square - rectangle alias"
          }
        }}
    expect(result.length).toEqual(1);
    expect(result[0].site).toEqual(exp.partitions[0].site);
    expect(result[0].target).toEqual(exp.partitions[0].target);
    expect(result[0].assignedFactor).toEqual(factor);
    console.log(result[0].assignedCondition)
    expect(result[0].assignedCondition).toMatchObject({conditionCode:'Color=Blue; Shape=Rectangle'})
  });

  // it('should return the assigned condition for a simple group experiment', async () => {
    
  // });

  // it('should return the assigned condition for a factorial group experiment', async () => {
    
  // });

   
});
