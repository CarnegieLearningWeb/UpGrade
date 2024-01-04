import { env } from './../../env';
import { Service } from 'typedi';
import { MemoryCache, caching } from 'cache-manager';
import { CACHE_PREFIX } from 'upgrade_types';

@Service()
export class CacheService {
  private memoryCache: MemoryCache;
  private ttl = env.caching.ttl || 900;

  constructor() {
    // read from the environment variable for initializing caching
    if (env.caching.enabled) {
      this.initializeMemoryCache();
    }
  }

  private async initializeMemoryCache() {
    this.memoryCache = await caching('memory', {
      max: 100,
      ttl: this.ttl * 1000 /*milliseconds*/,
    });
  }

  public setCache<T>(id: string, value: T): Promise<T> {
    if (value === null || value === undefined) {
      return Promise.resolve(null);
    }
    return this.memoryCache ? this.memoryCache.set(id, value) : Promise.resolve(null);
  }

  public getCache<T>(id: string): Promise<T> {
    return this.memoryCache ? this.memoryCache.get(id) : Promise.resolve(null);
  }

  public delCache(id: string): Promise<void> {
    return this.memoryCache ? this.memoryCache.del(id) : Promise.resolve();
  }

  public async resetPrefixCache(prefix: string): Promise<void> {
    const keys = this.memoryCache ? await this.memoryCache.store.keys() : [];
    const filteredKeys = keys.filter((str) => str.startsWith(prefix));
    return this.memoryCache ? this.memoryCache.store.mdel(...filteredKeys) : null;
  }

  public async resetAllCache(): Promise<void> {
    return this.memoryCache ? this.memoryCache.store.reset() : Promise.resolve();
  }

  // Use this to wrap the function that you want to cache
  public wrap<T>(key: string, fn: () => Promise<T>): Promise<T> {
    return this.memoryCache ? this.memoryCache.wrap(key, fn) : fn();
  }

  public async wrapFunction<T>(prefix: CACHE_PREFIX, keys: string[], functionToCall: () => Promise<T[]>): Promise<T[]> {
    const cachedData = this.memoryCache ? await this.memoryCache.store.mget(...keys) : [];

    const allCachedFound = cachedData.every((cached) => !!cached);
    if (allCachedFound && env.caching.enabled) {
      return cachedData as T[];
    }

    const data = await functionToCall();

    // creata an array of array containing key and data and then set it in cache
    if (this.memoryCache) {
      await this.memoryCache.store.mset(
        keys.reduce((acc, key, index) => {
          if (data[index] !== null && data[index] !== undefined) {
            acc.push([prefix + key, data[index]]);
          }
          return acc;
        }, [])
      );
    }
    return data;
  }
}
