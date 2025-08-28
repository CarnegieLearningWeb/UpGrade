import { DataService } from './../DataService/DataService';
import ApiService from './../ApiService/ApiService';
import UpgradeClient from './UpgradeClient';
import { EXPERIMENT_TYPE } from '../../../../types/src';

const mockHttpClient = {
  doGet: jest.fn(),
  doPost: jest.fn(),
  doPatch: jest.fn(),
};

describe('UpgradeClient', () => {
  let upgradeClient: UpgradeClient;
  beforeEach(() => {
    upgradeClient = new UpgradeClient('1234', 'test.com', 'testContext', { httpClient: mockHttpClient });
  });

  describe('#init', () => {
    it('should call apiService "init" with no params sent if group and workingGroup are not given', async () => {
      ApiService.prototype.init = jest.fn();

      await upgradeClient.init();

      expect(ApiService.prototype.init).toHaveBeenCalledWith(undefined, undefined);
    });

    it('should call apiService "init" with just group', async () => {
      const mockGroup: Record<string, Array<string>> = {
        school: ['1234'],
      };
      ApiService.prototype.init = jest.fn();

      await upgradeClient.init(mockGroup);

      expect(ApiService.prototype.init).toHaveBeenCalledWith(mockGroup, undefined);
    });

    it('should call apiService "init" with just workingGroup', () => {
      const mockWorkingGroup: Record<string, string> = {
        school: '1234',
      };
      ApiService.prototype.init = jest.fn();

      upgradeClient.init(undefined, mockWorkingGroup);

      expect(ApiService.prototype.init).toHaveBeenCalledWith(undefined, mockWorkingGroup);
    });

    it('should call apiService "init" with group and workingGroup', () => {
      const mockGroup: Record<string, Array<string>> = {
        school: ['1234'],
      };
      const mockWorkingGroup: Record<string, string> = {
        school: '1234',
      };
      ApiService.prototype.init = jest.fn();

      upgradeClient.init(mockGroup, mockWorkingGroup);

      expect(ApiService.prototype.init).toHaveBeenCalledWith(mockGroup, mockWorkingGroup);
    });
  });

  describe('#setGroupMembership', () => {
    it('should call apiService "setGroupMembership" with just group', async () => {
      const mockGroup: Record<string, Array<string>> = {
        school: ['1234'],
      };
      ApiService.prototype.setGroupMembership = jest.fn(() => {
        return Promise.resolve({ id: 'test', group: mockGroup });
      });
      DataService.prototype.setGroup = jest.fn();
      DataService.prototype.getWorkingGroup = jest.fn(() => {
        return {
          school: '1234',
        };
      });

      const response = await upgradeClient.setGroupMembership(mockGroup);

      expect(ApiService.prototype.setGroupMembership).toHaveBeenCalledWith(mockGroup);
      expect(DataService.prototype.setGroup).toHaveBeenCalledWith(mockGroup);
      expect(DataService.prototype.getWorkingGroup).toHaveBeenCalled();
      expect(response).toEqual({
        id: 'test',
        group: mockGroup,
        workingGroup: {
          school: '1234',
        },
      });
    });
  });

  describe('#setWorkingGroupMembership', () => {
    it('should call apiService "setWorkingGroupMembership" with just workingGroup', async () => {
      const mockWorkingGroup: Record<string, string> = {
        school: '1234',
      };
      ApiService.prototype.setWorkingGroup = jest.fn(() => {
        return Promise.resolve({ id: 'test', workingGroup: mockWorkingGroup });
      });
      DataService.prototype.setWorkingGroup = jest.fn();
      DataService.prototype.getGroup = jest.fn(() => {
        return {
          school: ['1234'],
        };
      });

      const response = await upgradeClient.setWorkingGroup(mockWorkingGroup);

      expect(ApiService.prototype.setWorkingGroup).toHaveBeenCalledWith(mockWorkingGroup);
      expect(DataService.prototype.setWorkingGroup).toHaveBeenCalledWith(mockWorkingGroup);
      expect(DataService.prototype.getGroup).toHaveBeenCalled();
      expect(response).toEqual({
        id: 'test',
        group: {
          school: ['1234'],
        },
        workingGroup: mockWorkingGroup,
      });
    });
  });

  describe('#setFeatureFlagUserGroupsForSession', () => {
    it('should call apiService "setFeatureFlagUserGroupsForSession" with valid feature flag options', () => {
      const mockFeatureFlagOptions = {
        groupsForSession: {
          school: ['testSchool1', 'testSchool2'],
          class: ['testClass1'],
        },
        includeStoredUserGroups: true,
      };
      ApiService.prototype.setFeatureFlagUserGroupsForSession = jest.fn();

      upgradeClient.setFeatureFlagUserGroupsForSession(mockFeatureFlagOptions);

      expect(ApiService.prototype.setFeatureFlagUserGroupsForSession).toHaveBeenCalledWith(
        mockFeatureFlagOptions.groupsForSession,
        mockFeatureFlagOptions.includeStoredUserGroups
      );
    });

    it('should call apiService "setFeatureFlagUserGroupsForSession" with null options', () => {
      ApiService.prototype.setFeatureFlagUserGroupsForSession = jest.fn();

      upgradeClient.setFeatureFlagUserGroupsForSession(null);

      expect(ApiService.prototype.setFeatureFlagUserGroupsForSession).toHaveBeenCalledWith(undefined, undefined);
    });

    it('should call apiService "setFeatureFlagUserGroupsForSession" with undefined options', () => {
      ApiService.prototype.setFeatureFlagUserGroupsForSession = jest.fn();

      upgradeClient.setFeatureFlagUserGroupsForSession(undefined);

      expect(ApiService.prototype.setFeatureFlagUserGroupsForSession).toHaveBeenCalledWith(undefined, undefined);
    });
  });

  describe('#getAllExperimentConditions', () => {
    it('should call apiService "getAllExperimentConditions" with no options', async () => {
      ApiService.prototype.getAllExperimentConditions = jest.fn();
      DataService.prototype.getExperimentAssignmentData = jest.fn((): any => {
        return null;
      });
      await upgradeClient.getAllExperimentConditions();
      expect(ApiService.prototype.getAllExperimentConditions).toHaveBeenCalled();
    });
    it('should not call apiService "getAllExperimentConditions" when there is cached data', async () => {
      ApiService.prototype.getAllExperimentConditions = jest.fn();
      DataService.prototype.getExperimentAssignmentData = jest.fn((): any => {
        return ['foo'];
      });
      upgradeClient = new UpgradeClient('1234', 'test.com', 'testContext', { httpClient: mockHttpClient });
      await upgradeClient.getAllExperimentConditions();
      expect(ApiService.prototype.getAllExperimentConditions).not.toHaveBeenCalled();
    });

    it('should call apiService "getAllExperimentConditions" when there is cached data if ignoreCache is specified', async () => {
      ApiService.prototype.getAllExperimentConditions = jest.fn();
      DataService.prototype.getExperimentAssignmentData = jest.fn((): any => {
        return ['foo'];
      });
      upgradeClient = new UpgradeClient('1234', 'test.com', 'testContext', { httpClient: mockHttpClient });
      await upgradeClient.getAllExperimentConditions({ ignoreCache: true });
      expect(ApiService.prototype.getAllExperimentConditions).toHaveBeenCalled();
    });
  });
  describe('#getDecisionPointAssignment', () => {
    it('should call apiService "getAllExperimentConditions" with no options', async () => {
      ApiService.prototype.getAllExperimentConditions = jest.fn();
      DataService.prototype.getExperimentAssignmentData = jest.fn((): any => {
        return null;
      });
      await upgradeClient.getDecisionPointAssignment('testSite');
      expect(ApiService.prototype.getAllExperimentConditions).toHaveBeenCalled();
    });
    it('should not call apiService "getAllExperimentConditions" when there is cached data', async () => {
      ApiService.prototype.getAllExperimentConditions = jest.fn();
      DataService.prototype.getExperimentAssignmentData = jest.fn((): any => {
        return ['foo'];
      });
      DataService.prototype.findExperimentAssignmentBySiteAndTarget = jest.fn((site, target) => {
        return {
          site: site,
          target: target,
          assignedCondition: [],
          experimentType: EXPERIMENT_TYPE.SIMPLE,
        };
      });
      upgradeClient = new UpgradeClient('1234', 'test.com', 'testContext', { httpClient: mockHttpClient });
      await upgradeClient.getDecisionPointAssignment('testSite');
      expect(ApiService.prototype.getAllExperimentConditions).not.toHaveBeenCalled();
    });
  });

  describe('#getAllFeatureFlags', () => {
    it('should call apiService "getAllFeatureFlags" with no options', async () => {
      ApiService.prototype.getAllFeatureFlags = jest.fn();
      DataService.prototype.getFeatureFlags = jest.fn((): any => {
        return null;
      });
      await upgradeClient.getAllFeatureFlags();
      expect(ApiService.prototype.getAllFeatureFlags).toHaveBeenCalled();
    });
    it('should not call apiService "getAllFeatureFlags" when there is cached data', async () => {
      ApiService.prototype.getAllFeatureFlags = jest.fn();
      DataService.prototype.getFeatureFlags = jest.fn((): any => {
        return ['foo'];
      });
      upgradeClient = new UpgradeClient('1234', 'test.com', 'testContext', { httpClient: mockHttpClient });
      await upgradeClient.getAllFeatureFlags();
      expect(ApiService.prototype.getAllFeatureFlags).not.toHaveBeenCalled();
    });

    it('should call apiService "getAllFeatureFlags" when there is cached data if ignoreCache is specified', async () => {
      ApiService.prototype.getAllFeatureFlags = jest.fn();
      DataService.prototype.getFeatureFlags = jest.fn((): any => {
        return ['foo'];
      });
      upgradeClient = new UpgradeClient('1234', 'test.com', 'testContext', { httpClient: mockHttpClient });
      await upgradeClient.getAllFeatureFlags({ ignoreCache: true });
      expect(ApiService.prototype.getAllFeatureFlags).toHaveBeenCalled();
    });
  });
  describe('#hasFeatureFlag', () => {
    it('should call apiService "getAllFeatureFlags" with no options', async () => {
      ApiService.prototype.getAllFeatureFlags = jest.fn();
      DataService.prototype.getFeatureFlags = jest.fn((): any => {
        return null;
      });
      await upgradeClient.hasFeatureFlag('testFlag');
      expect(ApiService.prototype.getAllFeatureFlags).toHaveBeenCalled();
    });
    it('should not call apiService "getAllFeatureFlags" when there is cached data', async () => {
      ApiService.prototype.getAllFeatureFlags = jest.fn();
      DataService.prototype.getFeatureFlags = jest.fn((): any => {
        return ['foo'];
      });
      upgradeClient = new UpgradeClient('1234', 'test.com', 'testContext', { httpClient: mockHttpClient });
      await upgradeClient.hasFeatureFlag('testFlag');
      expect(ApiService.prototype.getAllFeatureFlags).not.toHaveBeenCalled();
    });
  });

  it('should throw error when groupsForSession is missing', () => {
    const invalidOptions = {
      includeStoredUserGroups: true,
    } as any;

    expect(() => {
      upgradeClient.setFeatureFlagUserGroupsForSession(invalidOptions);
    }).toThrow();
  });

  it('should throw error when includeStoredUserGroups is missing', () => {
    const invalidOptions = {
      groupsForSession: {
        school: ['testSchool1'],
      },
    } as any;

    expect(() => {
      upgradeClient.setFeatureFlagUserGroupsForSession(invalidOptions);
    }).toThrow();
  });

  it('should throw error when both properties are missing', () => {
    const invalidOptions = {} as any;

    expect(() => {
      upgradeClient.setFeatureFlagUserGroupsForSession(invalidOptions);
    }).toThrow();
  });

  it('should throw error with proper message format', () => {
    const invalidOptions = {
      groupsForSession: {
        school: ['testSchool1'],
      },
    } as any;

    expect(() => {
      upgradeClient.setFeatureFlagUserGroupsForSession(invalidOptions);
    }).toThrow(
      /featureFlagUserGroupsForSession must contain both groupsForSession and includeStoredUserGroups properties/
    );
  });
});
