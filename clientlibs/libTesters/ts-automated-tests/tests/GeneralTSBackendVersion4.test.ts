import { HookResponse } from '../../shared/models';
import { GeneralTSBackendVersion4 } from '../../ts-lib-tester-backend-server/src/mockBackendTSServerApps/GeneralTSBackendVersion4';
import { describe, beforeAll, afterAll, it, expect } from '@jest/globals';
import { TestUser, TSAutomatedTestUtils } from './common';
import { IExperimentAssignmentv4, MARKED_DECISION_POINT_STATUS } from '../../../../types/src';

describe('GeneralTSBackendVersion4 automated hook tests', () => {
  const mockApp: GeneralTSBackendVersion4 = new GeneralTSBackendVersion4();
  const clientLibraryVersion = '4.1.6';
  // const apiHostUrl = 'http://localhost:3030';
  const apiHostUrl = 'https://upgradeapi.qa-cli.com';
  let TestUtils: TSAutomatedTestUtils;
  let experiment: any; // Experiment type isn't exposed?

  beforeAll(async () => {
    TestUtils = new TSAutomatedTestUtils(new GeneralTSBackendVersion4(), clientLibraryVersion, apiHostUrl);
    experiment = mockV4FactorialExperiment;
    await TestUtils.createTestExperiment(experiment);
  });

  afterAll(async () => {
    await TestUtils.deleteTestExperiment(mockV4FactorialExperiment.id);
  });

  describe('#init', () => {
    it(`should successfully call "init" with user id only`, async () => {
      const testUser: TestUser = new TestUser('123', { group1: ['group1id'] }, { group1: 'group1id' }, ['alias1']);

      const initResponse: HookResponse = await TestUtils.initTestUser(testUser);

      expect(initResponse?.response?.id).toEqual('123');
    });
  });

  describe('#setGroupMembership', () => {
    it(`should successfully set "setGroupMembership" on user`, async () => {
      const testUser: TestUser = new TestUser('123', { group1: ['group1id'] }, { group1: 'group1id' }, ['alias1']);

      // initialize user make sure we are not depending on #init test to execute this one
      await TestUtils.initTestUser(testUser);
      const groupMembershipResponse: HookResponse = await TestUtils.dispatchHook(
        mockApp.HOOKNAMES.GROUP_MEMBERSHIP,
        testUser
      );

      expect(groupMembershipResponse?.response?.group).toEqual({ group1: ['group1id'] });
    });
  });

  describe('#setWorkingGroup', () => {
    it(`should successfully set "setWorkingGroup" on user`, async () => {
      const testUser: TestUser = new TestUser('123', { group1: ['group1id'] }, { group1: 'group1id' }, ['alias1']);

      // initialize user make sure we are not depending on #init test to execute this one
      await TestUtils.initTestUser(testUser);
      const workingGroupResponse: HookResponse = await TestUtils.dispatchHook(
        mockApp.HOOKNAMES.WORKING_GROUPS,
        testUser
      );

      expect(workingGroupResponse?.response?.workingGroup).toEqual({ group1: 'group1id' });
    });
  });

  describe('#setAltIds', () => {
    it(`should successfully set "setAltIds" on user`, async () => {
      const testUser: TestUser = new TestUser('123', { group1: ['group1id'] }, { group1: 'group1id' }, ['alias1']);

      // initialize user make sure we are not depending on #init test to execute this one
      await TestUtils.initTestUser(testUser);
      const altIdsResponse: HookResponse = await TestUtils.dispatchHook(mockApp.HOOKNAMES.SET_ALT_USER_IDS, testUser);

      expect(altIdsResponse?.response).toEqual({ aliases: ['alias1'], userId: '123' });
    });
  });

  describe('#getAllExperimentConditions', () => {
    it(`should successfully call "getAllExperimentConditions"`, async () => {
      const testUser: TestUser = new TestUser('123', { group1: ['group1id'] }, { group1: 'group1id' }, ['alias1']);

      // initialize user make sure we are not depending on #init test to execute this one
      await TestUtils.initTestUser(testUser);
      const allExperimentConditionsResponse: HookResponse = await TestUtils.dispatchHook(
        mockApp.HOOKNAMES.ASSIGN,
        testUser
      );
      const assignments: IExperimentAssignmentv4[] = allExperimentConditionsResponse?.response;

      expect(assignments).toEqual([
        {
          assignedCondition: {
            conditionCode: 'banana=red; apple=red',
            experimentId: '03aa828a-97a5-4e35-a8aa-8b2c494548da',
            id: 'f76826f8-ab6a-4425-a45f-0b11cd38e193',
            payload: null,
          },
          assignedFactor: {
            banana: {
              level: 'red',
              payload: null,
            },
            apple: {
              level: 'red',
              payload: null,
            },
          },
          experimentType: 'Factorial',
          site: 'test_site',
          target: 'target_1',
        },
      ]);
    });
  });

  describe('#getExperimentCondition', () => {
    it('should successfully access all Assignment property getters', async () => {
      const testUser: TestUser = new TestUser('123', { group1: ['group1id'] }, { group1: 'group1id' }, ['alias1']);

      // initialize user make sure we are not depending on #init test to execute this one
      await TestUtils.initTestUser(testUser);
      // test out the Assignment class, need to expose this object type
      const decisionPointAssignment: HookResponse = await TestUtils.dispatchHook(
        mockApp.HOOKNAMES.GET_ASSIGNMENT,
        testUser
      );

      const assignment = decisionPointAssignment?.response;
      console.log('assignment', assignment);

      expect(assignment?.getCondition()).toEqual('banana=red; apple=red');
      expect(assignment?.getPayload()).toEqual(null);
      expect(assignment?.getExperimentType()).toEqual('Factorial');
      expect(assignment?.factors).toEqual(['banana', 'apple']);
      expect(assignment?.getFactorLevel('banana')).toEqual('red');
      // is this a bug?
      // expect(assignment?.getFactorPayload('banana')).toEqual(null);
    });
  });

  describe('#markExperimentPoint', () => {
    it('should successfully call "markExperimentPoint"', async () => {
      const testUser: TestUser = new TestUser('123', { group1: ['group1id'] }, { group1: 'group1id' }, ['alias1']);

      // initialize user make sure we are not depending on #init test to execute this one
      await TestUtils.initTestUser(testUser);
      const markExperimentPointResponse: HookResponse = await TestUtils.dispatchHook(
        mockApp.HOOKNAMES.MARK_EXPERIMENT_POINT,
        testUser,
        {
          condition: 'banana=red; apple=red',
        }
      );

      expect(markExperimentPointResponse?.response).toEqual({
        condition: MARKED_DECISION_POINT_STATUS.CONDITION_APPLIED,
        experimentId: null,
        id: mockV4FactorialExperiment.id,
        site: 'test_site',
        target: 'banana=red; apple=red',
        userId: '123',
      });
    });
  });
});

