import { env } from '../../env';
import { Service } from 'typedi';
import { Cache, Store, caching } from 'cache-manager';
import { CACHE_PREFIX } from 'upgrade_types';
import { UpgradeLogger } from '../../lib/logger/UpgradeLogger';

type CacheBucket = 'experiments' | 'featureFlags' | 'segments' | 'settings';

const PREFIX_CATEGORY: Record<CACHE_PREFIX, CacheBucket> = {
  [CACHE_PREFIX.EXPERIMENT_KEY_PREFIX]: 'experiments',
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
  // Fraction of the refresh interval that an entry's TTL is randomly spread by. See jitteredTtlMs.
  private static readonly REFRESH_JITTER = 0.25;
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
    if (this.cache !== noopStore) {
      this.warnOnBucketsWithoutRefresh();
    }
  }

  /**
   * A refresh interval at or above a bucket's TTL leaves that bucket on plain expiry — the interval
   * silently does nothing for it, because there is no window left to refresh ahead of. Nothing about
   * the config looks wrong when this happens (both numbers are ones somebody chose on purpose), and
   * the only symptom is keys that periodically vanish instead of staying warm, so say it at boot.
   */
  private warnOnBucketsWithoutRefresh(): void {
    if (!this.refreshThreshold) {
      return;
    }
    const buckets = Object.keys(this.categoryTtl) as CacheBucket[];
    const withoutRefresh = buckets.filter(
      (bucket) => this.refreshThresholdMsForTtl(this.categoryTtl[bucket] * 1000) === 0
    );
    if (withoutRefresh.length) {
      new UpgradeLogger().warn({
        message:
          `CacheService: background refresh is effectively DISABLED for [${withoutRefresh.join(
            ', '
          )}] — each of those TTLs is ` +
          `at or below the ${this.refreshThreshold}s refresh interval, so those keys hard-expire and reload cold ` +
          `instead of refreshing. Raise the TTL well above the interval to enable it.`,
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
      refreshJitterFraction: CacheService.REFRESH_JITTER,
      // Buckets where the interval is at or above the TTL get no background refresh at all. Reported
      // rather than merely logged at boot, so a cache dump answers "is refresh actually on for this?"
      bucketsWithoutRefresh: (Object.keys(this.categoryTtl) as CacheBucket[]).filter(
        (bucket) => this.refreshThreshold > 0 && this.refreshThresholdMsForTtl(this.categoryTtl[bucket] * 1000) === 0
      ),
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

  /**
   * Spread the TTL a little per entry, so keys written together do not all come due together.
   *
   * Every key a single request populates otherwise carries an identical TTL and reaches its refresh
   * point in the same instant. No one request waits on any single background refresh, but the whole
   * wave lands at once and competes with live traffic for DB connections, which shows up as latency
   * rising across the board every refresh interval.
   *
   * This must be applied at *write* time, not per read: cache-manager stores the resolved TTL with the
   * entry, so every later reader agrees on when that key is due. A value recomputed per request would
   * be useless under load — with many requests per second, one of them draws the low end of the range
   * almost immediately and fires the refresh, collapsing the whole range to its minimum.
   *
   * Scaled to the refresh interval rather than to the TTL, because the spread in *staleness* is what
   * matters and it equals the absolute jitter: ±25% of a 60s interval moves the refresh point into
   * 45-75s whether the TTL is 5 minutes or an hour. Scaling to the TTL instead would make a long TTL
   * swing the refresh point wildly.
   */
  private jitteredTtlMs(ttlMs: number): number {
    if (!this.refreshThreshold) {
      return ttlMs;
    }
    // Clamped to the TTL as well, so a bucket whose interval exceeds its TTL (refresh already off for
    // it) still gets its hard expiry spread out, without the interval distorting a short TTL.
    const spread = Math.min(this.refreshThreshold * 1000, ttlMs) * CacheService.REFRESH_JITTER;
    return Math.round(ttlMs + (Math.random() * 2 - 1) * spread);
  }

  public async wrap<T>(key: string, fn: () => Promise<T>): Promise<T> {
    await this.initPromise;
    const ttlMs = this.ttlMsForKey(key);
    // The threshold stays fixed at the base TTL's value; the jitter rides on the stored TTL, so the
    // refresh point moves per entry without the threshold itself having to vary.
    return this.cache.wrap(key, fn, () => this.jitteredTtlMs(ttlMs), this.refreshThresholdMsForTtl(ttlMs));
  }

  /**
   * Cache-Manager doesn't have a built-in batch loading mechanism,
   * The previous implementation tried to emulate it, unfortunately it had major issues that were
   * made worse now that we want to lean on "cache.wrap" for proper efficient background refresh
   *
   * 1) did not actually use "cache.wrap", so no background refresh managed by cache-manager internally
   * 2) it treated a single missing key as a complete batch miss, which could lead to unnecessary source lookups for keys that were actually cached
   * 3) keys that were missing after source lookup were never noted, so subsequent lookups would repeatedly query the source unnecessarily
   *
   * Two step process to process a batch of keys efficiently:
   * 1. first read what is already cached
   * 2. then lookup the missing keys from the source FIRST before wrapping each key individually so we can batch this part
   * 3. then we "wrap" each key individually so that we can get the background refresh / TTL behavior per key (so an individual key lookup per refresh needed)
   * (the previous "wrapFunction" did not actualy use it)
   *
   * Note: `loadByKeys` function provided by caller describes *how* to fetch or refresh keys from the source,
   * and must return results index-aligned with the keys it was handed, using null/undefined for keys that have no value.
   */
  public async wrapMany<T>(
    prefix: CACHE_PREFIX,
    keys: string[],
    loadByKeys: (keysToLoad: string[]) => Promise<(T | null | undefined)[]>
  ): Promise<(T | null)[]> {
    await this.initPromise;
    if (!keys.length) {
      return [];
    }

    const ttlMs = this.ttlMsForPrefix(prefix);
    const refreshThresholdMs = this.refreshThresholdMsForTtl(ttlMs);

    // read all the cached keys
    const cached = await this.cache.store.mget(...keys.map((key) => prefix + key));

    // find keys that are not in the cache (null means we previously loaded and found nothing, undefined means missing)
    const missingKeys = keys.filter((_key, index) => cached[index] === undefined);

    // if there are missing keys, load them from the source
    const loadedMissingKeys = missingKeys.length ? await loadByKeys(missingKeys) : [];
    const loadedMissingKeysMap = new Map<string, T | null>();

    // populate the loadedMissingKeysMap map with the results from the source, using null for any missing rows
    missingKeys.forEach((key, index) => loadedMissingKeysMap.set(key, loadedMissingKeys[index] ?? null));

    // write to the cache
    // 1. If the key was already fetch by the missing keys load, return that value.
    // 2. If not, that means it was already cached, so the .wrap call can be used to refresh it if necessary.
    return Promise.all(
      // for each key, either return the cached value or fetch it if it was not preloaded
      keys.map((key) =>
        this.cache.wrap<T | null>(
          prefix + key,
          async () => {
            // 1. if the key was among the missing keys we just loaded, return the loaded value directly
            if (loadedMissingKeysMap.has(key)) {
              return loadedMissingKeysMap.get(key);
            }

            // 2. if the key was in the cache already, this is how it will be fetched IF it needs to be refreshed.
            // Note that this is passed to the "wrap" function and will only be called if refreshThreshold or ttl is exceeded.
            const [row] = await loadByKeys([key]);

            // we will now cache nulls to indicate that the key was confirmed by db to not exist
            // this null key value gets the same treatment as any other cached value, including TTL and refresh threshold.
            // so things we looked up and confirmed nothing found will not repeatedly be treated as a cache-miss
            return row ?? null;
          },
          // jittered per entry, so a batch written together does not refresh together — see jitteredTtlMs
          () => this.jitteredTtlMs(ttlMs),
          refreshThresholdMs
        )
      )
    );
  }
}
