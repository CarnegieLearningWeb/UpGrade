import { env } from '../../env';
import { Service } from 'typedi';
import { Cache, Store, caching } from 'cache-manager';
import { CACHE_PREFIX } from 'upgrade_types';
import { UpgradeLogger } from '../../lib/logger/UpgradeLogger';

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
  private ttl = env.caching.ttl || 900;
  private initPromise: Promise<void>;

  constructor() {
    this.initPromise = env.caching.enabled ? this.initializeCache() : Promise.resolve();
  }

  private async initializeCache() {
    try {
      this.cache = await caching('memory', {
        max: env.caching?.maxKeys || 500,
        ttl: this.ttl * 1000,
      });
    } catch (err) {
      new UpgradeLogger().error({
        message: 'CacheService failed to initialize — caching is enabled but cache is unavailable',
        error: err,
      });
    }
  }

  public async setCache<T>(id: string, value: T): Promise<T> {
    await this.initPromise;
    if (value === null || value === undefined) {
      return null;
    }
    await this.cache.set(id, value);
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

  public async wrap<T>(key: string, fn: () => Promise<T>): Promise<T> {
    await this.initPromise;
    return this.cache.wrap(key, fn);
  }

  public async wrapMany<T>(
    prefix: CACHE_PREFIX,
    keys: string[],
    dbFetchCallback: (missingKeys: string[]) => Promise<T[]>
  ): Promise<T[]> {
    if (!keys.length) {
      return [];
    }

    // find all cached values for the keys, which will return the value, or undefined if the key is missing.
    const keysWithPrefix = keys.map((key) => prefix + key);
    const cachedData = (await this.cache.store.mget(...keysWithPrefix)) as (T | undefined)[];

    // determine which keys are missing from the cache
    const missingKeys = keys.filter((_, i) => !cachedData[i]);

    // if none are missing, we're done, return the cached data
    const allCachedFound = cachedData.length > 0 && cachedData.every((cached) => !!cached);
    if (allCachedFound) {
      return cachedData as T[];
    }

    // else, use the provided function to fetch the missing data, store it in the cache for next time, and return the combined results
    const fetchedData = await dbFetchCallback(missingKeys);

    if (fetchedData.length > 0) {
      await this.cache.store.mset(
        missingKeys.reduce((acc, key, index) => {
          if (fetchedData[index] != null) {
            acc.push([prefix + key, fetchedData[index]]);
          }
          return acc;
        }, [])
      );
    }

    const fetchedByKey = new Map<string, T>();
    missingKeys.forEach((key, i) => {
      if (fetchedData[i] != null) {
        fetchedByKey.set(key, fetchedData[i]);
      }
    });

    return keys.map((key, i) => (cachedData[i] ?? fetchedByKey.get(key)) as T);
  }
}
