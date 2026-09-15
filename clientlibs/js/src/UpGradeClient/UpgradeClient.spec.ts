import { DataService } from './../DataService/DataService';
import ApiService from './../ApiService/ApiService';
import UpgradeClient from './UpgradeClient';
import { EXPERIMENT_TYPE, MARKED_DECISION_POINT_STATUS } from 'upgrade_types';

const mockHttpClient = {
  doGet: jest.fn(),
  doPost: jest.fn(),
  doPatch: jest.fn(),
};

// jest.spyOn on a method that's already a mock (from a prior test) just returns that same mock,
// call-history and all, rather than resetting it — so each test gets a genuinely fresh jest.fn().
function mockApiServiceGetAllFeatureFlags(): jest.Mock {
  const mockFn = jest.fn();
  ApiService.prototype.getAllFeatureFlags = mockFn;
  return mockFn;
}

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

  describe('#markDecisionPoint', () => {
    beforeEach(() => {
      ApiService.prototype.markDecisionPoint = jest.fn().mockResolvedValue({});
      DataService.prototype.getExperimentAssignmentData = jest.fn((): any => ['foo']);
    });

    it('should call apiService markDecisionPoint using options object form', async () => {
      await upgradeClient.markDecisionPoint({
        site: 'testSite',
        target: 'testTarget',
        condition: 'variant_x',
        status: MARKED_DECISION_POINT_STATUS.CONDITION_APPLIED,
      });

      expect(ApiService.prototype.markDecisionPoint).toHaveBeenCalledWith({
        site: 'testSite',
        target: 'testTarget',
        condition: 'variant_x',
        status: MARKED_DECISION_POINT_STATUS.CONDITION_APPLIED,
        uniquifier: undefined,
        clientError: undefined,
      });
    });

    it('should normalize omitted target to empty string with options object', async () => {
      await upgradeClient.markDecisionPoint({
        site: 'testSite',
        status: MARKED_DECISION_POINT_STATUS.NO_CONDITION_ASSIGNED,
      });

      expect(ApiService.prototype.markDecisionPoint).toHaveBeenCalledWith({
        site: 'testSite',
        target: '',
        condition: null,
        status: MARKED_DECISION_POINT_STATUS.NO_CONDITION_ASSIGNED,
        uniquifier: undefined,
        clientError: undefined,
      });
    });

    it('should call apiService markDecisionPoint using positional arguments', async () => {
      await upgradeClient.markDecisionPoint(
        'testSite',
        'testTarget',
        'variant_x',
        MARKED_DECISION_POINT_STATUS.CONDITION_APPLIED
      );

      expect(ApiService.prototype.markDecisionPoint).toHaveBeenCalledWith({
        site: 'testSite',
        target: 'testTarget',
        condition: 'variant_x',
        status: MARKED_DECISION_POINT_STATUS.CONDITION_APPLIED,
        uniquifier: undefined,
        clientError: undefined,
      });
    });
  });

  describe('feature flag group options', () => {
    describe('constructor', () => {
      it('accepts useSingleGroupSet via featureFlagGroupOptions', async () => {
        mockApiServiceGetAllFeatureFlags().mockResolvedValue(['flag1']);

        const client = new UpgradeClient('1234', 'test.com', 'testContext', {
          httpClient: mockHttpClient,
          featureFlagGroupOptions: { useSingleGroupSet: { groups: { classId: ['classA'] } } },
        });

        expect(await client.getAllFeatureFlags()).toEqual(['flag1']);
      });

      it('accepts useMultipleGroupSets via featureFlagGroupOptions', async () => {
        mockApiServiceGetAllFeatureFlags().mockResolvedValue({
          mainGroupset: ['flag1'],
          subGroupsets: { sectionA: ['flag1'] },
        });

        const client = new UpgradeClient('1234', 'test.com', 'testContext', {
          httpClient: mockHttpClient,
          featureFlagGroupOptions: {
            useMultipleGroupSets: {
              mainGroupset: { groups: { schoolId: ['a'] } },
              subGroupsets: [{ groupsetId: 'sectionA', groups: { schoolId: ['a'] } }],
            },
          },
        });

        expect(await client.getAllFeatureFlags()).toEqual({
          mainGroupset: ['flag1'],
          subGroupsets: { sectionA: ['flag1'] },
        });
      });

      it('still accepts the deprecated featureFlagUserGroupsForSession constructor option', async () => {
        mockApiServiceGetAllFeatureFlags().mockResolvedValue(['flag1']);

        const client = new UpgradeClient('1234', 'test.com', 'testContext', {
          httpClient: mockHttpClient,
          featureFlagUserGroupsForSession: {
            groupsForSession: { classId: ['classA'] },
            includeStoredUserGroups: false,
          },
        });

        expect(await client.getAllFeatureFlags()).toEqual(['flag1']);
      });

      it('throws when the constructor option provides both useSingleGroupSet and useMultipleGroupSets', () => {
        expect(() => {
          // eslint-disable-next-line no-new
          new UpgradeClient('1234', 'test.com', 'testContext', {
            httpClient: mockHttpClient,
            featureFlagGroupOptions: {
              useSingleGroupSet: { groups: { classId: ['classA'] } },
              useMultipleGroupSets: { subGroupsets: [{ groupsetId: 'a', groups: { classId: ['classA'] } }] },
            },
          });
        }).toThrow(/must provide either useSingleGroupSet or useMultipleGroupSets, not both/);
      });
    });

    describe('#setFeatureFlagGroupOptions', () => {
      it('accepts useSingleGroupSet, includeStoredUserGroups optional', async () => {
        mockApiServiceGetAllFeatureFlags().mockResolvedValue(['flag1']);

        upgradeClient.setFeatureFlagGroupOptions({ useSingleGroupSet: { groups: { classId: ['classA'] } } });
        const result = await upgradeClient.getAllFeatureFlags();

        expect(ApiService.prototype.getAllFeatureFlags).toHaveBeenCalledWith({
          useSingleGroupSet: { groups: { classId: ['classA'] }, includeStoredUserGroups: undefined },
        });
        expect(result).toEqual(['flag1']);
      });

      it('accepts useMultipleGroupSets with no mainGroupset', async () => {
        mockApiServiceGetAllFeatureFlags().mockResolvedValue({
          mainGroupset: undefined,
          subGroupsets: { sectionA: ['flag1'] },
        });

        upgradeClient.setFeatureFlagGroupOptions({
          useMultipleGroupSets: { subGroupsets: [{ groupsetId: 'sectionA', groups: { schoolId: ['a'] } }] },
        });
        const result = await upgradeClient.getAllFeatureFlags();

        expect(result).toEqual({ subGroupsets: { sectionA: ['flag1'] } });
      });

      it('resetting to null restores standard stored-user lookup', async () => {
        mockApiServiceGetAllFeatureFlags().mockResolvedValue(['flag1']);

        upgradeClient.setFeatureFlagGroupOptions({ useSingleGroupSet: { groups: { classId: ['classA'] } } });
        upgradeClient.setFeatureFlagGroupOptions(null);
        await upgradeClient.getAllFeatureFlags();

        expect(ApiService.prototype.getAllFeatureFlags).toHaveBeenCalledWith({});
      });

      it('reconfiguring with different groups forces a refetch (cache invalidated on change)', async () => {
        const getAllFeatureFlags = mockApiServiceGetAllFeatureFlags().mockResolvedValueOnce(['classAFlag']);

        upgradeClient.setFeatureFlagGroupOptions({ useSingleGroupSet: { groups: { classId: ['classA'] } } });
        expect(await upgradeClient.getAllFeatureFlags()).toEqual(['classAFlag']);
        expect(await upgradeClient.getAllFeatureFlags()).toEqual(['classAFlag']);
        expect(getAllFeatureFlags).toHaveBeenCalledTimes(1);

        getAllFeatureFlags.mockResolvedValueOnce(['classBFlag']);
        upgradeClient.setFeatureFlagGroupOptions({ useSingleGroupSet: { groups: { classId: ['classB'] } } });

        expect(await upgradeClient.getAllFeatureFlags()).toEqual(['classBFlag']);
        expect(getAllFeatureFlags).toHaveBeenCalledTimes(2);
        expect(await upgradeClient.getAllFeatureFlags()).toEqual(['classBFlag']);
        expect(getAllFeatureFlags).toHaveBeenCalledTimes(2);
      });

      it('throws when both useSingleGroupSet and useMultipleGroupSets are provided', () => {
        expect(() => {
          upgradeClient.setFeatureFlagGroupOptions({
            useSingleGroupSet: { groups: { classId: ['classA'] } },
            useMultipleGroupSets: { subGroupsets: [{ groupsetId: 'a', groups: { classId: ['classA'] } }] },
          });
        }).toThrow(/must provide either useSingleGroupSet or useMultipleGroupSets, not both/);
      });

      it('throws when useMultipleGroupSets.subGroupsets is empty', () => {
        expect(() => {
          upgradeClient.setFeatureFlagGroupOptions({ useMultipleGroupSets: { subGroupsets: [] } });
        }).toThrow(/subGroupsets must contain at least one entry/);
      });

      it('throws when a subGroupsets entry is missing groupsetId', () => {
        expect(() => {
          upgradeClient.setFeatureFlagGroupOptions({
            useMultipleGroupSets: { subGroupsets: [{ groups: { classId: ['a'] } } as any] },
          });
        }).toThrow(/requires a groupsetId/);
      });

      it('throws when useSingleGroupSet is missing groups', () => {
        expect(() => {
          upgradeClient.setFeatureFlagGroupOptions({ useSingleGroupSet: {} as any });
        }).toThrow(/groups is required/);
      });

      it('throws when a subGroupsets entry reuses the reserved main/single groupset id', () => {
        expect(() => {
          upgradeClient.setFeatureFlagGroupOptions({
            useMultipleGroupSets: { subGroupsets: [{ groupsetId: '*', groups: { classId: ['a'] } }] },
          });
        }).toThrow(/reserved groupset id/);
      });
    });

    describe('#setFeatureFlagUserGroupsForSession (deprecated alias)', () => {
      it('delegates to setFeatureFlagGroupOptions', async () => {
        mockApiServiceGetAllFeatureFlags().mockResolvedValue(['flag1']);

        upgradeClient.setFeatureFlagUserGroupsForSession({
          groupsForSession: { classId: ['classA'] },
          includeStoredUserGroups: false,
        });
        expect(await upgradeClient.getAllFeatureFlags()).toEqual(['flag1']);
      });

      it('throws error with proper message format when groupsForSession is missing', () => {
        expect(() => {
          upgradeClient.setFeatureFlagUserGroupsForSession({ includeStoredUserGroups: true } as any);
        }).toThrow(
          /featureFlagUserGroupsForSession must contain both groupsForSession and includeStoredUserGroups properties/
        );
      });

      it('throws when includeStoredUserGroups is missing', () => {
        expect(() => {
          upgradeClient.setFeatureFlagUserGroupsForSession({ groupsForSession: { school: ['a'] } } as any);
        }).toThrow(
          /featureFlagUserGroupsForSession must contain both groupsForSession and includeStoredUserGroups properties/
        );
      });

      it('accepts null to reset to default', () => {
        expect(() => {
          upgradeClient.setFeatureFlagUserGroupsForSession(null);
        }).not.toThrow();
      });
    });
  });

  describe('#getAllFeatureFlags', () => {
    it('should call apiService with the default groupset when no config is set', async () => {
      mockApiServiceGetAllFeatureFlags().mockResolvedValue(['foo']);

      const result = await upgradeClient.getAllFeatureFlags();

      expect(ApiService.prototype.getAllFeatureFlags).toHaveBeenCalledWith({});
      expect(result).toEqual(['foo']);
    });

    it('should not call apiService again when there is cached data', async () => {
      const getAllFeatureFlags = mockApiServiceGetAllFeatureFlags().mockResolvedValue(['foo']);

      await upgradeClient.getAllFeatureFlags();
      await upgradeClient.getAllFeatureFlags();

      expect(getAllFeatureFlags).toHaveBeenCalledTimes(1);
    });

    it('should call apiService again when ignoreCache is specified', async () => {
      const getAllFeatureFlags = mockApiServiceGetAllFeatureFlags().mockResolvedValue(['foo']);

      await upgradeClient.getAllFeatureFlags();
      await upgradeClient.getAllFeatureFlags({ ignoreCache: true });

      expect(getAllFeatureFlags).toHaveBeenCalledTimes(2);
    });

    it('accepts an ad-hoc useSingleGroupSet override for a single call, still returning a flat array', async () => {
      mockApiServiceGetAllFeatureFlags().mockResolvedValue(['flag1']);

      const result = await upgradeClient.getAllFeatureFlags({
        useSingleGroupSet: { groups: { schoolId: ['school-a'] } },
      });

      expect(ApiService.prototype.getAllFeatureFlags).toHaveBeenCalledWith({
        useSingleGroupSet: { groups: { schoolId: ['school-a'] }, includeStoredUserGroups: undefined },
      });
      expect(result).toEqual(['flag1']);
    });

    it('accepts an ad-hoc useMultipleGroupSets override, one combined request for main + subs', async () => {
      const getAllFeatureFlags = mockApiServiceGetAllFeatureFlags().mockResolvedValue({
        mainGroupset: ['flag1'],
        subGroupsets: { sectionA: ['flag1'], sectionB: [] },
      });

      const result = await upgradeClient.getAllFeatureFlags({
        useMultipleGroupSets: {
          mainGroupset: { groups: { schoolId: ['a', 'b'] } },
          subGroupsets: [
            { groupsetId: 'sectionA', groups: { schoolId: ['a'] } },
            { groupsetId: 'sectionB', groups: { schoolId: ['b'] } },
          ],
        },
      });

      expect(getAllFeatureFlags).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ mainGroupset: ['flag1'], subGroupsets: { sectionA: ['flag1'], sectionB: [] } });
    });

    it('only fetches the ids missing from cache, aggregated into one request', async () => {
      const getAllFeatureFlags = mockApiServiceGetAllFeatureFlags()
        .mockResolvedValueOnce({ mainGroupset: ['flag1'], subGroupsets: { sectionA: ['flag1'] } })
        .mockResolvedValueOnce({ subGroupsets: { sectionB: ['flag2'] } });

      upgradeClient.setFeatureFlagGroupOptions({
        useMultipleGroupSets: {
          mainGroupset: { groups: { schoolId: ['a'] } },
          subGroupsets: [{ groupsetId: 'sectionA', groups: { schoolId: ['a'] } }],
        },
      });
      expect(await upgradeClient.getAllFeatureFlags()).toEqual({
        mainGroupset: ['flag1'],
        subGroupsets: { sectionA: ['flag1'] },
      });

      // reconfigure to include the already-cached mainGroupset + sectionA, plus a new sectionB
      upgradeClient.setFeatureFlagGroupOptions({
        useMultipleGroupSets: {
          mainGroupset: { groups: { schoolId: ['a'] } },
          subGroupsets: [
            { groupsetId: 'sectionA', groups: { schoolId: ['a'] } },
            { groupsetId: 'sectionB', groups: { schoolId: ['b'] } },
          ],
        },
      });
      const result = await upgradeClient.getAllFeatureFlags();

      expect(result).toEqual({ mainGroupset: ['flag1'], subGroupsets: { sectionA: ['flag1'], sectionB: ['flag2'] } });
      expect(getAllFeatureFlags).toHaveBeenCalledTimes(2);
      expect(getAllFeatureFlags).toHaveBeenNthCalledWith(2, {
        useMultipleGroupSets: {
          subGroupsets: [{ groupsetId: 'sectionB', groups: { schoolId: ['b'] }, includeStoredUserGroups: undefined }],
        },
      });
    });

    it('uses the plain useSingleGroupSet shape when only the mainGroupset needs (re)fetching', async () => {
      const getAllFeatureFlags = mockApiServiceGetAllFeatureFlags()
        .mockResolvedValueOnce({ mainGroupset: ['flag1'], subGroupsets: { sectionA: ['flag1'] } })
        .mockResolvedValueOnce(['flag1', 'flag2']);

      upgradeClient.setFeatureFlagGroupOptions({
        useMultipleGroupSets: {
          mainGroupset: { groups: { schoolId: ['a'] } },
          subGroupsets: [{ groupsetId: 'sectionA', groups: { schoolId: ['a'] } }],
        },
      });
      await upgradeClient.getAllFeatureFlags();

      // Force a refetch of only the mainGroupset via an ad-hoc single override — sectionA stays cached.
      await upgradeClient.getAllFeatureFlags({
        useSingleGroupSet: { groups: { schoolId: ['a'] } },
        ignoreCache: true,
      });

      expect(getAllFeatureFlags).toHaveBeenNthCalledWith(2, {
        useSingleGroupSet: { groups: { schoolId: ['a'] }, includeStoredUserGroups: undefined },
      });
    });
  });

  describe('#hasFeatureFlag', () => {
    it('should call apiService "getAllFeatureFlags" with no options', async () => {
      mockApiServiceGetAllFeatureFlags().mockResolvedValue([]);

      await upgradeClient.hasFeatureFlag('testFlag');

      expect(ApiService.prototype.getAllFeatureFlags).toHaveBeenCalled();
    });

    it('should not call apiService again when there is cached data', async () => {
      const getAllFeatureFlags = mockApiServiceGetAllFeatureFlags().mockResolvedValue(['testFlag']);

      expect(await upgradeClient.hasFeatureFlag('testFlag')).toBe(true);
      expect(await upgradeClient.hasFeatureFlag('testFlag')).toBe(true);

      expect(getAllFeatureFlags).toHaveBeenCalledTimes(1);
    });

    it('resolves to mainGroupset when useMultipleGroupSets has one configured', async () => {
      // hasFeatureFlag's rehydration always uses the plain single-groupset shape, regardless of
      // whether the id being fetched plays a "main" or "sub" role — so the mock response here is
      // a flat array, not the { mainGroupset, subGroupsets } object getAllFeatureFlags() returns.
      mockApiServiceGetAllFeatureFlags().mockResolvedValue(['flag1']);

      upgradeClient.setFeatureFlagGroupOptions({
        useMultipleGroupSets: {
          mainGroupset: { groups: { schoolId: ['a', 'b'] } },
          subGroupsets: [{ groupsetId: 'sectionA', groups: { schoolId: ['a'] } }],
        },
      });

      expect(await upgradeClient.hasFeatureFlag('flag1')).toBe(true);
    });

    it('throws when useMultipleGroupSets has no mainGroupset and no id is given', async () => {
      upgradeClient.setFeatureFlagGroupOptions({
        useMultipleGroupSets: { subGroupsets: [{ groupsetId: 'sectionA', groups: { schoolId: ['a'] } }] },
      });

      await expect(upgradeClient.hasFeatureFlag('testFlag')).rejects.toThrow(
        /requires a groupsetId when useMultipleGroupSets has no mainGroupset configured/
      );
    });

    it('reads a cached subGroupset by id without refetching', async () => {
      const getAllFeatureFlags = mockApiServiceGetAllFeatureFlags().mockResolvedValueOnce({
        subGroupsets: { sectionA: ['flag1'] },
      });

      upgradeClient.setFeatureFlagGroupOptions({
        useMultipleGroupSets: { subGroupsets: [{ groupsetId: 'sectionA', groups: { schoolId: ['a'] } }] },
      });
      await upgradeClient.getAllFeatureFlags();

      expect(await upgradeClient.hasFeatureFlag('flag1', 'sectionA')).toBe(true);
      expect(await upgradeClient.hasFeatureFlag('missing', 'sectionA')).toBe(false);
      expect(getAllFeatureFlags).toHaveBeenCalledTimes(1);
    });

    it('rehydrates a registered-but-uncached groupset id by fetching just that one', async () => {
      const getAllFeatureFlags = mockApiServiceGetAllFeatureFlags().mockResolvedValueOnce(['flag1']);

      upgradeClient.setFeatureFlagGroupOptions({
        useMultipleGroupSets: {
          subGroupsets: [
            { groupsetId: 'sectionA', groups: { schoolId: ['a'] } },
            { groupsetId: 'sectionB', groups: { schoolId: ['b'] } },
          ],
        },
      });

      // only ask about sectionA — sectionB is registered but never fetched
      expect(await upgradeClient.hasFeatureFlag('flag1', 'sectionA')).toBe(true);
      expect(getAllFeatureFlags).toHaveBeenCalledTimes(1);
      expect(getAllFeatureFlags).toHaveBeenCalledWith({
        useSingleGroupSet: { groups: { schoolId: ['a'] }, includeStoredUserGroups: undefined },
      });
    });

    it('throws for a groupset id that was never configured or requested', async () => {
      await expect(upgradeClient.hasFeatureFlag('testFlag', 'neverSeen')).rejects.toThrow(
        /No feature flags have been fetched or configured for groupset id "neverSeen"/
      );
    });
  });
});
