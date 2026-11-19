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
  const lastBody = (endpoint: string) =>
    [...request.mock.calls].reverse().find(([url]) => url.endsWith(`/${endpoint}`))?.[1];

  /** Look up a decision point, answering the /assign request with `response` if the lookup makes one. */
  const lookup = async (site: string, target?: string, response: unknown = ASSIGNMENTS) => {
    const before = requestsTo('assign');
    const result = client.getDecisionPointAssignment(site, target);
    await flush();
    if (requestsTo('assign') > before) await respond('assign', response);
    return result;
  };

  /** Get all assignments, answering the /assign request with ASSIGNMENTS if the call makes one. */
  const fetchAll = async () => {
    const before = requestsTo('assign');
    const result = client.getAllExperimentConditions();
    await flush();
    if (requestsTo('assign') > before) await respond('assign', ASSIGNMENTS);
    return result;
  };

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

  describe('single decision point lookups', () => {
    const OTHER = {
      site: 'quiz',
      target: 'hint',
      experimentType: 'Simple',
      assignedCondition: [{ conditionCode: 'hint-on', payload: null, experimentId: 'exp2', id: 'c2' }],
    };

    it('asks /assign for just that decision point', async () => {
      const assignment = await lookup('home', 'banner');

      expect(assignment.getCondition()).toBe('control');
      expect(lastBody('assign')).toEqual({ context: 'context', decisionPoint: { site: 'home', target: 'banner' } });
    });

    it('sends a missing target as the targetless decision point', async () => {
      await lookup('home', undefined, []);

      expect(lastBody('assign')).toEqual({ context: 'context', decisionPoint: { site: 'home', target: '' } });
    });

    it('caches the decision point it fetched', async () => {
      await lookup('home', 'banner');

      expect((await lookup('home', 'banner')).getCondition()).toBe('control');
      expect(requestsTo('assign')).toBe(1);
    });

    it('asks again for a decision point with no assignment', async () => {
      // an empty response adds nothing to the cache, so the next lookup can't tell it already asked
      expect((await lookup('home', 'banner', [])).getCondition()).toBeNull();
      expect((await lookup('home', 'banner', [])).getCondition()).toBeNull();

      expect(requestsTo('assign')).toBe(2);
    });

    it('answers from a full-context cache without asking', async () => {
      await fetchAll();

      expect((await lookup('home', 'banner')).getCondition()).toBe('control');
      // the full context also answers for a decision point with no assignment
      expect((await lookup('quiz', 'hint')).getCondition()).toBeNull();
      expect(requestsTo('assign')).toBe(1);
    });

    it('getAllExperimentConditions fetches the full context instead of returning single decision points', async () => {
      await lookup('home', 'banner');

      await expect(fetchAll()).resolves.toEqual(ASSIGNMENTS);
      expect(requestsTo('assign')).toBe(2);
      expect(lastBody('assign')).toEqual({ context: 'context' });

      // once the full context is cached, neither call asks again
      await fetchAll();
      await lookup('quiz', 'hint');
      expect(requestsTo('assign')).toBe(2);
    });

    it('forgets the full context when the caches are cleared', async () => {
      await fetchAll();
      const init = client.init();
      await respond('init', { id: 'user1' });
      await init;

      // with the full context gone, a lookup asks for just its decision point again, and caches the answer
      await lookup('home', 'banner');
      await lookup('home', 'banner');
      expect(requestsTo('assign')).toBe(2);
      expect(lastBody('assign')).toHaveProperty('decisionPoint');
    });

    it("uses an older server's full-context response for later lookups, but not as the full context", async () => {
      // a server that doesn't support decisionPoint ignores it and returns the full context
      await lookup('home', 'banner', [...ASSIGNMENTS, OTHER]);

      expect((await lookup('quiz', 'hint')).getCondition()).toBe('hint-on');
      expect(requestsTo('assign')).toBe(1);

      await fetchAll();
      expect(requestsTo('assign')).toBe(2);
    });
  });

  describe('markDecisionPoint', () => {
    const CONDITION_APPLIED = UpgradeClient.MARKED_DECISION_POINT_STATUS.CONDITION_APPLIED;
    type MarkBody = { data: { assignedCondition: { conditionCode: string; experimentId?: string; id?: string } } };

    it('does not fetch assignments, so a decision point never looked up is marked without its ids', async () => {
      const mark = client.markDecisionPoint({
        site: 'home',
        target: 'banner',
        condition: 'control',
        status: CONDITION_APPLIED,
      });
      await respond('mark', {});
      await mark;

      expect(requestsTo('assign')).toBe(0);
      expect((lastBody('mark') as MarkBody).data.assignedCondition.experimentId).toBeUndefined();
    });

    it('sends the ids of a decision point looked up on its own', async () => {
      await lookup('home', 'banner');

      const mark = client.markDecisionPoint('home', 'banner', 'control', CONDITION_APPLIED);
      await respond('mark', { experimentId: 'exp1' });
      await mark;

      expect((lastBody('mark') as MarkBody).data.assignedCondition).toMatchObject({
        conditionCode: 'control',
        experimentId: 'exp1',
        id: 'c1',
      });
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
