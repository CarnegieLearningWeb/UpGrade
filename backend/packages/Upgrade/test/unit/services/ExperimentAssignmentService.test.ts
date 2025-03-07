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
  simpleIndividualAssignmentExperiment2,
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
import { MoocletExperimentService } from '../../../src/api/services/MoocletExperimentService';
import { factorialGroupExperiment } from '../mockdata/raw';
import { MoocletRewardsService } from '../../../src/api/services/MoocletRewardsService';
import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';
import { ConditionPayloadRepository } from '../../../src/api/repositories/ConditionPayloadRepository';
import { FactorRepository } from '../../../src/api/repositories/FactorRepository';

describe('Experiment Assignment Service Test', () => {
  let sandbox;
  let testedModule;
  let loggerMock = sinon.createStubInstance(UpgradeLogger);

  let decisionPointRepositoryMock = sinon.createStubInstance(DecisionPointRepository);
  let individualExclusionRepositoryMock = sinon.createStubInstance(IndividualExclusionRepository);
  let groupExclusionRepositoryMock = sinon.createStubInstance(GroupExclusionRepository);
  let groupEnrollmentRepositoryMock = sinon.createStubInstance(GroupEnrollmentRepository);
  let individualEnrollmentRepositoryMock = sinon.createStubInstance(IndividualEnrollmentRepository);
  let previewUserServiceMock = sinon.createStubInstance(PreviewUserService);
  let conditionPayloadRepositoryMock = sinon.createStubInstance(ConditionPayloadRepository);
  let factorRepositoryMock = sinon.createStubInstance(FactorRepository);
  const experimentRepositoryMock = sinon.createStubInstance(ExperimentRepository);
  const monitoredDecisionPointLogRepositoryMock = sinon.createStubInstance(MonitoredDecisionPointLogRepository);
  const monitoredDecisionPointRepositoryMock = sinon.createStubInstance(MonitoredDecisionPointRepository);
  const errorRepositoryMock = sinon.createStubInstance(ErrorRepository);
  const logRepositoryMock = sinon.createStubInstance(LogRepository);
  const metricRepositoryMock = sinon.createStubInstance(MetricRepository);
  const stateTimeLogsRepositoryMock = sinon.createStubInstance(StateTimeLogsRepository);
  const analyticsRepositoryMock = sinon.createStubInstance(AnalyticsRepository);
  const userStratificationFactorRepositoryMock = sinon.createStubInstance(UserStratificationFactorRepository);
  const experimentUserServiceMock = sinon.createStubInstance(ExperimentUserService);
  const errorServiceMock = sinon.createStubInstance(ErrorService);
  const settingServiceMock = sinon.createStubInstance(SettingService);
  const segmentServiceMock = sinon.createStubInstance(SegmentService);
  const experimentServiceMock = sinon.createStubInstance(ExperimentService);
  const cacheServiceMock = sinon.createStubInstance(CacheService);
  const moocletExperimentServiceMock = sinon.createStubInstance(MoocletExperimentService);
  const moocletRewardsServiceMock = sinon.createStubInstance(MoocletRewardsService);
  experimentServiceMock.formattingConditionPayload.restore();
  experimentServiceMock.formattingPayload.restore();

  beforeAll(() => {
    configureLogger();
  });

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    loggerMock = { info: sandbox.stub(), error: sandbox.stub() };
    decisionPointRepositoryMock = { find: sandbox.stub().resolves([]) };
    individualExclusionRepositoryMock = { findExcluded: sandbox.stub().resolves([]) };
    groupExclusionRepositoryMock = { findExcluded: sandbox.stub().resolves([]) };
    individualEnrollmentRepositoryMock = {
      findEnrollments: sandbox.stub().resolves([]),
      find: sandbox.stub().resolves([]),
    };
    groupEnrollmentRepositoryMock = {
      findEnrollments: sandbox.stub().resolves([]),
      delete: sandbox.stub().resolves(),
    };
    previewUserServiceMock = { findOne: sandbox.stub().resolves(undefined) };
    conditionPayloadRepositoryMock = { find: sandbox.stub().resolves([]) };
    factorRepositoryMock = { find: sandbox.stub().resolves([]) };

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
      userStratificationFactorRepositoryMock,
      previewUserServiceMock,
      experimentUserServiceMock,
      errorServiceMock,
      settingServiceMock,
      segmentServiceMock,
      experimentServiceMock,
      cacheServiceMock,
      moocletExperimentServiceMock,
      moocletRewardsServiceMock
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

  it('should return an empty array if there are no experiments and check [getExperimentsForUser] function', async () => {
    const userDoc = { id: 'user123', group: 'group', workingGroup: {}, requestedUserId: '12345' };
    const context = 'context';
    const experimentUserServiceMock = {
      getOriginalUserDoc: sandbox.stub().resolves({ id: userDoc.id, group: userDoc.group, workingGroup: {} }),
    };

    testedModule.cacheService.wrap = sandbox.stub().resolves([]);
    testedModule.experimentRepository.getValidExperimentsWithPreview = sandbox.stub().resolves([]);
    testedModule.experimentService.getCachedValidExperiments = sandbox.stub().resolves([]);
    testedModule.experimentUserService = experimentUserServiceMock;
    testedModule.segmentService.getSegmentByIds.resolves([
      { id: '77777777-7777-7777-7777-777777777777', subSegments: [], individualForSegment: [], groupForSegment: [] },
    ]);

    const result = await testedModule.getAllExperimentConditions(userDoc, context, loggerMock);
    expect(result).toEqual([]);
    sinon.assert.calledWith(loggerMock.info, {
      message: `getAllExperimentConditions: User: ${userDoc.requestedUserId}`,
    });

    const experimentResult = await testedModule.getExperimentsForUser(userDoc, context);
    expect(experimentResult).toEqual([]);
  });

  it('should return the assigned condition for a simple individual experiment', async () => {
    const context = 'context';
    const userDoc = { id: 'user123', group: { schoolId: ['school1'] }, workingGroup: {} };
    const exp = simpleIndividualAssignmentExperiment;

    const experimentUserServiceMock = { getOriginalUserDoc: sandbox.stub().resolves(userDoc) };
    testedModule.cacheService.wrap = sandbox.stub().resolves([exp]);
    testedModule.experimentRepository.getValidExperimentsWithPreview = sandbox.stub().resolves([]);
    testedModule.experimentService.getCachedValidExperiments = sandbox.stub().resolves([exp]);
    testedModule.experimentUserService = experimentUserServiceMock;

    const result = await testedModule.getAllExperimentConditions(userDoc, context, loggerMock);
    const cond = { ...exp.conditions[0], experimentId: exp.id, payload: undefined };
    expect(result.length).toEqual(1);
    expect(result[0].site).toEqual(exp.partitions[0].site);
    expect(result[0].target).toEqual(exp.partitions[0].target);
    expect(result[0].assignedFactor).toBeNull();
    expect(result[0].assignedCondition[0]).toEqual(cond);
  });

  it('should return the assigned condition for a factorial individual experiment', async () => {
    const context = 'context';
    const userDoc = { id: 'user123', group: { schoolId: ['school1'] }, workingGroup: {} };
    const exp = factorialIndividualAssignmentExperiment;

    const experimentUserServiceMock = { getOriginalUserDoc: sandbox.stub().resolves(userDoc) };
    testedModule.experimentService.getCachedValidExperiments = sandbox.stub().resolves([exp]);
    testedModule.experimentUserService = experimentUserServiceMock;

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
    const context = 'context';
    const userDoc = { id: 'user123', group: { schoolId: ['school1'] }, workingGroup: {} };
    const exp = simpleWithinSubjectOrderedRoundRobinExperiment;

    const experimentUserServiceMock = { getOriginalUserDoc: sandbox.stub().resolves(userDoc) };
    const monitoredDecisionPointLogRepositoryMock = {
      find: sandbox.stub().resolves(0),
      getAllMonitoredDecisionPointLog: sandbox.stub().resolves([]),
    };

    testedModule.experimentService.getCachedValidExperiments = sandbox.stub().resolves([exp]);
    testedModule.experimentUserService = experimentUserServiceMock;
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
    const context = 'context';
    const userDoc = { id: 'user123', group: { 'add-group1': ['school1'] }, workingGroup: { 'add-group1': 'school1' } };
    const exp = simpleGroupAssignmentExperiment;
    const groupEnrollment = new GroupEnrollment();
    groupEnrollment.experiment = exp;
    groupEnrollment.condition = exp.conditions[0];
    groupEnrollment.groupId = 'add-group1';

    const experimentUserServiceMock = { getOriginalUserDoc: sandbox.stub().resolves(userDoc) };
    groupEnrollmentRepositoryMock = {
      findEnrollments: sandbox.stub().resolves([groupEnrollment]),
      delete: sandbox.stub().resolves(),
    };

    testedModule.experimentService.getExperimentsForUser = sandbox.stub().resolves([exp]);
    testedModule.experimentService.getCachedValidExperiments = sandbox.stub().resolves([exp]);
    testedModule.experimentService.checkUserOrGroupIsGloballyExcluded = sandbox.stub().resolves([false, false]);
    testedModule.experimentService.filterAndProcessGroupExperiments = sandbox.stub().resolves([exp]);
    testedModule.experimentService.getInvalidGroupNotEnrolledExperiments = sandbox.stub().resolves([exp]);
    testedModule.experimentService.getAssignmentsAndExclusionsForUser = sandbox
      .stub()
      .resolves([
        individualEnrollmentRepositoryMock,
        groupEnrollmentRepositoryMock,
        individualExclusionRepositoryMock,
        groupExclusionRepositoryMock,
      ]);
    testedModule.experimentService.processExperimentPools = sandbox.stub().resolves([exp]);
    testedModule.experimentService.mapDecisionPoints = sandbox.stub().resolves([decisionPointRepositoryMock]);
    testedModule.experimentService.getPayloadAndFactorialObject = sandbox
      .stub()
      .resolves([{ payloadFound: conditionPayloadRepositoryMock, factorialObject: factorRepositoryMock }]);
    testedModule.experimentUserService = experimentUserServiceMock;

    const result = await testedModule.getAllExperimentConditions(userDoc, context, loggerMock);

    const cond = { ...exp.conditions[0], experimentId: exp.id, payload: undefined };
    expect(result.length).toEqual(1);
    expect(result[0].site).toEqual(exp.partitions[0].site);
    expect(result[0].target).toEqual(exp.partitions[0].target);
    expect(result[0].assignedFactor).toBeNull();
    expect(result[0].assignedCondition[0]).toEqual(cond);
  });

  it('should return the assigned condition for a factorial group experiment', async () => {
    const context = 'context';
    const userDoc = { id: 'user123', group: { 'add-group1': ['school1'] }, workingGroup: { 'add-group1': 'school1' } };
    const exp = factorialGroupAssignmentExperiment;
    const groupEnrollment = new GroupEnrollment();
    groupEnrollment.experiment = exp;
    groupEnrollment.condition = exp.conditions[0];
    groupEnrollment.groupId = 'add-group1';
    groupEnrollment.partition = exp.partitions[0];

    const experimentUserServiceMock = { getOriginalUserDoc: sandbox.stub().resolves(userDoc) };
    groupEnrollmentRepositoryMock = {
      findEnrollments: sandbox.stub().resolves([groupEnrollment]),
      delete: sandbox.stub().resolves(),
    };

    testedModule.experimentService.getExperimentsForUser = sandbox.stub().resolves([exp]);
    testedModule.experimentService.getCachedValidExperiments = sandbox.stub().resolves([exp]);
    testedModule.experimentService.checkUserOrGroupIsGloballyExcluded = sandbox.stub().resolves([false, false]);
    testedModule.experimentService.filterAndProcessGroupExperiments = sandbox.stub().resolves([exp]);
    testedModule.experimentService.getInvalidGroupNotEnrolledExperiments = sandbox.stub().resolves([exp]);
    testedModule.experimentService.getAssignmentsAndExclusionsForUser = sandbox
      .stub()
      .resolves([
        individualEnrollmentRepositoryMock,
        groupEnrollmentRepositoryMock,
        individualExclusionRepositoryMock,
        groupExclusionRepositoryMock,
      ]);
    testedModule.experimentService.processExperimentPools = sandbox.stub().resolves([exp]);
    testedModule.experimentService.mapDecisionPoints = sandbox.stub().resolves([decisionPointRepositoryMock]);
    testedModule.experimentService.getPayloadAndFactorialObject = sandbox
      .stub()
      .resolves([{ payloadFound: conditionPayloadRepositoryMock, factorialObject: factorRepositoryMock }]);
    testedModule.experimentUserService = experimentUserServiceMock;

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

  it('[checkUserOrGroupIsGloballyExcluded] should return false for user and group exclusions', async () => {
    const userDoc = { id: 'user123', group: { schoolId: ['school1'] }, workingGroup: {} };
    const exclusionStatus = [false, false];

    const exclusionResult = await testedModule.experimentService.checkUserOrGroupIsGloballyExcluded(userDoc);
    expect(exclusionResult).toEqual(exclusionStatus);
  });

  it('[getAssignmentsAndExclusionsForUser] should return empty enrollment/exclusion user and group documents', async () => {
    const experimentUser = {
      id: 'user123',
      group: { schoolId: ['school1'] },
      workingGroup: {},
    };
    const experimentIds = ['be3ae74f-370a-4015-93f3-7761d16f8b17'];

    // Call function
    const [individualEnrollments, groupEnrollments, individualExclusions, groupExclusions] =
      await testedModule.getAssignmentsAndExclusionsForUser(experimentUser, experimentIds);

    // Assertions: Ensure the function returns the expected values
    expect(individualEnrollments).toEqual([]);
    expect(groupEnrollments).toEqual([]);
    expect(individualExclusions).toEqual([]);
    expect(groupExclusions).toEqual([]);
  });

  it('[filterAndProcessGroupExperiments] should return the experiment if it is not a group experiment', async () => {
    const userDoc = { id: 'user123', group: { schoolId: ['school1'] }, workingGroup: {} }; // Invalid group
    const exp = simpleIndividualAssignmentExperiment;
    testedModule.getInvalidGroupNotEnrolledExperiments = sandbox.stub().resolves([]);

    const expResult = await testedModule.filterAndProcessGroupExperiments([exp], userDoc);
    expect(expResult).toEqual([exp]);

    // getInvalidGroupNotEnrolledExperiments should not be called
    sinon.assert.notCalled(testedModule.getInvalidGroupNotEnrolledExperiments);
  });

  it('[filterAndProcessGroupExperiments] should filter out invalid experiments', async () => {
    const userDoc = { id: 'user123', group: { schoolId: ['school1'] }, workingGroup: {} };
    const exp = factorialGroupExperiment;

    testedModule.getInvalidGroupNotEnrolledExperiments = sandbox.stub().resolves([exp]);

    const expResult = await testedModule.filterAndProcessGroupExperiments([exp], userDoc);
    expect(expResult).toEqual([]);
  });

  it('[experimentLevelExclusionInclusion] should return an empty exclusion reason if no user or userGroup is globally excluded', async () => {
    const userDoc = { id: 'user1', group: { schoolId: ['school1'] }, workingGroup: {} };
    const exp = simpleIndividualAssignmentExperiment;
    // stub the exclusion segment with empty individualForSegment and groupForSegment
    testedModule.segmentService.getSegmentByIds.resolves([
          { id: 'd958bf52-7066-4594-ad8a-baf2e75324cf', subSegments: [], individualForSegment: [], groupForSegment: [] },
    ]);
    const exclusionResult = await testedModule.checkUserOrGroupIsGloballyExcluded(userDoc);
    expect(exclusionResult).toEqual([false, false]);

    const [includedExpement, exclusionReason] = await testedModule.experimentLevelExclusionInclusion([exp], userDoc);
    expect(exclusionReason).toEqual([]);
    expect(includedExpement).toEqual([exp]);
  });

  it('[experimentLevelExclusionInclusion] should return an exclusion reason if a user or userGroup is globally excluded', async () => {
    const userDoc = { id: 'user2', group: { schoolId: ['school1'] }, workingGroup: {} };
    const exp = simpleIndividualAssignmentExperiment;

    // stub the global exclusion segment with user `user2` in individualForSegment and empty groupForSegment
    testedModule.segmentService.getSegmentByIds.withArgs(['77777777-7777-7777-7777-777777777777']).resolves([
      {
        id: '77777777-7777-7777-7777-777777777777',
        name: 'Global Exclude',
        description: 'Globally excluded Users, Groups and Segments',
        context: 'ALL',
        type: 'global_exclude',
        individualForSegment: [{ userId: 'user2' }],
        groupForSegment: [],
        subSegments: [],
      },
    ]);

    const exclusionResult = await testedModule.checkUserOrGroupIsGloballyExcluded(userDoc);
    expect(exclusionResult).toEqual([true, false]);

    const [includedExpement, exclusionReason] = await testedModule.experimentLevelExclusionInclusion([exp], userDoc);
    expect(exclusionReason).toEqual([]);
    expect(includedExpement).toEqual([exp]);
  });

  it('[createExperimentPool] should return empty pool of experiments for no active experiments', async () => {
    const expResult = await testedModule.createExperimentPool([]);
    expect(expResult).toEqual([]);
  });

  it('[createExperimentPool] should return pool of experiments with same decision points', async () => {
    const exp1 = simpleIndividualAssignmentExperiment;
    const exp2 = simpleIndividualAssignmentExperiment2;

    const expResult = await testedModule.createExperimentPool([exp1, exp2]);
    expect(expResult).toEqual([[exp1, exp2]]);
  });

    it('[processExperimentPools] should return not return a pool for no active experiment', async () => {
    const userDoc = { id: 'user123', group: { schoolId: ['school1'] }, workingGroup: {} };
    const exp = simpleIndividualAssignmentExperiment;
    const experimentIds = [exp.id];

    testedModule.createExperimentPool = sandbox.stub().returns([[exp]]);

    const [individualEnrollments, groupEnrollments, _, __] = await testedModule.getAssignmentsAndExclusionsForUser(
      userDoc,
      experimentIds
    );

    testedModule.filterAndProcessGroupExperiments = sandbox.stub().resolves([exp]);
    testedModule.experimentLevelExclusionInclusion = sandbox.stub().resolves([exp]);

    const expResult = await testedModule.processExperimentPools(
      [exp],
      individualEnrollments,
      groupEnrollments,
      userDoc
    );
    expect(expResult).toEqual([exp]);
  });

  it('[processExperimentPools] should return a selected seed random experiment from the pool of experiments', async () => {
    const userDoc = { id: 'user123', group: { schoolId: ['school1'] }, workingGroup: {} };
    const exp1 = simpleIndividualAssignmentExperiment;
    const exp2 = simpleIndividualAssignmentExperiment2;
    const experimentIds = [exp1.id, exp2.id];

    testedModule.createExperimentPool = sandbox.stub().returns([[exp1, exp2]]);

    const [individualEnrollments, groupEnrollments, _, __] = await testedModule.getAssignmentsAndExclusionsForUser(
      userDoc,
      experimentIds
    );

    testedModule.filterAndProcessGroupExperiments = sandbox.stub().resolves([exp1, exp2]);
    testedModule.experimentLevelExclusionInclusion = sandbox.stub().resolves([exp1, exp2]);

    const expResult = await testedModule.processExperimentPools(
      [exp1, exp2],
      individualEnrollments,
      groupEnrollments,
      userDoc
    );
    // based on the seed as userId: `user123`, exp2 is randomly selected from the pool of experiments:
    expect(expResult).toEqual([exp2]);
    expect(expResult.length).toEqual(1);
  });

  it('should log an error when clientError is provided', async () => {
    const userId = 'testUser';
    const site = 'testSite';
    const target = undefined;
    const condition = 'testCondition';
    const clientError = 'clientError';

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
    testedModule.experimentService.getExperimentsForUser = sandbox.stub().resolves([]);
    testedModule.experimentService.getCachedValidExperiments = sandbox.stub().resolves([]);
    testedModule.checkUserOrGroupIsGloballyExcluded = sandbox.stub().resolves([false, false]);
    testedModule.experimentService.filterAndProcessGroupExperiments = sandbox.stub().resolves([]);
    testedModule.getInvalidGroupNotEnrolledExperiments = sandbox.stub().resolves([]);
    testedModule.experimentService.getAssignmentsAndExclusionsForUser = sandbox
      .stub()
      .resolves([
        individualEnrollmentRepositoryMock,
        groupEnrollmentRepositoryMock,
        individualExclusionRepositoryMock,
        groupExclusionRepositoryMock,
      ]);

    testedModule.experimentService.processExperimentPools = sandbox.stub().resolves([]);
    testedModule.experimentService.mapDecisionPoints = sandbox.stub().resolves([decisionPointRepositoryMock]);
    testedModule.experimentService.getPayloadAndFactorialObject = sandbox
      .stub()
      .resolves([{ payloadFound: conditionPayloadRepositoryMock, factorialObject: factorRepositoryMock }]);
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

    testedModule.cacheService.wrap = sandbox.stub().resolves([]);
    testedModule.monitoredDecisionPointRepository = monitoredDecisionPointRepositoryMock;
    testedModule.experimentService.getPayloadAndFactorialObject = sandbox
      .stub()
      .resolves([{ payloadFound: conditionPayloadRepositoryMock, factorialObject: factorRepositoryMock }]);

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
    decisionPointRepositoryMock = { find: sandbox.stub().resolves([simpleDPExperiment]) };
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
    testedModule.experimentService.getExperimentsForUser = sandbox
      .stub()
      .resolves([simpleIndividualAssignmentExperiment]);
    testedModule.experimentService.getCachedValidExperiments = sandbox
      .stub()
      .resolves([simpleIndividualAssignmentExperiment]);
    testedModule.checkUserOrGroupIsGloballyExcluded = sandbox.stub().resolves([false, false]);
    testedModule.experimentService.filterAndProcessGroupExperiments = sandbox
      .stub()
      .resolves([simpleIndividualAssignmentExperiment]);
    testedModule.getInvalidGroupNotEnrolledExperiments = sandbox
      .stub()
      .resolves([simpleIndividualAssignmentExperiment]);
    testedModule.experimentService.getAssignmentsAndExclusionsForUser = sandbox
      .stub()
      .resolves([
        individualEnrollmentRepositoryMock,
        groupEnrollmentRepositoryMock,
        individualExclusionRepositoryMock,
        groupExclusionRepositoryMock,
      ]);
    testedModule.experimentService.processExperimentPools = sandbox
      .stub()
      .resolves([simpleIndividualAssignmentExperiment]);
    testedModule.experimentService.mapDecisionPoints = sandbox.stub().resolves([decisionPointRepositoryMock]);
    testedModule.experimentService.getPayloadAndFactorialObject = sandbox
      .stub()
      .resolves([{ payloadFound: conditionPayloadRepositoryMock, factorialObject: factorRepositoryMock }]);

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
    decisionPointRepositoryMock = { find: sandbox.stub().resolves([simpleDPExperiment]) };
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

    testedModule.experimentService.getExperimentsForUser = sandbox
      .stub()
      .resolves([simpleIndividualAssignmentExperiment]);
    testedModule.experimentService.getCachedValidExperiments = sandbox
      .stub()
      .resolves([simpleIndividualAssignmentExperiment]);
    testedModule.experimentService.checkUserOrGroupIsGloballyExcluded = sandbox.stub().resolves([false, false]);
    testedModule.experimentService.filterAndProcessGroupExperiments = sandbox
      .stub()
      .resolves([simpleIndividualAssignmentExperiment]);
    testedModule.experimentService.getInvalidGroupNotEnrolledExperiments = sandbox
      .stub()
      .resolves([simpleIndividualAssignmentExperiment]);
    testedModule.experimentService.getAssignmentsAndExclusionsForUser = sandbox
      .stub()
      .resolves([
        individualEnrollmentRepositoryMock,
        groupEnrollmentRepositoryMock,
        individualExclusionRepositoryMock,
        groupExclusionRepositoryMock,
      ]);
    testedModule.experimentService.processExperimentPools = sandbox
      .stub()
      .resolves([simpleIndividualAssignmentExperiment]);
    testedModule.experimentService.mapDecisionPoints = sandbox.stub().resolves([decisionPointRepositoryMock]);
    testedModule.experimentService.getPayloadAndFactorialObject = sandbox
      .stub()
      .resolves([{ payloadFound: conditionPayloadRepositoryMock, factorialObject: factorRepositoryMock }]);

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

    decisionPointRepositoryMock = { find: sandbox.stub().resolves([withinSubjectDPExperiment]) };
    testedModule.experimentService.getExperimentsForUser = sandbox
      .stub()
      .resolves([simpleIndividualAssignmentExperiment]);
    testedModule.experimentService.getCachedValidExperiments = sandbox
      .stub()
      .resolves([simpleIndividualAssignmentExperiment]);
    testedModule.experimentService.checkUserOrGroupIsGloballyExcluded = sandbox.stub().resolves([false, false]);
    testedModule.experimentService.filterAndProcessGroupExperiments = sandbox
      .stub()
      .resolves([simpleIndividualAssignmentExperiment]);
    testedModule.experimentService.getInvalidGroupNotEnrolledExperiments = sandbox
      .stub()
      .resolves([simpleIndividualAssignmentExperiment]);
    testedModule.experimentService.getAssignmentsAndExclusionsForUser = sandbox
      .stub()
      .resolves([
        individualEnrollmentRepositoryMock,
        groupEnrollmentRepositoryMock,
        individualExclusionRepositoryMock,
        groupExclusionRepositoryMock,
      ]);
    testedModule.experimentService.processExperimentPools = sandbox
      .stub()
      .resolves([simpleIndividualAssignmentExperiment]);
    testedModule.experimentService.mapDecisionPoints = sandbox.stub().resolves([decisionPointRepositoryMock]);
    testedModule.experimentService.getPayloadAndFactorialObject = sandbox
      .stub()
      .resolves([{ payloadFound: conditionPayloadRepositoryMock, factorialObject: factorRepositoryMock }]);

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
