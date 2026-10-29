import UpgradeClient from './UpgradeClient';

// Kept in its own file: UpgradeClient.spec.ts replaces ApiService/DataService prototype methods without restoring
// them, and these tests need the real request and cache paths.
describe('UpgradeClient caches', () => {
  type Pending = { url: string; body: unknown; resolve: (value: unknown) => void; reject: (error: unknown) => void };
  let pending: Pending[];
  const request = jest.fn<Promise<unknown>, [string, unknown, unknown]>(
    (url, body) => new Promise((resolve, reject) => pending.push({ url, body, resolve, reject }))
  );
  const mockHttpClient = { doGet: jest.fn(), doPost: request, doPatch: request };

  const ASSIGNMENTS = [
    {
      site: 'home',
      target: 'banner',
      experimentType: 'Simple',
      assignedCondition: [{ conditionCode: 'control', payload: null, experimentId: 'exp1', id: 'c1' }],
    },
  ];
  const groups = (classId: string) => ({ groupsForSession: { classId: [classId] }, includeStoredUserGroups: true });

  /** Resolve (or reject) the oldest pending request to the given endpoint. */
  const flush = () => new Promise((resolve) => setImmediate(resolve));
  const respond = async (endpoint: string, value: unknown, fail = false) => {
    // requests can be issued a tick after the call that triggers them
    await flush();
    const index = pending.findIndex((p) => p.url.endsWith(`/${endpoint}`));
    expect(index).toBeGreaterThanOrEqual(0);
    const [request] = pending.splice(index, 1);
    if (fail) {
      request.reject(new Error('request failed'));
    } else {
      request.resolve(value);
    }
    await flush();
  };
  const requestsTo = (endpoint: string) => request.mock.calls.filter(([url]) => url.endsWith(`/${endpoint}`)).length;

  /** Fetch and cache assignments and feature flags. */
  const primeCaches = async (client: UpgradeClient) => {
    const assignments = client.getAllExperimentConditions();
    await respond('assign', ASSIGNMENTS);
    await assignments;
    const flags = client.getAllFeatureFlags();
    await respond('featureflag', ['flag']);
    await flags;
  };

  /** Look up assignments and flags again, answering any refetch, and report how many requests that took. */
  const lookUpAgain = async (client: UpgradeClient) => {
    const before = { assign: requestsTo('assign'), featureflag: requestsTo('featureflag') };
    const assignments = client.getAllExperimentConditions();
    await flush();
    if (requestsTo('assign') > before.assign) await respond('assign', ASSIGNMENTS);
    await assignments;
    const flags = client.getAllFeatureFlags();
    await flush();
    if (requestsTo('featureflag') > before.featureflag) await respond('featureflag', ['flag']);
    await flags;
    return {
      assignRefetched: requestsTo('assign') > before.assign,
      flagsRefetched: requestsTo('featureflag') > before.featureflag,
    };
  };

  let client: UpgradeClient;
  beforeEach(() => {
    pending = [];
    request.mockClear();
    client = new UpgradeClient('user1', 'test.com', 'context', { httpClient: mockHttpClient });
  });

  describe('invalidation when the user groups may have changed', () => {
    it.each([
      ['init', 'init', (c: UpgradeClient) => c.init()],
      ['setGroupMembership', 'groupmembership', (c: UpgradeClient) => c.setGroupMembership({ classId: ['c2'] })],
      ['setWorkingGroup', 'workinggroup', (c: UpgradeClient) => c.setWorkingGroup({ classId: 'c2' })],
    ])('%s clears assignments and feature flags once the server confirms it', async (_name, endpoint, call) => {
      await primeCaches(client);

      const result = call(client);
      await respond(endpoint, { id: 'user1' });
      await result;

      expect(await lookUpAgain(client)).toEqual({ assignRefetched: true, flagsRefetched: true });
    });

    it('keeps the caches when the group change fails', async () => {
      await primeCaches(client);

      const rejected = expect(client.setGroupMembership({ classId: ['c2'] })).rejects.toThrow();
      await respond('groupmembership', null, true);
      await rejected;

      expect(await lookUpAgain(client)).toEqual({ assignRefetched: false, flagsRefetched: false });
    });

    it('setAltUserIds does not clear the caches', async () => {
      await primeCaches(client);

      const result = client.setAltUserIds(['alias1']);
      await respond('useraliases', { userId: 'user1', aliases: ['alias1'] });
      await result;

      expect(await lookUpAgain(client)).toEqual({ assignRefetched: false, flagsRefetched: false });
    });

    it('does not cache an in-flight /assign response after the groups change', async () => {
      const inFlight = client.getDecisionPointAssignment('home', 'banner');
      const groupChange = client.setGroupMembership({ classId: ['c2'] });
      await respond('groupmembership', { id: 'user1' });
      await groupChange;
      await respond('assign', ASSIGNMENTS);

      // the original caller still gets the assignment it asked for...
      expect((await inFlight).getCondition()).toEqual('control');
      // ...but it isn't cached, so the next lookup refetches under the new groups
      expect((await lookUpAgain(client)).assignRefetched).toBe(true);
    });
  });

  describe('feature flag session groups', () => {
    it('does not cache an in-flight response after the session groups change', async () => {
      const inFlight = client.getAllFeatureFlags();
      const inFlightHas = client.hasFeatureFlag('old-groups-flag');
      client.setFeatureFlagUserGroupsForSession(groups('c2'));
      await respond('featureflag', ['old-groups-flag']);
      await respond('featureflag', ['old-groups-flag']);

      // the original callers still get the response they asked for...
      await expect(inFlight).resolves.toEqual(['old-groups-flag']);
      await expect(inFlightHas).resolves.toBe(true);

      // ...but it isn't cached, so the next lookup refetches under the new groups
      const refetch = client.getAllFeatureFlags();
      await flush();
      expect(requestsTo('featureflag')).toBe(3);
      expect(request.mock.calls[2][1]).toEqual({ context: 'context', ...groups('c2') });
      await respond('featureflag', ['new-groups-flag']);
      await expect(refetch).resolves.toEqual(['new-groups-flag']);
    });

    it('caches a response when the session groups did not change', async () => {
      const first = client.getAllFeatureFlags();
      await respond('featureflag', ['flag']);
      await first;

      await expect(client.hasFeatureFlag('flag')).resolves.toBe(true);
      expect(requestsTo('featureflag')).toBe(1);
    });
  });
});