export const mockV4FactorialExperiment = {
  createdAt: '2023-07-06T16:34:44.912Z',
  updatedAt: '2023-07-06T16:34:44.912Z',
  versionNumber: 1,
  id: '03aa828a-97a5-4e35-a8aa-8b2c494548da',
  name: 'ts-lib-test',
  description: '',
  context: ['lib-tester'],
  state: 'enrolling',
  startOn: null,
  consistencyRule: 'individual',
  assignmentUnit: 'individual',
  postExperimentRule: 'continue',
  enrollmentCompleteCondition: null,
  endOn: null,
  revertTo: null,
  tags: [],
  group: null,
  logging: false,
  filterMode: 'includeAll',
  backendVersion: '4.1.7',
  type: 'Factorial',
  partitions: [
    {
      createdAt: '2023-07-06T16:34:44.912Z',
      updatedAt: '2023-07-06T16:34:44.912Z',
      versionNumber: 1,
      id: '49e27287-c468-4248-83ce-2d1a3b0deb0c',
      twoCharacterId: 'LS',
      site: 'test_site',
      target: 'target_1',
      description: '',
      order: 1,
      excludeIfReached: false,
      conditionPayloads: [],
    },
  ],
  conditions: [
    {
      createdAt: '2023-07-06T16:34:44.912Z',
      updatedAt: '2023-07-06T16:34:44.912Z',
      versionNumber: 1,
      id: 'f76826f8-ab6a-4425-a45f-0b11cd38e193',
      twoCharacterId: '9C',
      name: 'banana=red; apple=red',
      description: null,
      conditionCode: 'banana=red; apple=red',
      assignmentWeight: 25,
      order: 1,
      levelCombinationElements: [
        {
          createdAt: '2023-07-06T16:34:44.912Z',
          updatedAt: '2023-07-06T16:34:44.912Z',
          versionNumber: 1,
          id: '529cc697-f277-42c6-86ab-5ab003218b52',
          level: {
            createdAt: '2023-07-06T16:34:44.912Z',
            updatedAt: '2023-07-06T16:34:44.912Z',
            versionNumber: 1,
            id: 'a7c05a87-3aee-47c3-b203-ae2b88a25ea3',
            name: 'red',
            description: null,
            payloadValue: '',
            payloadType: 'string',
            order: null,
          },
        },
        {
          createdAt: '2023-07-06T16:34:44.912Z',
          updatedAt: '2023-07-06T16:34:44.912Z',
          versionNumber: 1,
          id: '804ccbcb-0896-4c42-8c89-f317205720a0',
          level: {
            createdAt: '2023-07-06T16:34:44.912Z',
            updatedAt: '2023-07-06T16:34:44.912Z',
            versionNumber: 1,
            id: 'a4cb3ff7-1fb9-491f-9e42-0b1644657471',
            name: 'red',
            description: null,
            payloadValue: '',
            payloadType: 'string',
            order: null,
          },
        },
      ],
    },
    {
      createdAt: '2023-07-06T16:34:44.912Z',
      updatedAt: '2023-07-06T16:34:44.912Z',
      versionNumber: 1,
      id: 'e72dc305-6672-43a2-becc-506316939feb',
      twoCharacterId: '8K',
      name: 'banana=red; apple=yellow',
      description: null,
      conditionCode: 'banana=red; apple=yellow',
      assignmentWeight: 25,
      order: 2,
      levelCombinationElements: [
        {
          createdAt: '2023-07-06T16:34:44.912Z',
          updatedAt: '2023-07-06T16:34:44.912Z',
          versionNumber: 1,
          id: '9ddfd917-2a4c-42cb-af20-b20311c2cd5c',
          level: {
            createdAt: '2023-07-06T16:34:44.912Z',
            updatedAt: '2023-07-06T16:34:44.912Z',
            versionNumber: 1,
            id: 'a7c05a87-3aee-47c3-b203-ae2b88a25ea3',
            name: 'red',
            description: null,
            payloadValue: '',
            payloadType: 'string',
            order: null,
          },
        },
        {
          createdAt: '2023-07-06T16:34:44.912Z',
          updatedAt: '2023-07-06T16:34:44.912Z',
          versionNumber: 1,
          id: '5394291c-3f4c-4223-bb39-29d8184b4e61',
          level: {
            createdAt: '2023-07-06T16:34:44.912Z',
            updatedAt: '2023-07-06T16:34:44.912Z',
            versionNumber: 1,
            id: 'bf8ffb44-4a77-45bb-97f1-6aa931e5eac5',
            name: 'yellow',
            description: null,
            payloadValue: '',
            payloadType: 'string',
            order: null,
          },
        },
      ],
    },
    {
      createdAt: '2023-07-06T16:34:44.912Z',
      updatedAt: '2023-07-06T16:34:44.912Z',
      versionNumber: 1,
      id: 'aa704d33-ecd7-423d-bf9f-ef723eaa57c2',
      twoCharacterId: '79',
      name: 'banana=yellow; apple=red',
      description: null,
      conditionCode: 'banana=yellow; apple=red',
      assignmentWeight: 25,
      order: 3,
      levelCombinationElements: [
        {
          createdAt: '2023-07-06T16:34:44.912Z',
          updatedAt: '2023-07-06T16:34:44.912Z',
          versionNumber: 1,
          id: '196f9635-a755-4f77-80c5-e29bd0268668',
          level: {
            createdAt: '2023-07-06T16:34:44.912Z',
            updatedAt: '2023-07-06T16:34:44.912Z',
            versionNumber: 1,
            id: '0a7ab700-97ab-4084-89ca-145eaefc88b1',
            name: 'yellow',
            description: null,
            payloadValue: '',
            payloadType: 'string',
            order: null,
          },
        },
        {
          createdAt: '2023-07-06T16:34:44.912Z',
          updatedAt: '2023-07-06T16:34:44.912Z',
          versionNumber: 1,
          id: 'fe4e8ad3-2cb9-45f4-9bf1-eceebe7175c0',
          level: {
            createdAt: '2023-07-06T16:34:44.912Z',
            updatedAt: '2023-07-06T16:34:44.912Z',
            versionNumber: 1,
            id: 'a4cb3ff7-1fb9-491f-9e42-0b1644657471',
            name: 'red',
            description: null,
            payloadValue: '',
            payloadType: 'string',
            order: null,
          },
        },
      ],
    },
    {
      createdAt: '2023-07-06T16:34:44.912Z',
      updatedAt: '2023-07-06T16:34:44.912Z',
      versionNumber: 1,
      id: '88ff6228-e823-4e3b-91a4-61f8e97de286',
      twoCharacterId: 'EV',
      name: 'banana=yellow; apple=yellow',
      description: null,
      conditionCode: 'banana=yellow; apple=yellow',
      assignmentWeight: 25,
      order: 4,
      levelCombinationElements: [
        {
          createdAt: '2023-07-06T16:34:44.912Z',
          updatedAt: '2023-07-06T16:34:44.912Z',
          versionNumber: 1,
          id: 'e7bcd92c-3013-4d67-9cb3-58c4df881682',
          level: {
            createdAt: '2023-07-06T16:34:44.912Z',
            updatedAt: '2023-07-06T16:34:44.912Z',
            versionNumber: 1,
            id: '0a7ab700-97ab-4084-89ca-145eaefc88b1',
            name: 'yellow',
            description: null,
            payloadValue: '',
            payloadType: 'string',
            order: null,
          },
        },
        {
          createdAt: '2023-07-06T16:34:44.912Z',
          updatedAt: '2023-07-06T16:34:44.912Z',
          versionNumber: 1,
          id: '920f8c02-98b0-434e-b709-476ad56b3c91',
          level: {
            createdAt: '2023-07-06T16:34:44.912Z',
            updatedAt: '2023-07-06T16:34:44.912Z',
            versionNumber: 1,
            id: 'bf8ffb44-4a77-45bb-97f1-6aa931e5eac5',
            name: 'yellow',
            description: null,
            payloadValue: '',
            payloadType: 'string',
            order: null,
          },
        },
      ],
    },
  ],
  stateTimeLogs: [],
  queries: [],
  experimentSegmentInclusion: {
    createdAt: '2023-07-06T16:34:44.912Z',
    updatedAt: '2023-07-06T16:34:44.912Z',
    versionNumber: 1,
    segment: {
      createdAt: '2023-07-06T16:34:44.945Z',
      updatedAt: '2023-07-06T16:34:44.945Z',
      versionNumber: 1,
      id: '60f53a01-73b4-41d5-b9c4-14d89993e98d',
      name: '03aa828a-97a5-4e35-a8aa-8b2c494548da Inclusion Segment',
      description: '03aa828a-97a5-4e35-a8aa-8b2c494548da Inclusion Segment',
      context: 'assign-prog',
      type: 'private',
      individualForSegment: [],
      groupForSegment: [
        {
          createdAt: '2023-07-06T16:34:44.945Z',
          updatedAt: '2023-07-06T16:34:44.945Z',
          versionNumber: 1,
          groupId: 'All',
          type: 'All',
        },
      ],
      subSegments: [],
    },
  },
  experimentSegmentExclusion: {
    createdAt: '2023-07-06T16:34:44.912Z',
    updatedAt: '2023-07-06T16:34:44.912Z',
    versionNumber: 1,
    segment: {
      createdAt: '2023-07-06T16:34:45.013Z',
      updatedAt: '2023-07-06T16:34:45.013Z',
      versionNumber: 1,
      id: 'a8e35c17-d506-40c9-bcf4-b4f51bd911b5',
      name: '03aa828a-97a5-4e35-a8aa-8b2c494548da Exclusion Segment',
      description: '03aa828a-97a5-4e35-a8aa-8b2c494548da Exclusion Segment',
      context: 'assign-prog',
      type: 'private',
      individualForSegment: [],
      groupForSegment: [],
      subSegments: [],
    },
  },
  factors: [
    {
      id: '6980ed6e-5134-458c-be52-2193406c4423',
      name: 'apple',
      order: 2,
      description: '',
      levels: [
        {
          createdAt: '2023-07-06T16:34:44.912Z',
          updatedAt: '2023-07-06T16:34:44.912Z',
          versionNumber: 1,
          id: 'bf8ffb44-4a77-45bb-97f1-6aa931e5eac5',
          name: 'yellow',
          description: null,
          order: null,
          payload: { type: 'string', value: '' },
        },
        {
          createdAt: '2023-07-06T16:34:44.912Z',
          updatedAt: '2023-07-06T16:34:44.912Z',
          versionNumber: 1,
          id: 'a4cb3ff7-1fb9-491f-9e42-0b1644657471',
          name: 'red',
          description: null,
          order: null,
          payload: { type: 'string', value: '' },
        },
      ],
    },
    {
      id: '855907c9-2f23-4223-8c63-e59545537aba',
      name: 'banana',
      order: 1,
      description: '',
      levels: [
        {
          createdAt: '2023-07-06T16:34:44.912Z',
          updatedAt: '2023-07-06T16:34:44.912Z',
          versionNumber: 1,
          id: '0a7ab700-97ab-4084-89ca-145eaefc88b1',
          name: 'yellow',
          description: null,
          order: null,
          payload: { type: 'string', value: '' },
        },
        {
          createdAt: '2023-07-06T16:34:44.912Z',
          updatedAt: '2023-07-06T16:34:44.912Z',
          versionNumber: 1,
          id: 'a7c05a87-3aee-47c3-b203-ae2b88a25ea3',
          name: 'red',
          description: null,
          order: null,
          payload: { type: 'string', value: '' },
        },
      ],
    },
  ],
  conditionPayloads: [],
};
