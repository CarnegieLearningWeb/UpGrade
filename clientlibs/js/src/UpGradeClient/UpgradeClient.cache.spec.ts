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

  describe('invalidation when the user or their groups may have changed', () => {
    it.each([
      ['init', 'init', (c: UpgradeClient) => c.init()],
      ['setGroupMembership', 'groupmembership', (c: UpgradeClient) => c.setGroupMembership({ classId: ['c2'] })],
      ['setWorkingGroup', 'workinggroup', (c: UpgradeClient) => c.setWorkingGroup({ classId: 'c2' })],
      ['setAltUserIds', 'useraliases', (c: UpgradeClient) => c.setAltUserIds(['alias1'])],
    ])('%s clears assignments and feature flags once the server confirms it', async (_name, endpoint, call) => {
      await primeCaches(client);

      const result = call(client);
      await respond(endpoint, { id: 'user1' });
      await result;

      expect(await lookUpAgain(client)).toEqual({ assignRefetched: true, flagsRefetched: true });
    });

    it('marks an Assignment with its own experiment after the cache is cleared and refilled', async () => {
      // the user is shown experiment A's condition...
      const lookup = client.getDecisionPointAssignment('home', 'banner');
      await respond('assign', ASSIGNMENTS);
      const assignment = await lookup;

      // ...then their groups change, and the refetched assignments put experiment B at the same decision point
      const groupChange = client.setGroupMembership({ classId: ['c2'] });
      await respond('groupmembership', { id: 'user1' });
      await groupChange;
      const refetch = client.getAllExperimentConditions();
      await respond('assign', [
        {
          ...ASSIGNMENTS[0],
          assignedCondition: [{ conditionCode: 'b-code', payload: null, experimentId: 'expB', id: 'cB' }],
        },
      ]);
      await refetch;

      // marking the original assignment still records experiment A's condition, not B's
      const mark = assignment.markDecisionPoint(UpgradeClient.MARKED_DECISION_POINT_STATUS.CONDITION_APPLIED);
      await respond('mark', { experimentId: 'exp1' });
      await mark;
      const body = request.mock.calls[request.mock.calls.length - 1][1] as { data: { assignedCondition: unknown } };
      expect(body.data.assignedCondition).toEqual({ conditionCode: 'control', id: 'c1', experimentId: 'exp1' });
    });

    it('keeps the caches when the group change fails', async () => {
      await primeCaches(client);

      const rejected = expect(client.setGroupMembership({ classId: ['c2'] })).rejects.toThrow();
      await respond('groupmembership', null, true);
      await rejected;

      expect(await lookUpAgain(client)).toEqual({ assignRefetched: false, flagsRefetched: false });
    });
  });

  describe('feature flag session groups', () => {
    it('clears the flag cache and sends the new groups when the session groups change', async () => {
      const first = client.getAllFeatureFlags();
      await respond('featureflag', ['flag']);
      await first;

      client.setFeatureFlagUserGroupsForSession(groups('c2'));
      const refetch = client.getAllFeatureFlags();
      await respond('featureflag', ['new-groups-flag']);

      await expect(refetch).resolves.toEqual(['new-groups-flag']);
      expect(request.mock.calls[1][1]).toEqual({ context: 'context', ...groups('c2') });
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
