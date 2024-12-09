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
import { SegmentService } from '../../../src/api/services/SegmentService';
import { SettingService } from '../../../src/api/services/SettingService';
import {
  simpleIndividualAssignmentExperiment,
  simpleGroupAssignmentExperiment,
  factorialGroupAssignmentExperiment,
  factorialIndividualAssignmentExperiment,
  simpleDPExperiment,
  simpleWithinSubjectOrderedRoundRobinExperiment,
  withinSubjectDPExperiment,
} from '../mockdata';
import { GroupEnrollment } from '../../../src/api/models/GroupEnrollment';
import { MARKED_DECISION_POINT_STATUS } from 'upgrade_types';
import { CacheService } from '../../../src/api/services/CacheService';
import { UserStratificationFactorRepository } from '../../../src/api/repositories/UserStratificationRepository';
import { configureLogger } from '../../utils/logger';

describe('Experiment Assignment Service Test', () => {
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
  const userStratificationFactorRepository = sinon.createStubInstance(UserStratificationFactorRepository);
  const previewUserServiceMock = sinon.createStubInstance(PreviewUserService);
  const experimentUserServiceMock = sinon.createStubInstance(ExperimentUserService);
  const errorServiceMock = sinon.createStubInstance(ErrorService);
  const settingServiceMock = sinon.createStubInstance(SettingService);
  const segmentServiceMock = sinon.createStubInstance(SegmentService);
  const experimentServiceMock = sinon.createStubInstance(ExperimentService);
  const cacheServiceMock = sinon.createStubInstance(CacheService);
  experimentServiceMock.formatingConditionPayload.restore();
  experimentServiceMock.formatingPayload.restore();

  beforeAll(() => {
    configureLogger();
  });

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
      userStratificationFactorRepository,
      previewUserServiceMock,
      experimentUserServiceMock,
      errorServiceMock,
      settingServiceMock,
      segmentServiceMock,
      experimentServiceMock,
      cacheServiceMock
    );
    testedModule.cacheService.wrap.resolves([]);
    testedModule.segmentService.getSegmentByIds.withArgs(['77777777-7777-7777-7777-777777777777']).resolves([
      {
        id: '77777777-7777-7777-7777-777777777777',
        name: 'Global Exclude',
        description: 'Globally excluded Users, Groups and Segments',
        context: 'ALL',
        type: 'global_exclude',
        individualForSegment: [],
        groupForSegment: [],
        subSegments: [],
      },
    ]);
    testedModule.segmentService.getSegmentByIds
      .withArgs(['89246cff-c81f-4515-91f3-c033341e45b9', 'd958bf52-7066-4594-ad8a-baf2e75324cf'])
      .resolves([
        {
          id: '89246cff-c81f-4515-91f3-c033341e45b9',
          name: 'edf54471-5266-4a52-a058-90fac2d03678 Inclusion Segment',
          description: 'edf54471-5266-4a52-a058-90fac2d03678 Inclusion Segment',
          context: 'add',
          type: 'private',
          individualForSegment: [],
          groupForSegment: [],
          subSegments: [],
        },
        {
          id: 'd958bf52-7066-4594-ad8a-baf2e75324cf',
          name: 'edf54471-5266-4a52-a058-90fac2d03678 Exclusion Segment',
          description: 'edf54471-5266-4a52-a058-90fac2d03678 Exclusion Segment',
          context: 'add',
          type: 'private',
          individualForSegment: [],
          groupForSegment: [],
          subSegments: [],
        },
      ]);
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should be defined', async () => {
    expect(testedModule).toBeDefined();
  });

  it('should return an empty array if there are no experiments', async () => {
    const loggerMock = { info: sandbox.stub() };
    //const requestContext = { logger: loggerMock, userDoc: { id: 'user123', group: 'group', workingGroup: {} } };
    const userDoc = { id: 'user123', group: 'group', workingGroup: {}, requestedUserId: '12345' };
    const userId = '12345';
    const context = 'context';
    const experimentUserServiceMock = {
      getOriginalUserDoc: sandbox
        .stub()
        .resolves({ id: 'user123', createdAt: new Date(), group: 'group', workingGroup: {} }),
    };

    testedModule.experimentService = experimentServiceMock;
    testedModule.experimentService.getCachedValidExperiments = sandbox.stub().resolves([]);
    testedModule.experimentUserService = experimentUserServiceMock;
    testedModule.segmentService.getSegmentByIds.resolves([
      { id: '77777777-7777-7777-7777-777777777777', subSegments: [], individualForSegment: [], groupForSegment: [] },
    ]);

    const result = await testedModule.getAllExperimentConditions(userDoc, context, loggerMock);

    expect(result).toEqual([]);
    sinon.assert.calledWith(loggerMock.info, { message: `getAllExperimentConditions: User: ${userId}` });
  });

  it('should return the assigned condition for a simple individual experiment', async () => {
    const loggerMock = { info: sandbox.stub(), error: sandbox.stub() };
    const userId = 'user123';
    const context = 'context';
    // const requestContext = {
    //   logger: loggerMock,
    //   userDoc: { id: userId, group: { schoolId: ['school1'] }, workingGroup: {} },
    // };
    const userDoc = { id: userId, group: { schoolId: ['school1'] }, workingGroup: {} };
    const exp = simpleIndividualAssignmentExperiment;
    const experimentUserServiceMock = { getOriginalUserDoc: sandbox.stub().resolves(userDoc) };
    const previewUserServiceMock = { findOne: sandbox.stub().resolves(undefined) };
    const individualEnrollmentRepositoryMock = {
      findEnrollments: sandbox.stub().resolves([]),
      find: sandbox.stub().resolves([]),
    };
    const individualExclusionRepositoryMock = { findExcluded: sandbox.stub().resolves([]) };

    testedModule.experimentService = experimentServiceMock;
    testedModule.experimentService.getCachedValidExperiments = sandbox.stub().resolves([exp]);

    testedModule.experimentUserService = experimentUserServiceMock;
    testedModule.previewUserServiceMock = previewUserServiceMock;
    testedModule.individualEnrollmentRepository = individualEnrollmentRepositoryMock;
    testedModule.individualExclusionRepository = individualExclusionRepositoryMock;

    const result = await testedModule.getAllExperimentConditions(userDoc, context, loggerMock);

    const cond = { ...exp.conditions[0], experimentId: exp.id, payload: undefined };
    expect(result.length).toEqual(1);
    expect(result[0].site).toEqual(exp.partitions[0].site);
    expect(result[0].target).toEqual(exp.partitions[0].target);
    expect(result[0].assignedFactor).toBeNull();
    expect(result[0].assignedCondition[0]).toEqual(cond);
  });

  it('should return the assigned condition for a factorial individual experiment', async () => {
    const loggerMock = { info: sandbox.stub(), error: sandbox.stub() };
    const userId = 'user123';
    const context = 'context';
    // const requestContext = {
    //   logger: loggerMock,
    //   userDoc: { id: userId, group: { schoolId: ['school1'] }, workingGroup: {} },
    // };
    const userDoc = { id: userId, group: { schoolId: ['school1'] }, workingGroup: {} };
    const exp = factorialIndividualAssignmentExperiment;
    const experimentUserServiceMock = { getOriginalUserDoc: sandbox.stub().resolves(userDoc) };
    const previewUserServiceMock = { findOne: sandbox.stub().resolves(undefined) };
    const individualEnrollmentRepositoryMock = {
      findEnrollments: sandbox.stub().resolves([]),
      find: sandbox.stub().resolves([]),
    };
    const individualExclusionRepositoryMock = { findExcluded: sandbox.stub().resolves([]) };

    testedModule.experimentService = experimentServiceMock;
    testedModule.experimentService.getCachedValidExperiments = sandbox.stub().resolves([exp]);
    testedModule.experimentUserService = experimentUserServiceMock;
    testedModule.previewUserServiceMock = previewUserServiceMock;
    testedModule.individualEnrollmentRepository = individualEnrollmentRepositoryMock;
    testedModule.individualExclusionRepository = individualExclusionRepositoryMock;

    const result = await testedModule.getAllExperimentConditions(userDoc, context, loggerMock);

    const factor = {
      Color: {
        level: 'Blue',
        payload: {
          type: 'string',
          value: 'Dark blue - Blue color Alias',
        },
      },
      Shape: {
        level: 'Rectangle',
        payload: {
          type: 'string',
          value: 'Square - rectangle alias',
        },
      },
    };
    expect(result.length).toEqual(1);
    expect(result[0].site).toEqual(exp.partitions[0].site);
    expect(result[0].target).toEqual(exp.partitions[0].target);
    expect(result[0].assignedFactor[0]).toEqual(factor);
    expect(result[0].assignedCondition[0]).toMatchObject({ conditionCode: 'Color=Blue; Shape=Rectangle' });
  });

  it('should return the assigned condition for a simple within-subject ordered round-robin experiment', async () => {
    const loggerMock = { info: sandbox.stub(), error: sandbox.stub() };
    const userId = 'user123';
    const context = 'context';
    // const requestContext = {
    //   logger: loggerMock,
    //   userDoc: { id: userId, group: { schoolId: ['school1'] }, workingGroup: {} },
    // };
    const userDoc = { id: userId, group: { schoolId: ['school1'] }, workingGroup: {} };
    const exp = simpleWithinSubjectOrderedRoundRobinExperiment;
    const experimentUserServiceMock = { getOriginalUserDoc: sandbox.stub().resolves(userDoc) };
    const previewUserServiceMock = { findOne: sandbox.stub().resolves(undefined) };
    const individualEnrollmentRepositoryMock = {
      findEnrollments: sandbox.stub().resolves([]),
      find: sandbox.stub().resolves([]),
    };
    const individualExclusionRepositoryMock = { findExcluded: sandbox.stub().resolves([]) };
    const monitoredDecisionPointLogRepositoryMock = {
      find: sandbox.stub().resolves(0),
      getAllMonitoredDecisionPointLog: sandbox.stub().resolves([]),
    };

    testedModule.experimentService = experimentServiceMock;
    testedModule.experimentService.getCachedValidExperiments = sandbox.stub().resolves([exp]);
    testedModule.experimentUserService = experimentUserServiceMock;
    testedModule.previewUserServiceMock = previewUserServiceMock;
    testedModule.individualEnrollmentRepository = individualEnrollmentRepositoryMock;
    testedModule.individualExclusionRepository = individualExclusionRepositoryMock;
    testedModule.monitoredDecisionPointLogRepository = monitoredDecisionPointLogRepositoryMock;

    const result = await testedModule.getAllExperimentConditions(userDoc, context, loggerMock);
    const cond = [
      {
        conditionCode: exp.conditions[0].conditionCode,
        id: exp.conditions[0].id,
        experimentId: exp.id,
        payload: undefined,
      },
      {
        conditionCode: exp.conditions[1].conditionCode,
        id: exp.conditions[1].id,
        experimentId: exp.id,
        payload: undefined,
      },
    ];
    expect(result.length).toEqual(1);
    expect(result[0].site).toEqual(exp.partitions[0].site);
    expect(result[0].target).toEqual(exp.partitions[0].target);
    expect(result[0].assignedFactor).toBeNull();
    expect(result[0].assignedCondition).toMatchObject(cond);
  });

  it('should return the assigned condition for a simple group experiment', async () => {
    const loggerMock = { info: sandbox.stub(), error: sandbox.stub() };
    const userId = 'user123';
    const context = 'context';
    // const requestContext = {
    //   logger: loggerMock,
    //   userDoc: { id: userId, group: { 'add-group1': ['school1'] }, workingGroup: { 'add-group1': 'school1' } },
    // };
    const userDoc = { id: userId, group: { 'add-group1': ['school1'] }, workingGroup: { 'add-group1': 'school1' } };
    const exp = simpleGroupAssignmentExperiment;
    const groupEnrollment = new GroupEnrollment();
    groupEnrollment.experiment = exp;
    groupEnrollment.condition = exp.conditions[0];
    groupEnrollment.groupId = 'add-group1';
    const experimentUserServiceMock = { getOriginalUserDoc: sandbox.stub().resolves(userDoc) };
    const previewUserServiceMock = { findOne: sandbox.stub().resolves(undefined) };
    const individualEnrollmentRepositoryMock = {
      findEnrollments: sandbox.stub().resolves([]),
      find: sandbox.stub().resolves([]),
    };
    const individualExclusionRepositoryMock = { findExcluded: sandbox.stub().resolves([]) };
    const groupEnrollmentRepositoryMock = {
      findEnrollments: sandbox.stub().resolves([groupEnrollment]),
      delete: sandbox.stub().resolves(),
    };
    const groupExclusionRepositoryMock = { findExcluded: sandbox.stub().resolves([]) };

    testedModule.experimentService = experimentServiceMock;
    testedModule.experimentService.getCachedValidExperiments = sandbox.stub().resolves([exp]);
    testedModule.experimentUserService = experimentUserServiceMock;
    testedModule.previewUserServiceMock = previewUserServiceMock;
    testedModule.individualEnrollmentRepository = individualEnrollmentRepositoryMock;
    testedModule.individualExclusionRepository = individualExclusionRepositoryMock;
    testedModule.groupEnrollmentRepository = groupEnrollmentRepositoryMock;
    testedModule.groupExclusionRepository = groupExclusionRepositoryMock;

    const result = await testedModule.getAllExperimentConditions(userDoc, context, loggerMock);

    const cond = { ...exp.conditions[0], experimentId: exp.id, payload: undefined };
    expect(result.length).toEqual(1);
    expect(result[0].site).toEqual(exp.partitions[0].site);
    expect(result[0].target).toEqual(exp.partitions[0].target);
    expect(result[0].assignedFactor).toBeNull();
    expect(result[0].assignedCondition[0]).toEqual(cond);
  });

  it('should return the assigned condition for a factorial group experiment', async () => {
    const loggerMock = { info: sandbox.stub(), error: sandbox.stub() };
    const userId = 'user123';
    const context = 'context';
    // const requestContext = {
    //   logger: loggerMock,
    //   userDoc: { id: userId, group: { 'add-group1': ['school1'] }, workingGroup: { 'add-group1': 'school1' } },
    // };
    const userDoc = { id: userId, group: { 'add-group1': ['school1'] }, workingGroup: { 'add-group1': 'school1' } };
    const exp = factorialGroupAssignmentExperiment;
    const experimentUserServiceMock = { getOriginalUserDoc: sandbox.stub().resolves(userDoc) };
    const previewUserServiceMock = { findOne: sandbox.stub().resolves(undefined) };
    const individualEnrollmentRepositoryMock = {
      findEnrollments: sandbox.stub().resolves([]),
      find: sandbox.stub().resolves([]),
    };
    const individualExclusionRepositoryMock = { findExcluded: sandbox.stub().resolves([]) };
    const groupEnrollment = new GroupEnrollment();
    groupEnrollment.experiment = exp;
    groupEnrollment.condition = exp.conditions[0];
    groupEnrollment.groupId = 'add-group1';
    groupEnrollment.partition = exp.partitions[0];
    const groupEnrollmentRepositoryMock = {
      findEnrollments: sandbox.stub().resolves([groupEnrollment]),
      delete: sandbox.stub().resolves(),
    };
    const groupExclusionRepositoryMock = { findExcluded: sandbox.stub().resolves([]) };

    testedModule.experimentService = experimentServiceMock;
    testedModule.experimentService.getCachedValidExperiments = sandbox.stub().resolves([exp]);

    testedModule.experimentUserService = experimentUserServiceMock;
    testedModule.previewUserServiceMock = previewUserServiceMock;
    testedModule.individualEnrollmentRepository = individualEnrollmentRepositoryMock;
    testedModule.individualExclusionRepository = individualExclusionRepositoryMock;
    testedModule.groupEnrollmentRepository = groupEnrollmentRepositoryMock;
    testedModule.groupExclusionRepository = groupExclusionRepositoryMock;

    const result = await testedModule.getAllExperimentConditions(userDoc, context, loggerMock);

    const factor = {
      Color: {
        level: 'Red',
        payload: {
          type: 'string',
          value: null,
        },
      },
      Shape: {
        level: 'Circle',
        payload: {
          type: 'string',
          value: null,
        },
      },
    };
    expect(result.length).toEqual(1);
    expect(result[0].site).toEqual(exp.partitions[0].site);
    expect(result[0].target).toEqual(exp.partitions[0].target);
    expect(result[0].assignedFactor[0]).toEqual(factor);
    expect(result[0].assignedCondition[0]).toMatchObject({ conditionCode: 'Color=Red; Shape=Circle' });
  });

  it('should log an error when clientError is provided', async () => {
    const userId = 'testUser';
    const site = 'testSite';
    const target = undefined;
    const condition = 'testCondition';
    const clientError = 'clientError';
    const loggerMock = { info: sandbox.stub(), error: sandbox.stub() };
    const decisionPointRepositoryMock = { find: sandbox.stub().resolves([]) };
    const individualEnrollmentRepositoryMock = {
      findEnrollments: sandbox.stub().resolves([]),
      find: sandbox.stub().resolves([]),
    };
    const individualExclusionRepositoryMock = { findExcluded: sandbox.stub().resolves([]) };
    const groupEnrollmentRepositoryMock = {
      findEnrollments: sandbox.stub().resolves([]),
      delete: sandbox.stub().resolves(),
    };
    const groupExclusionRepositoryMock = { findExcluded: sandbox.stub().resolves([]) };
    const monitoredDocument = {
      site: site,
      target: target,
      condition: condition,
      user: {
        id: userId,
      },
    };
    const monitoredDecisionPointRepositoryMock = {
      saveRawJson: sandbox.stub().callsFake((args) => {
        return args;
      }),
      findOne: sandbox.stub().resolves(monitoredDocument),
    };

    testedModule.decisionPointRepository = decisionPointRepositoryMock;
    testedModule.experimentService = experimentServiceMock;
    testedModule.experimentService.getCachedValidExperiments = sandbox.stub().resolves([]);
    testedModule.individualEnrollmentRepository = individualEnrollmentRepositoryMock;
    testedModule.individualExclusionRepository = individualExclusionRepositoryMock;
    testedModule.groupEnrollmentRepository = groupEnrollmentRepositoryMock;
    testedModule.groupExclusionRepository = groupExclusionRepositoryMock;
    testedModule.monitoredDecisionPointRepository = monitoredDecisionPointRepositoryMock;

    const result = await testedModule.markExperimentPoint(
      { id: userId },
      site,
      target,
      condition,
      loggerMock,
      undefined,
      undefined,
      undefined,
      clientError
    );
    expect(result).toMatchObject({
      condition: condition,
      site: site,
      target: target,
    });
    sinon.assert.calledOnce(loggerMock.error);
  });

  it('should return empty object when no experiments are running', async () => {
    const userId = 'testUser';
    const site = 'testSite';
    const target = 'testTarget';
    const condition = 'testCondition';
    const loggerMock = { info: sandbox.stub(), error: sandbox.stub() };
    const decisionPointRepositoryMock = { find: sandbox.stub().resolves([]) };
    const individualEnrollmentRepositoryMock = {
      findEnrollments: sandbox.stub().resolves([]),
      find: sandbox.stub().resolves([]),
    };
    const individualExclusionRepositoryMock = { findExcluded: sandbox.stub().resolves([]) };
    const groupEnrollmentRepositoryMock = {
      findEnrollments: sandbox.stub().resolves([]),
      delete: sandbox.stub().resolves(),
    };
    const groupExclusionRepositoryMock = { findExcluded: sandbox.stub().resolves([]) };
    const monitoredDocument = {
      site: site,
      target: target,
      condition: condition,
      user: {
        id: userId,
      },
    };
    const monitoredDecisionPointRepositoryMock = {
      saveRawJson: sandbox.stub().callsFake((args) => {
        return args;
      }),
      findOne: sandbox.stub().resolves(monitoredDocument),
    };

    testedModule.decisionPointRepository = decisionPointRepositoryMock;
    testedModule.experimentService = experimentServiceMock;
    testedModule.cacheService.wrap = sandbox.stub().resolves([]);
    testedModule.individualEnrollmentRepository = individualEnrollmentRepositoryMock;
    testedModule.individualExclusionRepository = individualExclusionRepositoryMock;
    testedModule.groupEnrollmentRepository = groupEnrollmentRepositoryMock;
    testedModule.groupExclusionRepository = groupExclusionRepositoryMock;
    testedModule.monitoredDecisionPointRepository = monitoredDecisionPointRepositoryMock;

    const result = await testedModule.markExperimentPoint(
      { id: userId },
      site,
      MARKED_DECISION_POINT_STATUS.NO_CONDITION_ASSIGNED,
      condition,
      loggerMock,
      target,
      undefined,
      undefined
    );
    expect(result).toMatchObject({
      condition: condition,
      site: site,
      target: target,
    });
  });

  it('should return monitored document for an enrolling simple individual experiment', async () => {
    const userId = 'testUser';
    const site = 'testSite';
    const target = 'testTarget';
    const condition = 'testCondition';
    const loggerMock = { info: sandbox.stub(), error: sandbox.stub() };
    const decisionPointRepositoryMock = { find: sandbox.stub().resolves([simpleDPExperiment]) };
    const individualEnrollmentRepositoryMock = {
      findEnrollments: sandbox.stub().resolves([]),
      find: sandbox.stub().resolves([]),
    };
    const individualExclusionRepositoryMock = { findExcluded: sandbox.stub().resolves([]) };
    const groupEnrollmentRepositoryMock = {
      findEnrollments: sandbox.stub().resolves([]),
      delete: sandbox.stub().resolves(),
    };
    const groupExclusionRepositoryMock = { findExcluded: sandbox.stub().resolves([]) };
    const monitoredDocument = {
      site: site,
      target: target,
      condition: condition,
      user: {
        id: userId,
      },
    };
    const monitoredDecisionPointRepositoryMock = {
      saveRawJson: sandbox.stub().callsFake((args) => {
        return args;
      }),
      findOne: sandbox.stub().resolves(monitoredDocument),
    };

    testedModule.decisionPointRepository = decisionPointRepositoryMock;
    testedModule.experimentService = experimentServiceMock;
    testedModule.experimentService.getCachedValidExperiments = sandbox
      .stub()
      .resolves([simpleIndividualAssignmentExperiment]);
    testedModule.individualEnrollmentRepository = individualEnrollmentRepositoryMock;
    testedModule.individualExclusionRepository = individualExclusionRepositoryMock;
    testedModule.groupEnrollmentRepository = groupEnrollmentRepositoryMock;
    testedModule.groupExclusionRepository = groupExclusionRepositoryMock;
    testedModule.monitoredDecisionPointRepository = monitoredDecisionPointRepositoryMock;

    const result = await testedModule.markExperimentPoint(
      { id: userId },
      site,
      MARKED_DECISION_POINT_STATUS.CONDITION_APPLIED,
      condition,
      loggerMock,
      target,
      undefined,
      undefined
    );
    expect(result).toMatchObject(monitoredDocument);
  });

  it('should return monitored document for an enrolling simple group experiment', async () => {
    const userId = 'testUser';
    const site = 'testSite';
    const target = 'testTarget';
    const condition = 'testCondition';
    const loggerMock = { info: sandbox.stub(), error: sandbox.stub() };
    const decisionPointRepositoryMock = { find: sandbox.stub().resolves([simpleDPExperiment]) };
    const individualEnrollmentRepositoryMock = {
      findEnrollments: sandbox.stub().resolves([]),
      find: sandbox.stub().resolves([]),
    };
    const individualExclusionRepositoryMock = { findExcluded: sandbox.stub().resolves([]) };
    const groupEnrollmentRepositoryMock = {
      findEnrollments: sandbox.stub().resolves([]),
      delete: sandbox.stub().resolves(),
    };
    const groupExclusionRepositoryMock = { findExcluded: sandbox.stub().resolves([]) };
    const monitoredDocument = {
      site: site,
      target: target,
      condition: condition,
      user: {
        id: userId,
      },
    };
    const monitoredDecisionPointRepositoryMock = {
      saveRawJson: sandbox.stub().callsFake((args) => {
        return args;
      }),
      findOne: sandbox.stub().resolves(monitoredDocument),
    };

    testedModule.decisionPointRepository = decisionPointRepositoryMock;
    testedModule.experimentService = experimentServiceMock;
    testedModule.experimentService.getCachedValidExperiments = sandbox
      .stub()
      .resolves([simpleIndividualAssignmentExperiment]);
    testedModule.individualEnrollmentRepository = individualEnrollmentRepositoryMock;
    testedModule.individualExclusionRepository = individualExclusionRepositoryMock;
    testedModule.groupEnrollmentRepository = groupEnrollmentRepositoryMock;
    testedModule.groupExclusionRepository = groupExclusionRepositoryMock;
    testedModule.monitoredDecisionPointRepository = monitoredDecisionPointRepositoryMock;

    const result = await testedModule.markExperimentPoint(
      { id: userId },
      site,
      MARKED_DECISION_POINT_STATUS.CONDITION_APPLIED,
      condition,
      loggerMock,
      target,
      undefined,
      undefined
    );
    expect(result).toMatchObject(monitoredDocument);
  });

  it('should return monitored document for an enrolling within-subject individual experiment', async () => {
    const userId = 'testUser';
    const site = 'testSite';
    const target = 'testTarget';
    const condition = 'testCondition';
    const loggerMock = { info: sandbox.stub(), error: sandbox.stub() };
    const decisionPointRepositoryMock = { find: sandbox.stub().resolves([withinSubjectDPExperiment]) };
    const individualEnrollmentRepositoryMock = {
      findEnrollments: sandbox.stub().resolves([]),
      find: sandbox.stub().resolves([]),
    };
    const individualExclusionRepositoryMock = { findExcluded: sandbox.stub().resolves([]) };
    const groupEnrollmentRepositoryMock = {
      findEnrollments: sandbox.stub().resolves([]),
      delete: sandbox.stub().resolves(),
    };
    const groupExclusionRepositoryMock = { findExcluded: sandbox.stub().resolves([]) };
    const monitoredDocument = {
      site: site,
      target: target,
      condition: condition,
      user: {
        id: userId,
      },
    };
    const monitoredDecisionPointRepositoryMock = {
      saveRawJson: sandbox.stub().callsFake((args) => {
        return args;
      }),
      findOne: sandbox.stub().resolves(monitoredDocument),
    };

    testedModule.decisionPointRepository = decisionPointRepositoryMock;
    testedModule.experimentService = experimentServiceMock;
    testedModule.experimentService.getCachedValidExperiments = sandbox
      .stub()
      .resolves([simpleIndividualAssignmentExperiment]);
    testedModule.individualEnrollmentRepository = individualEnrollmentRepositoryMock;
    testedModule.individualExclusionRepository = individualExclusionRepositoryMock;
    testedModule.groupEnrollmentRepository = groupEnrollmentRepositoryMock;
    testedModule.groupExclusionRepository = groupExclusionRepositoryMock;
    testedModule.monitoredDecisionPointRepository = monitoredDecisionPointRepositoryMock;

    const result = await testedModule.markExperimentPoint(
      { id: userId },
      site,
      MARKED_DECISION_POINT_STATUS.CONDITION_APPLIED,
      condition,
      loggerMock,
      target,
      undefined,
      undefined
    );
    expect(result).toMatchObject(monitoredDocument);
  });

  it('should handle fetched log data in any order', async () => {
    const userId = 'testUser';

    const loggerMock = { info: sandbox.stub(), error: sandbox.stub() };
    const logRepositoryMock = {
      getMetricUniquifierData: sandbox.stub().resolves([
        {
          data: { foo: 'bar' },
          uniquifier: 'uniquifier',
          timeStamp: '123',
          id: 'id1',
          key: 'metric_one',
        },
        {
          data: { foo: 'bar' },
          uniquifier: 'uniquifier',
          timeStamp: '321',
          id: 'id2',
          key: 'metric_two',
        },
        {
          data: { foo: 'bar' },
          uniquifier: 'uniquifier',
          timeStamp: '123',
          id: 'id1',
          key: 'metric_three',
        },
      ]),
      updateLog: sandbox.stub().resolves([]),
      save: sandbox.stub().callsFake((args) => {
        return args;
      }),
    };
    const metricRepositoryMock = {
      findMetricsWithQueries: sandbox.stub().resolves([{ key: 'class@__@key@__@foo', type: 'bar' }]),
    };

    const jsonLog = [
      {
        timeStamp: '123',
        metrics: {
          groupedMetrics: [
            {
              groupClass: 'class',
              groupKey: 'key',
              groupUniquifier: 'uniquifier',
              attributes: {
                foo: 1,
              },
            },
          ],
        },
      },
    ];

    const mergedLog = [
      {
        metrics: [
          {
            key: 'class@__@key@__@foo',
            type: 'bar',
          },
        ],
      },
    ];

    testedModule.logRepository = logRepositoryMock;
    testedModule.metricRepository = metricRepositoryMock;

    const result = await testedModule.dataLog({ id: userId }, jsonLog, loggerMock);
    expect(result).toMatchObject(mergedLog);
  });
});
