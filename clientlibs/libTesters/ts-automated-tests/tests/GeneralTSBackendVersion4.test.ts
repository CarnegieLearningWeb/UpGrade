import { HookResponse } from '../../shared/models';
import { GeneralTSBackendVersion4 } from '../../ts-lib-tester-backend-server/src/mockBackendTSServerApps/GeneralTSBackendVersion4';
import { describe, beforeAll, afterAll, it, expect } from '@jest/globals';
import { TestUser, TSAutomatedTestUtils } from './common';
import { IExperimentAssignmentv4, MARKED_DECISION_POINT_STATUS } from '../../../../types/src';

describe('GeneralTSBackendVersion4 automated hook tests', () => {
  const mockApp: GeneralTSBackendVersion4 = new GeneralTSBackendVersion4();
  const clientLibraryVersion = 'local';
  const apiHostUrl = 'http://localhost:3030';
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
            conditionCode: 'asdf=orange; fdfasdfs=yellow',
            experimentId: '716edbbd-eecf-43b6-82a8-bd3f3b20e095',
            id: '5546de01-5ed0-4f93-b9dc-dc5d8daf17c9',
            payload: null,
          },
          assignedFactor: {
            asdf: {
              level: 'orange',
              payload: null,
            },
            fdfasdfs: {
              level: 'yellow',
              payload: null,
            },
          },
          experimentType: 'Factorial',
          site: 'test_site',
          target: 'target_1',
        },
      ]);

      it('should successfully access all Assignment property getters', async () => {
        // test out the Assignment class, need to expose this object type
        const decisionPointAssignment: HookResponse = await TestUtils.dispatchHook(
          mockApp.HOOKNAMES.GET_ASSIGNMENT,
          testUser
        );

        const assignment = decisionPointAssignment?.response;
        console.log({ assignment });

        expect(assignment?.getCondition()).toEqual('asdf=orange; fdfasdfs=yellow');
        expect(assignment?.getPayload()).toEqual(null);
        expect(assignment?.getExperimentType()).toEqual('Factorial');
        expect(assignment?.factors).toEqual(['asdf', 'fdfasdfs']);
        expect(assignment?.getFactorLevel('asdf')).toEqual('orange');
        // is this a bug?
        // expect(assignment?.getFactorPayload('asdf')).toEqual('test');
      });
    });
  });

  describe('#markExperimentPoint', () => {
    it('should successfully call "markExperimentPoint"', async () => {
      const testUser: TestUser = new TestUser('123', { group1: ['group1id'] }, { group1: 'group1id' }, ['alias1']);

      // initialize user make sure we are not depending on #init test to execute this one
      await TestUtils.initTestUser(testUser);
      const markExperimentPointResponse: HookResponse = await TestUtils.dispatchHook(
        mockApp.HOOKNAMES.MARK_EXPERIMENT_POINT,
        testUser
      );

      expect(markExperimentPointResponse?.response).toEqual({
        condition: MARKED_DECISION_POINT_STATUS.CONDITION_APPLIED,
        experimentId: null,
        id: mockV4FactorialExperiment.id,
        site: 'test_site',
        target: 'asdf=orange; fdfasdfs=green',
        userId: '123',
      });
    });
  });
});

