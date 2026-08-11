import { env } from '../../env';
import { Service } from 'typedi';
import { Cache, Store, caching } from 'cache-manager';
import { CACHE_PREFIX } from 'upgrade_types';
import { UpgradeLogger } from '../../lib/logger/UpgradeLogger';

type CacheBucket = 'experiments' | 'featureFlags' | 'segments' | 'settings';

const PREFIX_CATEGORY: Record<CACHE_PREFIX, CacheBucket> = {
  [CACHE_PREFIX.EXPERIMENT_KEY_PREFIX]: 'experiments',
  [CACHE_PREFIX.MARK_KEY_PREFIX]: 'experiments',
  [CACHE_PREFIX.FEATURE_FLAG_KEY_PREFIX]: 'featureFlags',
  [CACHE_PREFIX.SEGMENT_KEY_PREFIX]: 'segments',
  [CACHE_PREFIX.GLOBAL_EXCLUDE_SEGMENT_KEY_PREFIX]: 'segments',
  [CACHE_PREFIX.FEATURE_FLAG_PRECOMPUTED_SEGMENT_KEY_PREFIX]: 'featureFlags',
  [CACHE_PREFIX.EXPERIMENT_PRECOMPUTED_SEGMENT_KEY_PREFIX]: 'experiments',
  [CACHE_PREFIX.SETTING_KEY_PREFIX]: 'settings',
};

// this module will get swapped in if caching is enabled but the cache manager fails to initialize as a dummy default deliverer
const noopStore: Cache<Store> = {
  get: () => Promise.resolve(undefined),
  set: () => Promise.resolve(),
  del: () => Promise.resolve(),
  reset: () => Promise.resolve(),
  on: () => {
    // noop
  },
  removeListener: () => {
    // noop
  },
  wrap: (_key, fn) => fn(),
  store: {
    get: () => Promise.resolve(undefined),
    set: () => Promise.resolve(),
    del: () => Promise.resolve(),
    reset: () => Promise.resolve(),
    mget: () => Promise.resolve([]),
    mset: () => Promise.resolve(),
    mdel: () => Promise.resolve(),
    keys: () => Promise.resolve([]),
    ttl: () => Promise.resolve(0),
  },
};

@Service()
export class CacheService {
  private cache: Cache<Store> = noopStore;
  private defaultTtl = env.caching.ttl || 900;
  // Per-category TTLs (seconds), each falling back to the global default when its env var is unset.
  private categoryTtl: Record<CacheBucket, number> = {
    experiments: env.caching.ttlExperiments || this.defaultTtl,
    featureFlags: env.caching.ttlFeatureFlags || this.defaultTtl,
    segments: env.caching.ttlSegments || this.defaultTtl,
    settings: env.caching.ttlSettings || this.defaultTtl,
  };
  // How often (seconds) a `wrap` key is re-read from source while it keeps getting traffic. Once an
  // entry reaches this age, the next hit returns the cached value immediately and refreshes the
  // entry in the background, so no request pays for the refill. This — not the TTL — is what bounds
  // staleness; the TTL is only the hard expiry for a key that stops being read. 0 (the default)
  // disables background refresh, leaving plain TTL expiry.
  private refreshThreshold = env.caching.refreshThreshold || 0;
  private initPromise: Promise<void>;

  constructor() {
    this.initPromise = env.caching.enabled ? this.initializeCache() : Promise.resolve();
  }

  private async initializeCache() {
    try {
      this.cache = await caching('memory', {
        max: env.caching?.maxKeys || 500,
        ttl: this.defaultTtl * 1000,
        // A background refresh has no caller to return a rejection to. Without this hook
        // cache-manager rethrows from inside its own catch, which surfaces as an unhandled
        // rejection instead of a log line; the stale-but-served value is unaffected either way.
        onBackgroundRefreshError: (err) =>
          new UpgradeLogger().error({ message: 'CacheService background refresh failed', error: err }),
      });
    } catch (err) {
      new UpgradeLogger().error({
        message: 'CacheService failed to initialize — caching is enabled but cache is unavailable',
        error: err,
      });
    }
  }

  // Resolve the TTL (ms) for a category based on the cache-key prefix.
  private ttlMsForPrefix(prefix: CACHE_PREFIX): number {
    const category = PREFIX_CATEGORY[prefix];
    const ttlSeconds = category ? this.categoryTtl[category] : this.defaultTtl;
    return ttlSeconds * 1000;
  }

