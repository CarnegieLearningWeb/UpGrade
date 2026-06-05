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

  constructor() {
    if (env.caching.enabled) {
      this.initializeCache();
    }
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
    if (value === null || value === undefined) {
      return null;
    }
    await this.cache.set(id, value);
    return value;
  }

  public getCache<T>(id: string): Promise<T | undefined> {
    return this.cache.get(id);
  }

  public delCache(id: string): Promise<void> {
    return this.cache.del(id);
  }

  public async resetPrefixCache(prefix: string): Promise<void> {
    const keys = await this.cache.store.keys();
    const filteredKeys = keys.filter((str) => str.startsWith(prefix));
    if (filteredKeys.length > 0) {
      return this.cache.store.mdel(...filteredKeys);
    }
  }

  public resetAllCache(): Promise<void> {
    return this.cache.store.reset();
  }

  public getKeys(): Promise<string[]> {
    return this.cache.store.keys();
  }

  public wrap<T>(key: string, fn: () => Promise<T>): Promise<T> {
    return this.cache.wrap(key, fn);
  }

  public async wrapFunction<T>(prefix: CACHE_PREFIX, keys: string[], functionToCall: () => Promise<T[]>): Promise<T[]> {
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
        }, [])
      );
    }

    return data;
  }
}
