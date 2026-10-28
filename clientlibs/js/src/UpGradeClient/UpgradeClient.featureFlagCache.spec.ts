import UpgradeClient from './UpgradeClient';

// Kept in its own file: UpgradeClient.spec.ts replaces ApiService/DataService prototype methods without restoring
// them, and this test needs the real feature flag request and cache path.
describe('UpgradeClient feature flag cache', () => {
  const resolvers: Array<(flags: string[]) => void> = [];
  const mockHttpClient = {
    doGet: jest.fn(),
    doPost: jest.fn<Promise<string[]>, [string, unknown, unknown]>(
      () => new Promise<string[]>((resolve) => resolvers.push(resolve))
    ),
    doPatch: jest.fn(),
  };
  const groups = (classId: string) => ({ groupsForSession: { classId: [classId] }, includeStoredUserGroups: true });

  beforeEach(() => {
    resolvers.length = 0;
    mockHttpClient.doPost.mockClear();
  });

  it('does not cache an in-flight response after the session groups change', async () => {
    const client = new UpgradeClient('user1', 'test.com', 'context', { httpClient: mockHttpClient });

    const inFlight = client.getAllFeatureFlags();
    const inFlightHas = client.hasFeatureFlag('old-groups-flag');
    client.setFeatureFlagUserGroupsForSession(groups('c2'));
    resolvers.forEach((resolve) => resolve(['old-groups-flag']));

    // the original callers still get the response they asked for...
    await expect(inFlight).resolves.toEqual(['old-groups-flag']);
    await expect(inFlightHas).resolves.toBe(true);

    // ...but it isn't cached, so the next lookup refetches under the new groups
    const refetch = client.getAllFeatureFlags();
    expect(mockHttpClient.doPost).toHaveBeenCalledTimes(3);
    expect(mockHttpClient.doPost.mock.calls[2][1]).toEqual({ context: 'context', ...groups('c2') });
    resolvers[2](['new-groups-flag']);
    await expect(refetch).resolves.toEqual(['new-groups-flag']);
  });

  it('caches a response when the session groups did not change', async () => {
    const client = new UpgradeClient('user1', 'test.com', 'context', { httpClient: mockHttpClient });

    const first = client.getAllFeatureFlags();
    resolvers[0](['flag']);
    await first;

    await expect(client.hasFeatureFlag('flag')).resolves.toBe(true);
    expect(mockHttpClient.doPost).toHaveBeenCalledTimes(1);
  });
});