  // Resolve the TTL (ms) for a full cache key by matching its prefix.
  private ttlMsForKey(key: string): number {
    const prefix = Object.values(CACHE_PREFIX).find((p) => key.startsWith(p));
    return prefix ? this.ttlMsForPrefix(prefix as CACHE_PREFIX) : this.defaultTtl * 1000;
  }

  public async setCache<T>(id: string, value: T): Promise<T> {
    await this.initPromise;
    if (value === null || value === undefined) {
      return null;
    }
    await this.cache.set(id, value, this.ttlMsForKey(id));
    return value;
  }

  public async getCache<T>(id: string): Promise<T | undefined> {
    await this.initPromise;
    return this.cache.get(id);
  }

  public async delCache(id: string): Promise<void> {
    await this.initPromise;
    return this.cache.del(id);
  }

  public async resetPrefixCache(prefix: string): Promise<void> {
    await this.initPromise;
    const keys = await this.cache.store.keys();
    const filteredKeys = keys.filter((str) => str.startsWith(prefix));
    if (filteredKeys.length > 0) {
      return this.cache.store.mdel(...filteredKeys);
    }
  }

  public async resetAllCache(): Promise<void> {
    await this.initPromise;
    return this.cache.store.reset();
  }

  public async getKeys(): Promise<string[]> {
    await this.initPromise;
    return this.cache.store.keys();
  }

  /** Milliseconds until `id` expires. Null when the store cannot say, or the key is gone. */
  public async getRemainingTtl(id: string): Promise<number | null> {
    await this.initPromise;
    try {
      const remaining = await this.cache.store.ttl(id);
      return typeof remaining === 'number' ? remaining : null;
    } catch {
      return null;
    }
  }

  /** Which TTL bucket a prefix falls in — the report groups by this, since one TTL covers several prefixes. */
  public bucketForPrefix(prefix: CACHE_PREFIX): CacheBucket | null {
    return PREFIX_CATEGORY[prefix] ?? null;
  }

  /**
   * The cache knobs this process resolved at boot. `available` is the one that is not simply an echo
   * of the environment: caching can be enabled and still be a no-op store if initialization failed,
   * and a report of 0 keys means something very different in that case.
   */
  public getConfig() {
    return {
      enabled: !!env.caching.enabled,
      available: this.cache !== noopStore,
      maxKeys: env.caching?.maxKeys || 500,
      refreshThresholdSeconds: this.refreshThreshold,
      ttlSeconds: { default: this.defaultTtl, ...this.categoryTtl },
    };
  }

  // This deliberately allows an interval far shorter than the TTL (e.g. refresh every 45s on a
  // 1-hour TTL): the TTL then only decides how long a value survives once traffic stops, and has no
  // say in freshness. An interval at or above the TTL means the TTL already expires first, so there
  // is nothing to refresh ahead of — 0 leaves plain TTL expiry for that bucket.
  private refreshThresholdMsForTtl(ttlMs: number): number {
    if (!this.refreshThreshold) {
      return 0;
    }
    return Math.max(0, ttlMs - this.refreshThreshold * 1000);
  }

  public async wrap<T>(key: string, fn: () => Promise<T>): Promise<T> {
    await this.initPromise;
    const ttlMs = this.ttlMsForKey(key);
    return this.cache.wrap(key, fn, ttlMs, this.refreshThresholdMsForTtl(ttlMs));
  }

  public async wrapFunction<T>(prefix: CACHE_PREFIX, keys: string[], functionToCall: () => Promise<T[]>): Promise<T[]> {
    await this.initPromise;
    if (!keys.length) {
      return [];
    }

    const keysWithPrefix = keys.map((key) => prefix + key);
    const cachedData = (await this.cache.store.mget(...keysWithPrefix)) as (T | undefined)[];

    const allCachedFound = cachedData.length > 0 && cachedData.every((cached) => !!cached);
    if (allCachedFound) {
      return cachedData as T[];
    }

    const data = await functionToCall();

    if (data.length > 0) {
      await this.cache.store.mset(
        keys.reduce((acc, key, index) => {
          if (data[index] != null) {
            acc.push([prefix + key, data[index]]);
          }
          return acc;
        }, []),
        this.ttlMsForPrefix(prefix)
      );
    }

    return data;
  }
}
