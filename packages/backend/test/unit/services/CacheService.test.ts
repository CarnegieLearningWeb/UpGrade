import { CacheService } from '../../../src/api/services/CacheService';
import { CACHE_PREFIX } from 'upgrade_types';
import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';
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

  // `wrap` is handed a ttl *function* rather than a number, because the jitter has to resolve at write
  // time. Assertions read the ttl by invoking it.
  const lastWrapCall = () => {
    const calls = mockStore.wrap.mock.calls;
    const [key, fn, ttl, refreshThreshold] = calls[calls.length - 1];
    return { key, fn, ttl, ttlMs: typeof ttl === 'function' ? ttl() : ttl, refreshThreshold };
  };

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

  describe('wrapMany', () => {
    const PREFIX = CACHE_PREFIX.SEGMENT_KEY_PREFIX;

    // Stands in for cache-manager's read-through `wrap`. The detail that matters is its hit test:
    // `value === undefined`, not falsiness — which is why a stored `null` counts as a hit.
    const readThroughWrap = (backing: Map<string, unknown>) =>
      jest.fn().mockImplementation(async (key: string, fn: () => Promise<unknown>) => {
        if (backing.has(key)) {
          return backing.get(key);
        }
        const value = await fn();
        backing.set(key, value);
        return value;
      });

    let backing: Map<string, unknown>;

    beforeEach(() => {
      backing = new Map();
      mockStore.wrap = readThroughWrap(backing);
      // mget has to read the same backing store as wrap, since wrapMany uses it to decide which
      // keys still need loading
      mockStore.store.mget = jest.fn().mockImplementation(async (...keys: string[]) => keys.map((k) => backing.get(k)));
    });

    it('returns empty array immediately without hitting the store when keys is empty', async () => {
      const loadByKeys = jest.fn();
      const result = await service.wrapMany(PREFIX, [], loadByKeys);
      expect(result).toEqual([]);
      expect(mockStore.store.mget).not.toHaveBeenCalled();
      expect(mockStore.wrap).not.toHaveBeenCalled();
      expect(loadByKeys).not.toHaveBeenCalled();
    });

    it('loads every key in a single batched call on a full miss', async () => {
      const seg1 = { id: 'a' };
      const seg2 = { id: 'b' };
      const loadByKeys = jest.fn().mockResolvedValue([seg1, seg2]);

      const result = await service.wrapMany(PREFIX, ['a', 'b'], loadByKeys);

      expect(loadByKeys).toHaveBeenCalledTimes(1);
      expect(loadByKeys).toHaveBeenCalledWith(['a', 'b']);
      expect(result).toEqual([seg1, seg2]);
    });

    it('does not call the loader at all when every key is cached', async () => {
      const seg1 = { id: 'a' };
      const seg2 = { id: 'b' };
      backing.set(PREFIX + 'a', seg1);
      backing.set(PREFIX + 'b', seg2);
      const loadByKeys = jest.fn();

      const result = await service.wrapMany(PREFIX, ['a', 'b'], loadByKeys);

      expect(loadByKeys).not.toHaveBeenCalled();
      expect(result).toEqual([seg1, seg2]);
    });

    it('loads only the missing keys on a partial hit', async () => {
      const seg1 = { id: 'a' };
      const seg2 = { id: 'b' };
      backing.set(PREFIX + 'a', seg1);
      const loadByKeys = jest.fn().mockResolvedValue([seg2]);

      const result = await service.wrapMany(PREFIX, ['a', 'b'], loadByKeys);

      // The cached neighbour is not re-read just because 'b' was cold
      expect(loadByKeys).toHaveBeenCalledTimes(1);
      expect(loadByKeys).toHaveBeenCalledWith(['b']);
      expect(result).toEqual([seg1, seg2]);
    });

    it('caches a key with no row as null so it stops being re-queried', async () => {
      const seg1 = { id: 'a' };
      const loadByKeys = jest.fn().mockResolvedValue([seg1, undefined]);

      const first = await service.wrapMany(PREFIX, ['a', 'b'], loadByKeys);
      expect(first).toEqual([seg1, null]);
      expect(backing.get(PREFIX + 'b')).toBeNull();

      // The regression this replaced: an absent row used to be left uncached, so `b` missing meant
      // every later call re-queried the whole batch forever.
      const second = await service.wrapMany(PREFIX, ['a', 'b'], loadByKeys);
      expect(second).toEqual([seg1, null]);
      expect(loadByKeys).toHaveBeenCalledTimes(1);
    });

    it('keeps the results index-aligned with the requested keys', async () => {
      backing.set(PREFIX + 'b', { id: 'b' });
      // Loader is handed only ['a', 'c'] and answers in that order; wrapMany has to slot them back
      // around the already-cached 'b'
      const loadByKeys = jest.fn().mockResolvedValue([{ id: 'a' }, { id: 'c' }]);

      const result = await service.wrapMany(PREFIX, ['a', 'b', 'c'], loadByKeys);

      expect(loadByKeys).toHaveBeenCalledWith(['a', 'c']);
      expect(result).toEqual([{ id: 'a' }, { id: 'b' }, { id: 'c' }]);
    });

    it('wraps each key under its prefix with the category TTL and refresh threshold', async () => {
      const loadByKeys = jest.fn().mockResolvedValue([{ id: 'a' }]);

      await service.wrapMany(PREFIX, ['a'], loadByKeys);

      // SEGMENT prefix -> segments category TTL (90s -> ms), no refresh interval configured
      expect(lastWrapCall()).toMatchObject({ key: PREFIX + 'a', ttlMs: 90000, refreshThreshold: 0 });
    });
  });

  describe('per-category TTL resolution (via wrap)', () => {
    it.each([
      [CACHE_PREFIX.EXPERIMENT_KEY_PREFIX, 30000],
      [CACHE_PREFIX.FEATURE_FLAG_KEY_PREFIX, 45000],
      [CACHE_PREFIX.SEGMENT_KEY_PREFIX, 90000],
      [CACHE_PREFIX.GLOBAL_EXCLUDE_SEGMENT_KEY_PREFIX, 90000],
      // Precomputed membership is owner-scoped, not shared-segment data, so each tracks its
      // owner's TTL rather than the segments TTL
      [CACHE_PREFIX.FEATURE_FLAG_PRECOMPUTED_SEGMENT_KEY_PREFIX, 45000],
      [CACHE_PREFIX.EXPERIMENT_PRECOMPUTED_SEGMENT_KEY_PREFIX, 30000],
      // Thompson Sampling config lookups share the experiments bucket/TTL
      [CACHE_PREFIX.THOMPSON_SAMPLING_CONFIG_KEY_PREFIX, 30000],
    ])('wraps %s with its category TTL (ms)', async (prefix, expectedTtl) => {
      const fn = jest.fn().mockResolvedValue('v');
      await service.wrap(prefix + 'context', fn);
      // no refresh interval configured here, so the jitter is a no-op and the TTL is exact
      expect(lastWrapCall()).toMatchObject({ key: prefix + 'context', fn, ttlMs: expectedTtl, refreshThreshold: 0 });
    });

    it('falls back to the global default TTL for an unknown prefix', async () => {
      const fn = jest.fn().mockResolvedValue('v');
      await service.wrap('unknown-key', fn);
      expect(lastWrapCall()).toMatchObject({ key: 'unknown-key', fn, ttlMs: 60000, refreshThreshold: 0 });
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

    // With an interval configured the TTL is jittered, so these check the threshold exactly (that is
    // what the conversion is about) and the TTL against its jitter band.
    const expectTtlWithin = (ttlMs: number, base: number, spread: number) => {
      expect(ttlMs).toBeGreaterThanOrEqual(base - spread);
      expect(ttlMs).toBeLessThanOrEqual(base + spread);
    };

    it('passes no threshold when the env var is unset', async () => {
      const fn = jest.fn().mockResolvedValue('v');
      await serviceWithInterval(0).wrap(CACHE_PREFIX.EXPERIMENT_KEY_PREFIX + 'app', fn);
      // no interval means no jitter either, so the TTL is exact
      expect(lastWrapCall()).toMatchObject({ ttlMs: 30000, refreshThreshold: 0 });
    });

    it('converts the interval to a threshold of ttl - interval', async () => {
      const fn = jest.fn().mockResolvedValue('v');
      // refresh every 10s on the 30s experiments TTL -> refresh once 20s of life remains
      await serviceWithInterval(10).wrap(CACHE_PREFIX.EXPERIMENT_KEY_PREFIX + 'app', fn);
      const call = lastWrapCall();
      expect(call.refreshThreshold).toBe(20000);
      expectTtlWithin(call.ttlMs, 30000, 2500); // 25% of the 10s interval
    });

    it('allows an interval far below half the TTL — the case the old cap blocked', async () => {
      const fn = jest.fn().mockResolvedValue('v');
      mockedEnv.caching.ttlExperiments = 3600; // 1 hour
      const service = serviceWithInterval(45); // refresh every 45s
      await service.wrap(CACHE_PREFIX.EXPERIMENT_KEY_PREFIX + 'app', fn);
      // 3600s - 45s: a long hard expiry with a short staleness bound
      const call = lastWrapCall();
      expect(call.refreshThreshold).toBe(3555000);
      expectTtlWithin(call.ttlMs, 3600000, 11250);
      mockedEnv.caching.ttlExperiments = 30;
    });

    it('converts against each category TTL independently', async () => {
      const fn = jest.fn().mockResolvedValue('v');
      const service = serviceWithInterval(20);
      await service.wrap(CACHE_PREFIX.SEGMENT_KEY_PREFIX + 'a', fn);
      expect(lastWrapCall().refreshThreshold).toBe(70000);
      expectTtlWithin(lastWrapCall().ttlMs, 90000, 5000);
      await service.wrap(CACHE_PREFIX.FEATURE_FLAG_KEY_PREFIX + 'app', fn);
      expect(lastWrapCall().refreshThreshold).toBe(25000);
      expectTtlWithin(lastWrapCall().ttlMs, 45000, 5000);
    });

    it('disables refresh for a bucket whose TTL is shorter than the interval', async () => {
      const fn = jest.fn().mockResolvedValue('v');
      // 45s interval vs the 30s experiments TTL: the TTL expires first, so there is nothing to
      // refresh ahead of. Threshold 0 = plain TTL expiry, never a negative threshold.
      await serviceWithInterval(45).wrap(CACHE_PREFIX.EXPERIMENT_KEY_PREFIX + 'app', fn);
      const call = lastWrapCall();
      expect(call.refreshThreshold).toBe(0);
      // still jittered, so the hard expiry of a batch is spread out even with refresh off; clamped to
      // the TTL rather than the larger interval
      expectTtlWithin(call.ttlMs, 30000, 7500);
    });
  });

  describe('TTL jitter', () => {
    const serviceWithInterval = (refreshThreshold: number): CacheService => {
      mockedEnv.caching.refreshThreshold = refreshThreshold;
      const instance = new CacheService();
      (instance as any).cache = mockStore;
      return instance;
    };

    afterEach(() => {
      mockedEnv.caching.refreshThreshold = 0;
    });

    it('passes the TTL as a function, so the jitter resolves at write time rather than per read', async () => {
      // The property the whole mechanism rests on. Resolving the jitter once per request and passing a
      // number would give every reader its own idea of when the key is due, and under load the lowest
      // draw wins almost immediately — collapsing the range and desynchronising nothing. If someone
      // "simplifies" this back to a number, this test is what should stop them.
      await serviceWithInterval(10).wrap(CACHE_PREFIX.EXPERIMENT_KEY_PREFIX + 'app', jest.fn().mockResolvedValue('v'));

      const { ttl } = lastWrapCall();
      expect(typeof ttl).toBe('function');
      const draws = new Set(Array.from({ length: 50 }, () => (ttl as () => number)()));
      expect(draws.size).toBeGreaterThan(1);
    });

    it('spreads the TTL around the base by a fraction of the refresh interval', async () => {
      await serviceWithInterval(10).wrap(CACHE_PREFIX.EXPERIMENT_KEY_PREFIX + 'app', jest.fn().mockResolvedValue('v'));
      const { ttl } = lastWrapCall();

      // 25% of the 10s interval -> the 30s TTL lands in 27.5s..32.5s, so the refresh point moves
      // within a 5s window instead of every key coming due at exactly 20s of remaining life
      const draws = Array.from({ length: 300 }, () => (ttl as () => number)());
      expect(Math.min(...draws)).toBeGreaterThanOrEqual(27500);
      expect(Math.max(...draws)).toBeLessThanOrEqual(32500);
      // and it genuinely covers the range rather than hugging the base
      expect(Math.max(...draws) - Math.min(...draws)).toBeGreaterThan(2500);
    });

    it('does not jitter at all when no refresh interval is configured', async () => {
      await service.wrap(CACHE_PREFIX.EXPERIMENT_KEY_PREFIX + 'app', jest.fn().mockResolvedValue('v'));
      const { ttl } = lastWrapCall();
      expect(new Set(Array.from({ length: 20 }, () => (ttl as () => number)()))).toEqual(new Set([30000]));
    });

    it('clamps the spread to the TTL when the interval is larger than it', async () => {
      // 45s interval on a 30s TTL: scaling to the interval alone would swing a 30s entry by +/-11s.
      await serviceWithInterval(45).wrap(CACHE_PREFIX.EXPERIMENT_KEY_PREFIX + 'app', jest.fn().mockResolvedValue('v'));
      const { ttl } = lastWrapCall();

      const draws = Array.from({ length: 300 }, () => (ttl as () => number)());
      expect(Math.min(...draws)).toBeGreaterThanOrEqual(22500); // 25% of the 30s TTL, not of 45s
      expect(Math.max(...draws)).toBeLessThanOrEqual(37500);
    });
  });

  describe('boot warning for buckets without background refresh', () => {
    let warnSpy: jest.SpyInstance;

    beforeEach(() => {
      warnSpy = jest.spyOn(UpgradeLogger.prototype, 'warn').mockImplementation(() => undefined);
      mockedEnv.caching.enabled = true;
    });

    afterEach(() => {
      warnSpy.mockRestore();
      mockedEnv.caching.enabled = false;
      mockedEnv.caching.refreshThreshold = 0;
    });

    const bootWith = async (refreshThreshold: number): Promise<void> => {
      mockedEnv.caching.refreshThreshold = refreshThreshold;
      const instance = new CacheService();
      await (instance as any).initPromise;
    };

    it('names every bucket whose TTL is at or below the refresh interval', async () => {
      // TTLs here are experiments 30s, featureFlags 45s, segments 90s, settings 60s (the default).
      // A 60s interval leaves only segments with any room to refresh ahead of its expiry.
      await bootWith(60);

      expect(warnSpy).toHaveBeenCalledTimes(1);
      const { message } = warnSpy.mock.calls[0][0];
      expect(message).toContain('experiments');
      expect(message).toContain('featureFlags');
      expect(message).toContain('settings');
      expect(message).not.toContain('segments');
    });

    it('stays quiet when every bucket has room to refresh', async () => {
      await bootWith(10);
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('stays quiet when no refresh interval is configured', async () => {
      await bootWith(0);
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });

  // The rest of the suite stubs the store, so it can only prove the threshold is passed through.
  // This exercises the real cache-manager memory store to prove what the refresh interval actually
  // buys: a request past the refresh age is served immediately and never waits on the refill.
  describe('background refresh against the real memory store', () => {
    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    const key = CACHE_PREFIX.EXPERIMENT_KEY_PREFIX + 'realstore';

    // The interval is kept small relative to the TTL on purpose. The TTL is jittered, and the jitter
    // scales with the interval, so a large interval would move the refresh age around enough to make
    // a fixed sleep race it. Here: TTL 2000ms +/-62ms, threshold 1750ms, so an entry is due for
    // refresh somewhere in 187-312ms and hard-expires no earlier than 1937ms. A 500ms sleep sits
    // comfortably between the two.
    beforeEach(() => {
      mockedEnv.caching.enabled = true;
      mockedEnv.caching.ttl = 2; // 2s global default
      mockedEnv.caching.ttlExperiments = 2; // 2s hard expiry
      mockedEnv.caching.refreshThreshold = 0.25; // refresh once an entry is ~250ms old
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

      // 500ms in, the entry is past its refresh age but nowhere near expiry
      await sleep(500);
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

      await sleep(500);
      expect(await realService.wrap(key, fetch)).toBe('v1');
      await sleep(50);
      // The failed refresh is logged via onBackgroundRefreshError, not rethrown, and the old value
      // stays until its original TTL runs out
      expect(await realService.wrap(key, fetch)).toBe('v1');
    });
  });

  // The wrapMany tests above use a hand-written stand-in for `wrap`. These run against the real
  // cache-manager memory store, so they cover what a stubbed `wrap` cannot: that a stored null is
  // really treated as a hit, and that a key `wrap` asks for outside the prefetch is handled.
  describe('wrapMany against the real memory store', () => {
    const PREFIX = CACHE_PREFIX.SEGMENT_KEY_PREFIX;
    const loadEach = () => jest.fn().mockImplementation(async (ids: string[]) => ids.map((id) => ({ id })));

    beforeEach(() => {
      mockedEnv.caching.enabled = true;
    });

    afterEach(() => {
      mockedEnv.caching.enabled = false;
      mockedEnv.caching.refreshThreshold = 0;
    });

    // The payoff, end to end. Every key here is written by one wrapMany call, which is exactly the
    // shape that used to come due in a single instant: 20 flag rows written together, then 20
    // background refreshes firing at the same moment every interval on every instance.
    it('gives keys written in one batch staggered expiries', async () => {
      mockedEnv.caching.refreshThreshold = 30; // 30s interval against the 90s segments TTL
      const realService = new CacheService();
      const keys = Array.from({ length: 20 }, (_key, i) => `k${i}`);

      await realService.wrapMany(PREFIX, keys, loadEach());
      const remaining = await Promise.all(keys.map((key) => realService.getRemainingTtl(PREFIX + key)));

      // 25% of the 30s interval -> a 15s window around the 90s TTL, and the draws spread across it
      expect(Math.min(...remaining)).toBeGreaterThan(82000);
      expect(Math.max(...remaining)).toBeLessThanOrEqual(97500);
      expect(new Set(remaining).size).toBeGreaterThan(15);
      expect(Math.max(...remaining) - Math.min(...remaining)).toBeGreaterThan(5000);
    });

    it('loads every cold key in a single query', async () => {
      const realService = new CacheService();
      const loadByKeys = loadEach();

      const result = await realService.wrapMany(PREFIX, ['a', 'b', 'c'], loadByKeys);

      expect(loadByKeys).toHaveBeenCalledTimes(1);
      expect(loadByKeys).toHaveBeenCalledWith(['a', 'b', 'c']);
      expect(result).toEqual([{ id: 'a' }, { id: 'b' }, { id: 'c' }]);
    });

    it('re-reads only the evicted key and serves its neighbours from cache', async () => {
      const realService = new CacheService();
      const loadByKeys = loadEach();

      await realService.wrapMany(PREFIX, ['a', 'b', 'c'], loadByKeys);
      await realService.delCache(PREFIX + 'b');
      const result = await realService.wrapMany(PREFIX, ['a', 'b', 'c'], loadByKeys);

      expect(loadByKeys).toHaveBeenCalledTimes(2);
      expect(loadByKeys).toHaveBeenNthCalledWith(2, ['b']);
      expect(result).toEqual([{ id: 'a' }, { id: 'b' }, { id: 'c' }]);
    });

    it('stops re-querying a key that has no row', async () => {
      const realService = new CacheService();
      // 'b' has no row. The batch used to re-query every key on every request because of it, which
      // is the 100%-miss-forever behaviour this replaced.
      const loadByKeys = jest
        .fn()
        .mockImplementation(async (ids: string[]) => ids.map((id) => (id === 'b' ? undefined : { id })));

      for (let call = 0; call < 3; call++) {
        expect(await realService.wrapMany(PREFIX, ['a', 'b'], loadByKeys)).toEqual([{ id: 'a' }, null]);
      }

      expect(loadByKeys).toHaveBeenCalledTimes(1);
    });

    // The prefetch decides what to load before `wrap` runs, so it cannot cover a key `wrap` is about
    // to refresh — that key was still cached when the prefetch looked. This is the fallback branch,
    // and it is the one place a mistake would write a wrong value into the cache rather than merely
    // cost a query.
    describe('a key the prefetch did not cover', () => {
      const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

      // Interval kept small relative to the TTL so the jitter cannot race the sleep below: TTL 2000ms
      // +/-62ms, threshold 1750ms, so refresh is due in 187-312ms and expiry is no earlier than 1937ms.
      beforeEach(() => {
        mockedEnv.caching.ttlSegments = 2; // 2s hard expiry
        mockedEnv.caching.refreshThreshold = 0.25; // refresh once an entry is ~250ms old
      });

      afterEach(() => {
        mockedEnv.caching.ttlSegments = 90;
        mockedEnv.caching.refreshThreshold = 0;
      });

      it('refreshes each stale key on its own and caches the refreshed value', async () => {
        const realService = new CacheService();
        // Counting per key rather than globally, so the assertions do not depend on which key's
        // background refresh happens to fire first
        const loadsPerKey = new Map<string, number>();
        const loadByKeys = jest.fn().mockImplementation(async (ids: string[]) =>
          ids.map((id) => {
            const load = (loadsPerKey.get(id) ?? 0) + 1;
            loadsPerKey.set(id, load);
            return { id, load };
          })
        );

        expect(await realService.wrapMany(PREFIX, ['a', 'b'], loadByKeys)).toEqual([
          { id: 'a', load: 1 },
          { id: 'b', load: 1 },
        ]);
        expect(loadByKeys).toHaveBeenCalledTimes(1);

        // Past the refresh line. Both keys are still cached, so the prefetch skips them and `wrap`
        // serves each immediately while refreshing it through the fallback — one key at a time.
        await sleep(500);
        expect(await realService.wrapMany(PREFIX, ['a', 'b'], loadByKeys)).toEqual([
          { id: 'a', load: 1 },
          { id: 'b', load: 1 },
        ]);
        expect(loadByKeys).toHaveBeenCalledWith(['a']);
        expect(loadByKeys).toHaveBeenCalledWith(['b']);

        // The refreshed values landed in the cache. A fallback that resolved to undefined instead
        // would surface here as a null, or as another source read.
        await sleep(50);
        expect(await realService.wrapMany(PREFIX, ['a', 'b'], loadByKeys)).toEqual([
          { id: 'a', load: 2 },
          { id: 'b', load: 2 },
        ]);
        expect(loadByKeys).toHaveBeenCalledTimes(3); // one batch of two, then one per key
      });
    });

    // Pinning down the known cost of prefetching before `wrap`, so nobody later assumes the
    // coalescing inside `wrap` covers it. Two callers that both find the batch cold both run the
    // prefetch, because each decides what is missing before either has written anything back.
    // Bounded and brief in practice — it only lasts as long as the first query — but it is real.
    it('has both concurrent cold callers run their own prefetch, then converge', async () => {
      const realService = new CacheService();
      const firstLoad = loadEach();
      const secondLoad = loadEach();

      const [firstResult, secondResult] = await Promise.all([
        realService.wrapMany(PREFIX, ['a', 'b'], firstLoad),
        realService.wrapMany(PREFIX, ['a', 'b'], secondLoad),
      ]);

      expect(firstLoad).toHaveBeenCalledWith(['a', 'b']);
      expect(secondLoad).toHaveBeenCalledWith(['a', 'b']);
      // ...but they agree, and the key is only written once, so later reads are served from cache
      expect(secondResult).toEqual(firstResult);

      const third = loadEach();
      expect(await realService.wrapMany(PREFIX, ['a', 'b'], third)).toEqual(firstResult);
      expect(third).not.toHaveBeenCalled();
    });
  });
});
