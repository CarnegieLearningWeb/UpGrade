import {
  CaliperEnvelope,
  EXPERIMENT_TYPE,
  ILogRequestBody,
  MARKED_DECISION_POINT_STATUS,
  PAYLOAD_TYPE,
} from 'upgrade_types';
import ApiService from './ApiService';
import { UpGradeClientInterfaces } from './../types/Interfaces';
import { UpGradeClientRequests } from './../types/requests';

// this global is injected by webpack at build time (see ApiService.ts) and mocked in jest.config.ts for tests
declare const CLIENT_VERSION: string;

const MockDataService = {
  findExperimentAssignmentBySiteAndTarget: jest.fn(),
  rotateAssignmentList: jest.fn(),
  rotateAssignmentsByExperimentId: jest.fn(),
};

const mockHttpClient = {
  doGet: jest.fn(),
  doPost: jest.fn(),
  doPatch: jest.fn(),
};

const defaultConfig: UpGradeClientInterfaces.IConfig = {
  hostURL: 'test.com',
  userId: 'abc123',
  context: 'context',
  apiVersion: 'v6',
  clientSessionId: 'testClientSessionId',
  token: 'testToken',
  httpClient: mockHttpClient,
};

describe('ApiService', () => {
  let apiService: ApiService;

  beforeEach(() => {
    apiService = new ApiService(defaultConfig, MockDataService as any);
  });

  // these tests internally call through private methods sendRequest and createOptions...
  // the assertion will be that the request body will get mapped to the correct params
  // for the http client provided, which is itself mocked and can be spied

  describe('#init', () => {
    const expectedUrl = `${defaultConfig.hostURL}/api/${defaultConfig.apiVersion}/init`;
    const expectedOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Session-Id': 'testClientSessionId',
        URL: expectedUrl,
        'User-Id': defaultConfig.userId,
        'Client-Context': defaultConfig.context,
        'Client-Version': CLIENT_VERSION,
        Authorization: 'Bearer testToken',
      },
      withCredentials: false,
    };

    it('should call sendRequest with just id', async () => {
      const requestBody: UpGradeClientRequests.IInitRequestBody = {};

      await apiService.init();

      expect(mockHttpClient.doPost).toHaveBeenCalledWith(expectedUrl, requestBody, expectedOptions);
    });

    it('should call sendRequest with id and group', async () => {
      const mockGroup: UpGradeClientInterfaces.IExperimentUserGroup = {
        school: ['testGroupSchool'],
      };
      const requestBody: UpGradeClientRequests.IInitRequestBody = {
        group: mockGroup,
      };

      await apiService.init(mockGroup);

      expect(mockHttpClient.doPost).toHaveBeenCalledWith(expectedUrl, requestBody, expectedOptions);
    });

    it('should call sendRequest with id and workingGroup', async () => {
      const mockWorkingGroup: UpGradeClientInterfaces.IExperimentUserWorkingGroup = {
        school: 'testWorkingGroupSchool',
      };
      const requestBody: UpGradeClientRequests.IInitRequestBody = {
        workingGroup: mockWorkingGroup,
      };

      await apiService.init(undefined, mockWorkingGroup);

      expect(mockHttpClient.doPost).toHaveBeenCalledWith(expectedUrl, requestBody, expectedOptions);
    });

    it('should call sendRequest with id, group, and workingGroup', async () => {
      const mockGroup: UpGradeClientInterfaces.IExperimentUserGroup = {
        school: ['testGroupSchool'],
      };
      const mockWorkingGroup: UpGradeClientInterfaces.IExperimentUserWorkingGroup = {
        school: 'testWorkingGroupSchool',
      };
      const requestBody: UpGradeClientRequests.IInitRequestBody = {
        group: mockGroup,
        workingGroup: mockWorkingGroup,
      };

      await apiService.init(mockGroup, mockWorkingGroup);

      expect(mockHttpClient.doPost).toHaveBeenCalledWith(expectedUrl, requestBody, expectedOptions);
    });
  });

  describe('#setGroupMembership', () => {
    const expectedUrl = `${defaultConfig.hostURL}/api/${defaultConfig.apiVersion}/groupmembership`;
    const expectedOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Session-Id': 'testClientSessionId',
        URL: expectedUrl,
        'User-Id': defaultConfig.userId,
        'Client-Context': defaultConfig.context,
        'Client-Version': CLIENT_VERSION,
        Authorization: 'Bearer testToken',
      },
      withCredentials: false,
    };

    it('should call sendRequest with id and group', async () => {
      const mockGroup: UpGradeClientInterfaces.IExperimentUserGroup = {
        school: ['testGroupSchool'],
      };
      const requestBody: UpGradeClientRequests.IInitRequestBody = {
        group: mockGroup,
      };

      await apiService.setGroupMembership(mockGroup);

      expect(mockHttpClient.doPatch).toHaveBeenCalledWith(expectedUrl, requestBody, expectedOptions);
    });
  });

  describe('#setWorkingGroup', () => {
    //mimic setGroupMembership tests
    const expectedUrl = `${defaultConfig.hostURL}/api/${defaultConfig.apiVersion}/workinggroup`;
    const expectedOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Session-Id': 'testClientSessionId',
        URL: expectedUrl,
        'User-Id': defaultConfig.userId,
        'Client-Context': defaultConfig.context,
        'Client-Version': CLIENT_VERSION,
        Authorization: 'Bearer testToken',
      },
      withCredentials: false,
    };

    it('should call sendRequest with id and workingGroup', async () => {
      const mockWorkingGroup: UpGradeClientInterfaces.IExperimentUserWorkingGroup = {
        school: 'testWorkingGroupSchool',
      };
      const requestBody: UpGradeClientRequests.IInitRequestBody = {
        workingGroup: mockWorkingGroup,
      };

      await apiService.setWorkingGroup(mockWorkingGroup);

      expect(mockHttpClient.doPatch).toHaveBeenCalledWith(expectedUrl, requestBody, expectedOptions);
    });
  });

  describe('#setAltUserIds', () => {
    const expectedUrl = `${defaultConfig.hostURL}/api/${defaultConfig.apiVersion}/useraliases`;
    const expectedOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Session-Id': 'testClientSessionId',
        URL: expectedUrl,
        'User-Id': defaultConfig.userId,
        'Client-Context': defaultConfig.context,
        'Client-Version': CLIENT_VERSION,
        Authorization: 'Bearer testToken',
      },
      withCredentials: false,
    };

    it('should call sendRequest with id and altUserIds', async () => {
      const mockAliases = ['asdf', '1234'];
      const requestBody: UpGradeClientRequests.ISetAltIdsRequestBody = {
        aliases: mockAliases,
      };

      await apiService.setAltUserIds(mockAliases);

      expect(mockHttpClient.doPatch).toHaveBeenCalledWith(expectedUrl, requestBody, expectedOptions);
    });
  });

  describe('#getAllExperimentConditions', () => {
    const expectedUrl = `${defaultConfig.hostURL}/api/${defaultConfig.apiVersion}/assign`;
    const expectedOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Session-Id': 'testClientSessionId',
        URL: expectedUrl,
        'User-Id': defaultConfig.userId,
        'Client-Context': defaultConfig.context,
        'Client-Version': CLIENT_VERSION,
        Authorization: 'Bearer testToken',
      },
      withCredentials: false,
    };

    it('should call sendRequest with id and context', async () => {
      const requestBody: UpGradeClientRequests.IGetAllExperimentConditionsRequestBody = {
        context: defaultConfig.context,
      };

      await apiService.getAllExperimentConditions();

      expect(mockHttpClient.doPost).toHaveBeenCalledWith(expectedUrl, requestBody, expectedOptions);
    });
  });

  describe('#log', () => {
    const expectedUrl = `${defaultConfig.hostURL}/api/${defaultConfig.apiVersion}/log`;
    const expectedOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Session-Id': 'testClientSessionId',
        URL: expectedUrl,
        'User-Id': defaultConfig.userId,
        'Client-Context': defaultConfig.context,
        'Client-Version': CLIENT_VERSION,
        Authorization: 'Bearer testToken',
      },
      withCredentials: false,
    };

    it('should call sendRequest with userId and logDataInput value', async () => {
      const mockLogData = [
        {
          timestamp: '1234',
          metrics: {
            attributes: {
              testAttribute: 'testValue',
            },
            groupedMetrics: [
              {
                groupClass: 'workspaces',
                groupKey: 'abc',
                groupUniquifier: 'abc123',
                attributes: [] as any,
              },
            ],
          },
        },
      ];
      const mockLogDataInput: ILogRequestBody = {
        value: mockLogData,
      };

      await apiService.log(mockLogData);

      expect(mockHttpClient.doPost).toHaveBeenCalledWith(expectedUrl, mockLogDataInput, expectedOptions);
    });
  });

  describe('#markDecisionPoint', () => {
    const expectedUrl = `${defaultConfig.hostURL}/api/${defaultConfig.apiVersion}/mark`;
    const expectedOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Session-Id': 'testClientSessionId',
        URL: expectedUrl,
        'User-Id': defaultConfig.userId,
        'Client-Context': defaultConfig.context,
        'Client-Version': CLIENT_VERSION,
        Authorization: 'Bearer testToken',
      },
      withCredentials: false,
    };

    const mockAssignment = {
      site: 'testSite',
      target: 'testTarget',
      assignedCondition: [
        {
          conditionCode: 'original_condition',
          payload: { type: PAYLOAD_TYPE.STRING, value: 'val' },
          id: 'id1',
          experimentId: 'exp1',
        },
      ],
      experimentType: EXPERIMENT_TYPE.SIMPLE,
    };

    beforeEach(() => {
      MockDataService.findExperimentAssignmentBySiteAndTarget.mockReturnValue(mockAssignment);
      MockDataService.rotateAssignmentsByExperimentId.mockClear();
      mockHttpClient.doPost.mockClear();
    });

    it('should call sendRequest with site, target, condition, and status', async () => {
      const params = {
        site: 'testSite',
        target: 'testTarget',
        condition: 'variant_x',
        status: MARKED_DECISION_POINT_STATUS.CONDITION_APPLIED,
      };
      const expectedRequestBody: UpGradeClientRequests.IMarkDecisionPointRequestBody = {
        context: defaultConfig.context,
        status: params.status,
        data: {
          ...mockAssignment,
          assignedCondition: { ...mockAssignment.assignedCondition[0], conditionCode: params.condition },
        },
      };

      await apiService.markDecisionPoint(params);

      expect(mockHttpClient.doPost).toHaveBeenCalledWith(expectedUrl, expectedRequestBody, expectedOptions);
    });

    it('should include uniquifier in request body when provided', async () => {
      const params = {
        site: 'testSite',
        target: 'testTarget',
        condition: 'variant_x',
        status: MARKED_DECISION_POINT_STATUS.CONDITION_APPLIED,
        uniquifier: 'unique123',
      };
      const expectedRequestBody: UpGradeClientRequests.IMarkDecisionPointRequestBody = {
        context: defaultConfig.context,
        status: params.status,
        data: {
          ...mockAssignment,
          assignedCondition: { ...mockAssignment.assignedCondition[0], conditionCode: params.condition },
        },
        uniquifier: 'unique123',
      };

      await apiService.markDecisionPoint(params);

      expect(mockHttpClient.doPost).toHaveBeenCalledWith(expectedUrl, expectedRequestBody, expectedOptions);
    });

    it('should include clientError in request body when provided', async () => {
      const params = {
        site: 'testSite',
        target: 'testTarget',
        condition: null,
        status: MARKED_DECISION_POINT_STATUS.CONDITION_FAILED_TO_APPLY,
        clientError: 'something went wrong',
      };
      const expectedRequestBody: UpGradeClientRequests.IMarkDecisionPointRequestBody = {
        context: defaultConfig.context,
        status: params.status,
        data: {
          ...mockAssignment,
          assignedCondition: { ...mockAssignment.assignedCondition[0], conditionCode: params.condition },
        },
        clientError: 'something went wrong',
      };

      await apiService.markDecisionPoint(params);

      expect(mockHttpClient.doPost).toHaveBeenCalledWith(expectedUrl, expectedRequestBody, expectedOptions);
    });

    it('should rotate cached assignments for the returned experiment id after marking', async () => {
      const params = {
        site: 'testSite',
        target: 'testTarget',
        condition: 'variant_x',
        status: MARKED_DECISION_POINT_STATUS.CONDITION_APPLIED,
      };

      mockHttpClient.doPost.mockResolvedValue({
        id: 'mark123',
        site: 'testSite',
        target: 'testTarget',
        userId: defaultConfig.userId,
        experimentId: 'exp1',
      });

      await apiService.markDecisionPoint(params);

      expect(MockDataService.rotateAssignmentsByExperimentId).toHaveBeenCalledWith('exp1');
    });

    it('should not rotate cached assignments when response has no experiment id', async () => {
      const params = {
        site: 'testSite',
        target: 'testTarget',
        condition: 'variant_x',
        status: MARKED_DECISION_POINT_STATUS.CONDITION_APPLIED,
      };

      mockHttpClient.doPost.mockResolvedValue({
        id: 'mark123',
        site: 'testSite',
        target: 'testTarget',
        userId: defaultConfig.userId,
      });

      await apiService.markDecisionPoint(params);

      expect(MockDataService.rotateAssignmentsByExperimentId).not.toHaveBeenCalled();
    });
  });

  describe('#getAllFeatureFlags', () => {
    const expectedUrl = `${defaultConfig.hostURL}/api/${defaultConfig.apiVersion}/featureflag`;
    const expectedOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Session-Id': 'testClientSessionId',
        URL: expectedUrl,
        'User-Id': defaultConfig.userId,
        'Client-Context': defaultConfig.context,
        'Client-Version': CLIENT_VERSION,
        Authorization: 'Bearer testToken',
      },
      withCredentials: false,
    };

    it('sends just context with no arguments', async () => {
      mockHttpClient.doPost.mockResolvedValue(['flag1']);

      const result = await apiService.getAllFeatureFlags();

      expect(mockHttpClient.doPost).toHaveBeenCalledWith(
        expectedUrl,
        { context: defaultConfig.context },
        expectedOptions
      );
      expect(result).toEqual(['flag1']);
    });

    it('sends useSingleGroupSet as given', async () => {
      const useSingleGroupSet = { groups: { schoolId: ['school-a'] }, includeStoredUserGroups: false };
      mockHttpClient.doPost.mockResolvedValue(['flag1']);

      const result = await apiService.getAllFeatureFlags({ useSingleGroupSet });

      expect(mockHttpClient.doPost).toHaveBeenCalledWith(
        expectedUrl,
        { context: defaultConfig.context, useSingleGroupSet },
        expectedOptions
      );
      expect(result).toEqual(['flag1']);
    });

    it('sends useMultipleGroupSets as given and returns the object response', async () => {
      const useMultipleGroupSets = {
        mainGroupset: { groups: { schoolId: ['school-a', 'school-b'] } },
        subGroupsets: [
          { groupsetId: 'school-a', groups: { schoolId: ['school-a'] } },
          { groupsetId: 'school-b', groups: { schoolId: ['school-b'] } },
        ],
      };
      const mockResponse = { mainGroupset: ['flag1'], subGroupsets: { 'school-a': ['flag1'], 'school-b': [] } };
      mockHttpClient.doPost.mockResolvedValue(mockResponse);

      const result = await apiService.getAllFeatureFlags({ useMultipleGroupSets });

      expect(mockHttpClient.doPost).toHaveBeenCalledWith(
        expectedUrl,
        { context: defaultConfig.context, useMultipleGroupSets },
        expectedOptions
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('#markDecisionPoint', () => {
    const expectedUrl = `${defaultConfig.hostURL}/api/${defaultConfig.apiVersion}/mark`;
    const expectedOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Session-Id': 'testClientSessionId',
        URL: expectedUrl,
        'User-Id': defaultConfig.userId,
        Authorization: 'Bearer testToken',
      },
      withCredentials: false,
    };

    const mockAssignment = {
      site: 'testSite',
      target: 'testTarget',
      assignedCondition: [{ conditionCode: 'variant_x', experimentId: 'exp123' }],
      assignedFactor: null,
      experimentType: 'Simple',
    };

    beforeEach(() => {
      MockDataService.findExperimentAssignmentBySiteAndTarget.mockReturnValue(mockAssignment);
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      MockDataService.rotateAssignmentList.mockImplementation(() => {});
    });

    it('should include context from config in the request body', async () => {
      await apiService.markDecisionPoint({
        site: 'testSite',
        target: 'testTarget',
        condition: 'variant_x',
        status: 'condition applied' as any,
      });

      const postedBody = mockHttpClient.doPost.mock.calls[mockHttpClient.doPost.mock.calls.length - 1][1];
      expect(postedBody.context).toEqual(defaultConfig.context);
    });

    it('should include status and data in the request body', async () => {
      await apiService.markDecisionPoint({
        site: 'testSite',
        target: 'testTarget',
        condition: 'variant_x',
        status: 'condition applied' as any,
      });

      const postedBody = mockHttpClient.doPost.mock.calls[mockHttpClient.doPost.mock.calls.length - 1][1];
      expect(postedBody.status).toEqual('condition applied');
      expect(postedBody.data.site).toEqual('testSite');
      expect(postedBody.data.target).toEqual('testTarget');
    });

    it('should include uniquifier when provided', async () => {
      await apiService.markDecisionPoint({
        site: 'testSite',
        target: 'testTarget',
        condition: 'variant_x',
        status: 'condition applied' as any,
        uniquifier: 'unique123',
      });

      const postedBody = mockHttpClient.doPost.mock.calls[mockHttpClient.doPost.mock.calls.length - 1][1];
      expect(postedBody.uniquifier).toEqual('unique123');
    });

    it('should include clientError when provided', async () => {
      await apiService.markDecisionPoint({
        site: 'testSite',
        target: 'testTarget',
        condition: 'variant_x',
        status: 'condition not applied' as any,
        clientError: 'variant not recognized',
      });

      const postedBody = mockHttpClient.doPost.mock.calls[mockHttpClient.doPost.mock.calls.length - 1][1];
      expect(postedBody.clientError).toEqual('variant not recognized');
    });
  });

  describe('#logCaliper', () => {
    const expectedUrl = `${defaultConfig.hostURL}/api/${defaultConfig.apiVersion}/log/caliper`;
    const expectedOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Session-Id': 'testClientSessionId',
        URL: expectedUrl,
        'User-Id': defaultConfig.userId,
        'Client-Context': defaultConfig.context,
        'Client-Version': CLIENT_VERSION,
        Authorization: 'Bearer testToken',
      },
      withCredentials: false,
    };

    it('should call sendRequest with caliper envelope value', async () => {
      const mockLogData: CaliperEnvelope = {
        sensor: 'test',
        sendTime: '12345678',
        dataVersion: '1',
        data: [],
      };

      await apiService.logCaliper(mockLogData);

      expect(mockHttpClient.doPost).toHaveBeenCalledWith(expectedUrl, mockLogData, expectedOptions);
    });
  });
});
