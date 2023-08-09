import { CaliperEnvelope } from 'upgrade_types';
import ApiService from './ApiService';
import { UpGradeClientInterfaces } from './../types/Interfaces';
import { UpGradeClientRequests } from './../types/requests';

const MockDataService = {
  findExperimentAssignmentBySiteAndTarget: jest.fn(),
  rotateAssignmentList: jest.fn(),
};

const mockHttpClient = {
  get: jest.fn(),
  post: jest.fn(),
  patch: jest.fn(),
};

const defaultConfig: UpGradeClientInterfaces.IConfig = {
  hostURL: 'test.com',
  userId: 'abc123',
  context: 'context',
  apiVersion: 'v5',
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
    const expectedHeaders = {
      'Client-source': 'browser',
      'Content-Type': 'application/json',
      'Session-Id': 'testClientSessionId',
      URL: expectedUrl,
      Authorization: 'Bearer testToken',
    };

    it('should call sendRequest with just id', async () => {
      const requestBody: UpGradeClientInterfaces.IExperimentUser = {
        id: defaultConfig.userId,
      };

      await apiService.init();

      expect(mockHttpClient.post).toHaveBeenCalledWith(expectedUrl, requestBody, {
        headers: expectedHeaders,
      });
    });

    it('should call sendRequest with id and group', async () => {
      const mockGroup: UpGradeClientInterfaces.IExperimentUserGroup = {
        school: ['testGroupSchool'],
      };
      const requestBody: UpGradeClientInterfaces.IExperimentUser = {
        id: defaultConfig.userId,
        group: mockGroup,
      };

      await apiService.init(mockGroup);

      expect(mockHttpClient.post).toHaveBeenCalledWith(expectedUrl, requestBody, {
        headers: expectedHeaders,
      });
    });

    it('should call sendRequest with id and workingGroup', async () => {
      const mockWorkingGroup: UpGradeClientInterfaces.IExperimentUserWorkingGroup = {
        school: 'testWorkingGroupSchool',
      };
      const requestBody: UpGradeClientInterfaces.IExperimentUser = {
        id: defaultConfig.userId,
        workingGroup: mockWorkingGroup,
      };

      await apiService.init(undefined, mockWorkingGroup);

      expect(mockHttpClient.post).toHaveBeenCalledWith(expectedUrl, requestBody, {
        headers: expectedHeaders,
      });
    });

    it('should call sendRequest with id, group, and workingGroup', async () => {
      const mockGroup: UpGradeClientInterfaces.IExperimentUserGroup = {
        school: ['testGroupSchool'],
      };
      const mockWorkingGroup: UpGradeClientInterfaces.IExperimentUserWorkingGroup = {
        school: 'testWorkingGroupSchool',
      };
      const requestBody: UpGradeClientInterfaces.IExperimentUser = {
        id: defaultConfig.userId,
        group: mockGroup,
        workingGroup: mockWorkingGroup,
      };

      await apiService.init(mockGroup, mockWorkingGroup);

      expect(mockHttpClient.post).toHaveBeenCalledWith(expectedUrl, requestBody, {
        headers: expectedHeaders,
      });
    });
  });

  describe('#setGroupMembership', () => {
    const expectedUrl = `${defaultConfig.hostURL}/api/${defaultConfig.apiVersion}/groupmembership`;
    const expectedHeaders = {
      'Client-source': 'browser',
      'Content-Type': 'application/json',
      'Session-Id': 'testClientSessionId',
      URL: expectedUrl,
      Authorization: 'Bearer testToken',
    };

    it('should call sendRequest with id and group', async () => {
      const mockGroup: UpGradeClientInterfaces.IExperimentUserGroup = {
        school: ['testGroupSchool'],
      };
      const requestBody: UpGradeClientInterfaces.IExperimentUser = {
        id: defaultConfig.userId,
        group: mockGroup,
      };

      await apiService.setGroupMembership(mockGroup);

      expect(mockHttpClient.patch).toHaveBeenCalledWith(expectedUrl, requestBody, {
        headers: expectedHeaders,
      });
    });
  });

  describe('#setWorkingGroup', () => {
    //mimic setGroupMembership tests
    const expectedUrl = `${defaultConfig.hostURL}/api/${defaultConfig.apiVersion}/workinggroup`;
    const expectedHeaders = {
      'Client-source': 'browser',
      'Content-Type': 'application/json',
      'Session-Id': 'testClientSessionId',
      URL: expectedUrl,
      Authorization: 'Bearer testToken',
    };

    it('should call sendRequest with id and workingGroup', async () => {
      const mockWorkingGroup: UpGradeClientInterfaces.IExperimentUserWorkingGroup = {
        school: 'testWorkingGroupSchool',
      };
      const requestBody: UpGradeClientInterfaces.IExperimentUser = {
        id: defaultConfig.userId,
        workingGroup: mockWorkingGroup,
      };

      await apiService.setWorkingGroup(mockWorkingGroup);

      expect(mockHttpClient.patch).toHaveBeenCalledWith(expectedUrl, requestBody, {
        headers: expectedHeaders,
      });
    });
  });

  describe('#setAltUserIds', () => {
    const expectedUrl = `${defaultConfig.hostURL}/api/${defaultConfig.apiVersion}/useraliases`;
    const expectedHeaders = {
      'Client-source': 'browser',
      'Content-Type': 'application/json',
      'Session-Id': 'testClientSessionId',
      URL: expectedUrl,
      Authorization: 'Bearer testToken',
    };

    it('should call sendRequest with id and altUserIds', async () => {
      const mockAliases = ['asdf', '1234'];
      const requestBody: UpGradeClientRequests.ISetAltIdsRequestBody = {
        userId: defaultConfig.userId,
        aliases: mockAliases,
      };

      await apiService.setAltUserIds(mockAliases);

      expect(mockHttpClient.patch).toHaveBeenCalledWith(expectedUrl, requestBody, {
        headers: expectedHeaders,
      });
    });
  });

  describe('#getAllExperimentConditions', () => {
    const expectedUrl = `${defaultConfig.hostURL}/api/${defaultConfig.apiVersion}/assign`;
    const expectedHeaders = {
      'Client-source': 'browser',
      'Content-Type': 'application/json',
      'Session-Id': 'testClientSessionId',
      URL: expectedUrl,
      Authorization: 'Bearer testToken',
    };

    it('should call sendRequest with id and context', async () => {
      const requestBody: UpGradeClientRequests.IGetAllExperimentConditionsRequestBody = {
        userId: defaultConfig.userId,
        context: defaultConfig.context,
      };

      await apiService.getAllExperimentConditions();

      expect(mockHttpClient.post).toHaveBeenCalledWith(expectedUrl, requestBody, {
        headers: expectedHeaders,
      });
    });
  });

  describe('#log', () => {
    const expectedUrl = `${defaultConfig.hostURL}/api/${defaultConfig.apiVersion}/log`;
    const expectedHeaders = {
      'Client-source': 'browser',
      'Content-Type': 'application/json',
      'Session-Id': 'testClientSessionId',
      URL: expectedUrl,
      Authorization: 'Bearer testToken',
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
      const mockLogDataInput: UpGradeClientRequests.ILogRequestBody = {
        userId: defaultConfig.userId,
        value: mockLogData,
      };

      await apiService.log(mockLogData);

      expect(mockHttpClient.post).toHaveBeenCalledWith(expectedUrl, mockLogDataInput, {
        headers: expectedHeaders,
      });
    });
  });

  describe('#logCaliper', () => {
    const expectedUrl = `${defaultConfig.hostURL}/api/${defaultConfig.apiVersion}/log/caliper`;
    const expectedHeaders = {
      'Client-source': 'browser',
      'Content-Type': 'application/json',
      'Session-Id': 'testClientSessionId',
      URL: expectedUrl,
      Authorization: 'Bearer testToken',
    };

    it('should call sendRequest with caliper envelope value', async () => {
      const mockLogData: CaliperEnvelope = {
        sensor: 'test',
        sendTime: '12345678',
        dataVersion: '1',
        data: [],
      };

      await apiService.logCaliper(mockLogData);

      expect(mockHttpClient.post).toHaveBeenCalledWith(expectedUrl, mockLogData, {
        headers: expectedHeaders,
      });
    });
  });
});
