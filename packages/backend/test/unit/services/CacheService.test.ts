import { CacheService } from '../../../src/api/services/CacheService';
import { CACHE_PREFIX } from 'upgrade_types';
// Resolves to the mock below; tests that need non-default caching config mutate it before
// constructing a CacheService, since the service reads env once in its constructor.
import { env as mockedEnv } from '../../../src/env';

jest.mock('../../../src/env', () => ({
  env: {
    caching: {
      enabled: false,
      ttl: 60,
      maxKeys: 500,
      ttlExperiments: 30,
      ttlFeatureFlags: 45,
      ttlSegments: 90,
      refreshThreshold: 0,
    },
  },
}));

describe('CacheService', () => {
  let service: CacheService;
  let mockStore: {
    get: jest.Mock;
    set: jest.Mock;
    del: jest.Mock;
    wrap: jest.Mock;
    store: {
      mget: jest.Mock;
      mset: jest.Mock;
      mdel: jest.Mock;
      keys: jest.Mock;
      reset: jest.Mock;
    };
  };

  beforeEach(() => {
    service = new CacheService();
    mockStore = {
      get: jest.fn().mockResolvedValue(undefined),
      set: jest.fn().mockResolvedValue(undefined),
      del: jest.fn().mockResolvedValue(undefined),
      wrap: jest.fn().mockImplementation((_key, fn) => fn()),
      store: {
        mget: jest.fn().mockResolvedValue([]),
        mset: jest.fn().mockResolvedValue(undefined),
        mdel: jest.fn().mockResolvedValue(undefined),
        keys: jest.fn().mockResolvedValue([]),
        reset: jest.fn().mockResolvedValue(undefined),
      },
    };
    (service as any).cache = mockStore;
  });

  describe('setCache', () => {
    it('returns null and skips set when value is null', async () => {
      const result = await service.setCache('key', null);
      expect(result).toBeNull();
      expect(mockStore.set).not.toHaveBeenCalled();
    });

    it('returns null and skips set when value is undefined', async () => {
      const result = await service.setCache('key', undefined);
      expect(result).toBeNull();
      expect(mockStore.set).not.toHaveBeenCalled();
    });

    it('stores the value and returns it', async () => {
      const value = { id: 'test' };
      const result = await service.setCache('key', value);
      // unprefixed key falls back to the global default TTL (60s -> ms)
      expect(mockStore.set).toHaveBeenCalledWith('key', value, 60000);
      expect(result).toBe(value);
    });

    it('applies the category TTL derived from the key prefix', async () => {
      const value = { id: 'flag' };
      await service.setCache(CACHE_PREFIX.FEATURE_FLAG_KEY_PREFIX + 'app', value);
      expect(mockStore.set).toHaveBeenCalledWith(CACHE_PREFIX.FEATURE_FLAG_KEY_PREFIX + 'app', value, 45000);
    });
  });

  describe('getCache', () => {
    it('returns the cached value', async () => {
      const value = { id: 'test' };
      mockStore.get.mockResolvedValue(value);
      const result = await service.getCache('key');
      expect(result).toBe(value);
      expect(mockStore.get).toHaveBeenCalledWith('key');
    });

    it('returns undefined for an uncached key', async () => {
      const result = await service.getCache('missing');
      expect(result).toBeUndefined();
    });
  });

  describe('delCache', () => {
    it('calls del on the store with the given key', async () => {
      await service.delCache('key');
      expect(mockStore.del).toHaveBeenCalledWith('key');
    });
  });

  describe('resetPrefixCache', () => {
    it('deletes only keys that match the given prefix', async () => {
      mockStore.store.keys.mockResolvedValue(['segments-a', 'segments-b', 'featureFlags-x']);
      await service.resetPrefixCache('segments-');
      expect(mockStore.store.mdel).toHaveBeenCalledWith('segments-a', 'segments-b');
    });

    it('does not call mdel when no keys match the prefix', async () => {
      mockStore.store.keys.mockResolvedValue(['featureFlags-x']);
      await service.resetPrefixCache('segments-');
      expect(mockStore.store.mdel).not.toHaveBeenCalled();
    });
  });

  describe('resetAllCache', () => {
    it('calls reset on the store', async () => {
      await service.resetAllCache();
      expect(mockStore.store.reset).toHaveBeenCalled();
    });
  });

  describe('wrap', () => {
    it('delegates to the store wrap and returns the fn result', async () => {
      const fn = jest.fn().mockResolvedValue('result');
      mockStore.wrap.mockImplementation((_key, fn) => fn());
      const result = await service.wrap('key', fn);
      expect(result).toBe('result');
      expect(fn).toHaveBeenCalled();
    });

    it('returns a cached value without calling fn when the store has one', async () => {
      const fn = jest.fn();
      mockStore.wrap.mockResolvedValue('cached');
      const result = await service.wrap('key', fn);
      expect(result).toBe('cached');
      expect(fn).not.toHaveBeenCalled();
    });
  });

  describe('wrapFunction', () => {
    const PREFIX = CACHE_PREFIX.SEGMENT_KEY_PREFIX;

    it('returns empty array immediately without hitting the store when keys is empty', async () => {
      const fetchFn = jest.fn();
      const result = await service.wrapFunction(PREFIX, [], fetchFn);
      expect(result).toEqual([]);
      expect(mockStore.store.mget).not.toHaveBeenCalled();
      expect(fetchFn).not.toHaveBeenCalled();
    });

    it('returns all cached values without calling fetchFn on a full cache hit', async () => {
      const seg1 = { id: 'a' };
      const seg2 = { id: 'b' };
      mockStore.store.mget.mockResolvedValue([seg1, seg2]);
      const fetchFn = jest.fn();

      const result = await service.wrapFunction(PREFIX, ['a', 'b'], fetchFn);

      expect(fetchFn).not.toHaveBeenCalled();
      expect(result).toEqual([seg1, seg2]);
    });

    it('calls fetchFn and caches all results on a full cache miss', async () => {
      const seg1 = { id: 'a' };
      const seg2 = { id: 'b' };
      mockStore.store.mget.mockResolvedValue([undefined, undefined]);
      const fetchFn = jest.fn().mockResolvedValue([seg1, seg2]);

      const result = await service.wrapFunction(PREFIX, ['a', 'b'], fetchFn);

      expect(fetchFn).toHaveBeenCalled();
      // SEGMENT prefix -> segments category TTL (90s -> ms)
      expect(mockStore.store.mset).toHaveBeenCalledWith(
        [
          [PREFIX + 'a', seg1],
          [PREFIX + 'b', seg2],
        ],
        90000
      );
      expect(result).toEqual([seg1, seg2]);
    });

    it('calls fetchFn for all keys on a partial cache hit', async () => {
      const seg1 = { id: 'a' };
      const seg2 = { id: 'b' };
      // 'a' is cached but 'b' is not — fetchFn still called for everything
      mockStore.store.mget.mockResolvedValue([seg1, undefined]);
      const fetchFn = jest.fn().mockResolvedValue([seg1, seg2]);

      const result = await service.wrapFunction(PREFIX, ['a', 'b'], fetchFn);

      expect(fetchFn).toHaveBeenCalled();
      expect(result).toEqual([seg1, seg2]);
    });

    it('does not cache null or undefined values returned by fetchFn', async () => {
      const seg1 = { id: 'a' };
      mockStore.store.mget.mockResolvedValue([undefined, undefined]);
      const fetchFn = jest.fn().mockResolvedValue([seg1, undefined]);

      await service.wrapFunction(PREFIX, ['a', 'b'], fetchFn);

      expect(mockStore.store.mset).toHaveBeenCalledWith([[PREFIX + 'a', seg1]], 90000);
    });

    it('uses the prefixed key when calling mget', async () => {
      mockStore.store.mget.mockResolvedValue([undefined]);
      const fetchFn = jest.fn().mockResolvedValue([{ id: 'a' }]);

      await service.wrapFunction(CACHE_PREFIX.SEGMENT_KEY_PREFIX, ['a'], fetchFn);

      expect(mockStore.store.mget).toHaveBeenCalledWith(CACHE_PREFIX.SEGMENT_KEY_PREFIX + 'a');
    });
  });

  describe('per-category TTL resolution (via wrap)', () => {
    it.each([
      [CACHE_PREFIX.EXPERIMENT_KEY_PREFIX, 30000],
      [CACHE_PREFIX.MARK_KEY_PREFIX, 30000],
      [CACHE_PREFIX.FEATURE_FLAG_KEY_PREFIX, 45000],
      [CACHE_PREFIX.SEGMENT_KEY_PREFIX, 90000],
      [CACHE_PREFIX.GLOBAL_EXCLUDE_SEGMENT_KEY_PREFIX, 90000],
      // Precomputed membership is owner-scoped, not shared-segment data, so each tracks its
      // owner's TTL rather than the segments TTL
      [CACHE_PREFIX.FEATURE_FLAG_PRECOMPUTED_SEGMENT_KEY_PREFIX, 45000],
      [CACHE_PREFIX.EXPERIMENT_PRECOMPUTED_SEGMENT_KEY_PREFIX, 30000],
    ])('wraps %s with its category TTL (ms)', async (prefix, expectedTtl) => {
      const fn = jest.fn().mockResolvedValue('v');
      await service.wrap(prefix + 'context', fn);
      expect(mockStore.wrap).toHaveBeenCalledWith(prefix + 'context', fn, expectedTtl, 0);
    });

    it('falls back to the global default TTL for an unknown prefix', async () => {
      const fn = jest.fn().mockResolvedValue('v');
      await service.wrap('unknown-key', fn);
      expect(mockStore.wrap).toHaveBeenCalledWith('unknown-key', fn, 60000, 0);
    });
  });

  describe('refresh interval -> threshold conversion (via wrap)', () => {
    // The interval is read in the constructor, so each case needs its own instance.
    const serviceWithInterval = (refreshThreshold: number): CacheService => {
      mockedEnv.caching.refreshThreshold = refreshThreshold;
      const instance = new CacheService();
      (instance as any).cache = mockStore;
      return instance;
    };

    afterEach(() => {
      mockedEnv.caching.refreshThreshold = 0;
    });

    it('passes no threshold when the env var is unset', async () => {
      const fn = jest.fn().mockResolvedValue('v');
      await serviceWithInterval(0).wrap(CACHE_PREFIX.EXPERIMENT_KEY_PREFIX + 'app', fn);
      expect(mockStore.wrap).toHaveBeenCalledWith(CACHE_PREFIX.EXPERIMENT_KEY_PREFIX + 'app', fn, 30000, 0);
    });

    it('converts the interval to a threshold of ttl - interval', async () => {
      const fn = jest.fn().mockResolvedValue('v');
      // refresh every 10s on the 30s experiments TTL -> refresh once 20s of life remains
      await serviceWithInterval(10).wrap(CACHE_PREFIX.EXPERIMENT_KEY_PREFIX + 'app', fn);
      expect(mockStore.wrap).toHaveBeenCalledWith(CACHE_PREFIX.EXPERIMENT_KEY_PREFIX + 'app', fn, 30000, 20000);
    });

    it('allows an interval far below half the TTL — the case the old cap blocked', async () => {
      const fn = jest.fn().mockResolvedValue('v');
      mockedEnv.caching.ttlExperiments = 3600; // 1 hour
      const service = serviceWithInterval(45); // refresh every 45s
      await service.wrap(CACHE_PREFIX.EXPERIMENT_KEY_PREFIX + 'app', fn);
      // 3600s - 45s: a long hard expiry with a short staleness bound
      expect(mockStore.wrap).toHaveBeenCalledWith(CACHE_PREFIX.EXPERIMENT_KEY_PREFIX + 'app', fn, 3600000, 3555000);
      mockedEnv.caching.ttlExperiments = 30;
    });

    it('converts against each category TTL independently', async () => {
      const fn = jest.fn().mockResolvedValue('v');
      const service = serviceWithInterval(20);
      await service.wrap(CACHE_PREFIX.SEGMENT_KEY_PREFIX + 'a', fn);
      expect(mockStore.wrap).toHaveBeenCalledWith(CACHE_PREFIX.SEGMENT_KEY_PREFIX + 'a', fn, 90000, 70000);
      await service.wrap(CACHE_PREFIX.FEATURE_FLAG_KEY_PREFIX + 'app', fn);
      expect(mockStore.wrap).toHaveBeenCalledWith(CACHE_PREFIX.FEATURE_FLAG_KEY_PREFIX + 'app', fn, 45000, 25000);
    });

    it('disables refresh for a bucket whose TTL is shorter than the interval', async () => {
      const fn = jest.fn().mockResolvedValue('v');
      // 45s interval vs the 30s experiments TTL: the TTL expires first, so there is nothing to
      // refresh ahead of. Threshold 0 = plain TTL expiry, never a negative threshold.
      await serviceWithInterval(45).wrap(CACHE_PREFIX.EXPERIMENT_KEY_PREFIX + 'app', fn);
      expect(mockStore.wrap).toHaveBeenCalledWith(CACHE_PREFIX.EXPERIMENT_KEY_PREFIX + 'app', fn, 30000, 0);
    });
  });

  // The rest of the suite stubs the store, so it can only prove the threshold is passed through.
  // This exercises the real cache-manager memory store to prove what the refresh interval actually
  // buys: a request past the refresh age is served immediately and never waits on the refill.
  describe('background refresh against the real memory store', () => {
    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    const key = CACHE_PREFIX.EXPERIMENT_KEY_PREFIX + 'realstore';

    beforeEach(() => {
      mockedEnv.caching.enabled = true;
      mockedEnv.caching.ttl = 1; // 1s global default
      mockedEnv.caching.ttlExperiments = 1; // 1s hard expiry
      mockedEnv.caching.refreshThreshold = 0.5; // refresh once an entry is 500ms old
    });

    afterEach(() => {
      mockedEnv.caching.enabled = false;
      mockedEnv.caching.ttl = 60;
      mockedEnv.caching.ttlExperiments = 30;
      mockedEnv.caching.refreshThreshold = 0;
    });

    it('serves the about-to-expire value and refreshes it in the background', async () => {
      let calls = 0;
      const fetch = jest.fn().mockImplementation(async () => `v${++calls}`);
      const realService = new CacheService();

      expect(await realService.wrap(key, fetch)).toBe('v1');
      expect(fetch).toHaveBeenCalledTimes(1);

      // 600ms in, the entry has <500ms left, so this hit is past the refresh line
      await sleep(600);
      expect(await realService.wrap(key, fetch)).toBe('v1'); // served the stale value, did not block
      expect(fetch).toHaveBeenCalledTimes(2); // ...while kicking off a refresh

      // The refresh landed and reset the TTL, so the entry never expired out from under callers
      await sleep(50);
      expect(await realService.wrap(key, fetch)).toBe('v2');
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('keeps serving a cached value when the background refresh fails', async () => {
      const fetch = jest.fn().mockResolvedValueOnce('v1').mockRejectedValue(new Error('db down'));
      const realService = new CacheService();

      expect(await realService.wrap(key, fetch)).toBe('v1');

      await sleep(600);
      expect(await realService.wrap(key, fetch)).toBe('v1');
      await sleep(50);
      // The failed refresh is logged via onBackgroundRefreshError, not rethrown, and the old value
      // stays until its original TTL runs out
      expect(await realService.wrap(key, fetch)).toBe('v1');
    });
  });
});