export const mockV4FactorialExperiment = {
  createdAt: '2023-06-20T15:27:33.077Z',
  updatedAt: '2023-06-20T15:27:42.652Z',
  versionNumber: 2,
  id: '716edbbd-eecf-43b6-82a8-bd3f3b20e095',
  name: 'ts-v4-client-factorial',
  description: '',
  context: ['lib-tester-ts-backend-v4'],
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
      createdAt: '2023-06-20T15:27:33.077Z',
      updatedAt: '2023-06-20T15:27:33.077Z',
      versionNumber: 1,
      id: 'de7651a2-994c-441d-a149-3914aab4ab8f',
      twoCharacterId: '38',
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
      createdAt: '2023-06-20T15:27:33.077Z',
      updatedAt: '2023-06-20T15:27:33.077Z',
      versionNumber: 1,
      id: '1974eb8d-8a57-46e1-9ae9-0c2e96d3954b',
      twoCharacterId: 'GS',
      name: 'asdf=purple; fdfasdfs=yellow',
      description: null,
      conditionCode: 'asdf=purple; fdfasdfs=yellow',
      assignmentWeight: 25,
      order: 4,
      levelCombinationElements: [
        {
          createdAt: '2023-06-20T15:27:33.077Z',
          updatedAt: '2023-06-20T15:27:33.077Z',
          versionNumber: 1,
          id: 'fa488b24-522a-4bb2-8f1a-f3251020c6c4',
          level: {
            createdAt: '2023-06-20T15:27:33.077Z',
            updatedAt: '2023-06-20T15:27:33.077Z',
            versionNumber: 1,
            id: '8f891c26-7496-4674-88e1-e73e6ff625fe',
            name: 'yellow',
            description: null,
            payloadValue: '',
            payloadType: 'string',
            order: null,
          },
        },
        {
          createdAt: '2023-06-20T15:27:33.077Z',
          updatedAt: '2023-06-20T15:27:33.077Z',
          versionNumber: 1,
          id: 'c5b83b95-5fba-4f67-8df6-72a4e3e52e3c',
          level: {
            createdAt: '2023-06-20T15:27:33.077Z',
            updatedAt: '2023-06-20T15:27:33.077Z',
            versionNumber: 1,
            id: '3c6cdc23-3d1f-42b0-a57b-e22315b07f70',
            name: 'purple',
            description: null,
            payloadValue: '',
            payloadType: 'string',
            order: null,
          },
        },
      ],
    },
    {
      createdAt: '2023-06-20T15:27:33.077Z',
      updatedAt: '2023-06-20T15:27:33.077Z',
      versionNumber: 1,
      id: '842e3b71-ccc4-492c-ba15-b3a3adedf830',
      twoCharacterId: 'EL',
      name: 'asdf=purple; fdfasdfs=green',
      description: null,
      conditionCode: 'asdf=purple; fdfasdfs=green',
      assignmentWeight: 25,
      order: 3,
      levelCombinationElements: [
        {
          createdAt: '2023-06-20T15:27:33.077Z',
          updatedAt: '2023-06-20T15:27:33.077Z',
          versionNumber: 1,
          id: '52f7880d-dfca-45a7-8603-b8c67b5e036c',
          level: {
            createdAt: '2023-06-20T15:27:33.077Z',
            updatedAt: '2023-06-20T15:27:33.077Z',
            versionNumber: 1,
            id: 'fcd21f24-5e1c-4b68-b320-a00262b1ca63',
            name: 'green',
            description: null,
            payloadValue: '',
            payloadType: 'string',
            order: null,
          },
        },
        {
          createdAt: '2023-06-20T15:27:33.077Z',
          updatedAt: '2023-06-20T15:27:33.077Z',
          versionNumber: 1,
          id: 'd0a2761c-729f-4175-9a19-82ff61889f10',
          level: {
            createdAt: '2023-06-20T15:27:33.077Z',
            updatedAt: '2023-06-20T15:27:33.077Z',
            versionNumber: 1,
            id: '3c6cdc23-3d1f-42b0-a57b-e22315b07f70',
            name: 'purple',
            description: null,
            payloadValue: '',
            payloadType: 'string',
            order: null,
          },
        },
      ],
    },
    {
      createdAt: '2023-06-20T15:27:33.077Z',
      updatedAt: '2023-06-20T15:27:33.077Z',
      versionNumber: 1,
      id: '5546de01-5ed0-4f93-b9dc-dc5d8daf17c9',
      twoCharacterId: 'W0',
      name: 'asdf=orange; fdfasdfs=yellow',
      description: null,
      conditionCode: 'asdf=orange; fdfasdfs=yellow',
      assignmentWeight: 25,
      order: 2,
      levelCombinationElements: [
        {
          createdAt: '2023-06-20T15:27:33.077Z',
          updatedAt: '2023-06-20T15:27:33.077Z',
          versionNumber: 1,
          id: 'a3581b0d-6769-4b1e-9907-b4cf80d650c1',
          level: {
            createdAt: '2023-06-20T15:27:33.077Z',
            updatedAt: '2023-06-20T15:27:33.077Z',
            versionNumber: 1,
            id: '8f891c26-7496-4674-88e1-e73e6ff625fe',
            name: 'yellow',
            description: null,
            payloadValue: '',
            payloadType: 'string',
            order: null,
          },
        },
        {
          createdAt: '2023-06-20T15:27:33.077Z',
          updatedAt: '2023-06-20T15:27:33.077Z',
          versionNumber: 1,
          id: '57ec20b3-c19f-46bc-b8b4-c3764146487d',
          level: {
            createdAt: '2023-06-20T15:27:33.077Z',
            updatedAt: '2023-06-20T15:27:33.077Z',
            versionNumber: 1,
            id: 'e44c0691-6812-45ec-a2e9-e79963179c9c',
            name: 'orange',
            description: null,
            payloadValue: '',
            payloadType: 'string',
            order: null,
          },
        },
      ],
    },
    {
      createdAt: '2023-06-20T15:27:33.077Z',
      updatedAt: '2023-06-20T15:27:33.077Z',
      versionNumber: 1,
      id: 'f3e9b7c6-c6fa-4a25-bae4-a1263943f162',
      twoCharacterId: 'ZO',
      name: 'asdf=orange; fdfasdfs=green',
      description: null,
      conditionCode: 'asdf=orange; fdfasdfs=green',
      assignmentWeight: 25,
      order: 1,
      levelCombinationElements: [
        {
          createdAt: '2023-06-20T15:27:33.077Z',
          updatedAt: '2023-06-20T15:27:33.077Z',
          versionNumber: 1,
          id: '39d113a3-2c3c-423f-98d0-ec6c0ad65f42',
          level: {
            createdAt: '2023-06-20T15:27:33.077Z',
            updatedAt: '2023-06-20T15:27:33.077Z',
            versionNumber: 1,
            id: 'fcd21f24-5e1c-4b68-b320-a00262b1ca63',
            name: 'green',
            description: null,
            payloadValue: '',
            payloadType: 'string',
            order: null,
          },
        },
        {
          createdAt: '2023-06-20T15:27:33.077Z',
          updatedAt: '2023-06-20T15:27:33.077Z',
          versionNumber: 1,
          id: '3fc32f04-1350-4ead-aef7-c1155d46531f',
          level: {
            createdAt: '2023-06-20T15:27:33.077Z',
            updatedAt: '2023-06-20T15:27:33.077Z',
            versionNumber: 1,
            id: 'e44c0691-6812-45ec-a2e9-e79963179c9c',
            name: 'orange',
            description: null,
            payloadValue: '',
            payloadType: 'string',
            order: null,
          },
        },
      ],
    },
  ],
  stateTimeLogs: [
    {
      createdAt: '2023-06-20T15:27:42.659Z',
      updatedAt: '2023-06-20T15:27:42.659Z',
      versionNumber: 1,
      id: '1e443164-9408-4a7e-9692-b0c6fc47965c',
      fromState: 'inactive',
      toState: 'enrolling',
      timeLog: '2023-06-20T15:27:42.645Z',
    },
  ],
  queries: [],
  experimentSegmentInclusion: {
    createdAt: '2023-06-20T15:27:33.077Z',
    updatedAt: '2023-06-20T15:27:33.077Z',
    versionNumber: 1,
    segment: {
      createdAt: '2023-06-20T15:27:33.139Z',
      updatedAt: '2023-06-20T15:27:33.139Z',
      versionNumber: 1,
      id: 'd073022c-2731-4bd4-90f1-bc2ed800415c',
      name: '716edbbd-eecf-43b6-82a8-bd3f3b20e095 Inclusion Segment',
      description: '716edbbd-eecf-43b6-82a8-bd3f3b20e095 Inclusion Segment',
      context: 'lib-tester-ts-backend-v4',
      type: 'private',
      individualForSegment: [],
      groupForSegment: [
        {
          createdAt: '2023-06-20T15:27:33.139Z',
          updatedAt: '2023-06-20T15:27:33.139Z',
          versionNumber: 1,
          groupId: 'All',
          type: 'All',
        },
      ],
      subSegments: [],
    },
  },
  experimentSegmentExclusion: {
    createdAt: '2023-06-20T15:27:33.077Z',
    updatedAt: '2023-06-20T15:27:33.077Z',
    versionNumber: 1,
    segment: {
      createdAt: '2023-06-20T15:27:33.229Z',
      updatedAt: '2023-06-20T15:27:33.229Z',
      versionNumber: 1,
      id: '4866704b-f582-4d11-846c-e6cc0ac4d6dd',
      name: '716edbbd-eecf-43b6-82a8-bd3f3b20e095 Exclusion Segment',
      description: '716edbbd-eecf-43b6-82a8-bd3f3b20e095 Exclusion Segment',
      context: 'lib-tester-ts-backend-v4',
      type: 'private',
      individualForSegment: [],
      groupForSegment: [],
      subSegments: [],
    },
  },
  factors: [
    {
      id: '03ded09c-39e6-4af2-891a-46181c0b8bb9',
      name: 'fdfasdfs',
      order: 2,
      description: '',
      levels: [
        {
          createdAt: '2023-06-20T15:27:33.077Z',
          updatedAt: '2023-06-20T15:27:33.077Z',
          versionNumber: 1,
          id: '8f891c26-7496-4674-88e1-e73e6ff625fe',
          name: 'yellow',
          description: null,
          order: null,
          payload: { type: 'string', value: '' },
        },
        {
          createdAt: '2023-06-20T15:27:33.077Z',
          updatedAt: '2023-06-20T15:27:33.077Z',
          versionNumber: 1,
          id: 'fcd21f24-5e1c-4b68-b320-a00262b1ca63',
          name: 'green',
          description: null,
          order: null,
          payload: { type: 'string', value: '' },
        },
      ],
    },
    {
      id: 'ae17c161-1a25-49b7-a836-3f1641224d29',
      name: 'asdf',
      order: 1,
      description: '',
      levels: [
        {
          createdAt: '2023-06-20T15:27:33.077Z',
          updatedAt: '2023-06-20T15:27:33.077Z',
          versionNumber: 1,
          id: '3c6cdc23-3d1f-42b0-a57b-e22315b07f70',
          name: 'purple',
          description: null,
          order: null,
          payload: { type: 'string', value: '' },
        },
        {
          createdAt: '2023-06-20T15:27:33.077Z',
          updatedAt: '2023-06-20T15:27:33.077Z',
          versionNumber: 1,
          id: 'e44c0691-6812-45ec-a2e9-e79963179c9c',
          name: 'orange',
          description: null,
          order: null,
          payload: { type: 'string', value: '' },
        },
      ],
    },
  ],
  conditionPayloads: [],
};
