import { env } from './../../env';
import { Service } from 'typedi';
import { Cache, WrapTTL, caching } from 'cache-manager';

// TODO convert this into factory function and use environment variable to take cache type
@Service()
export class CacheService {
  private memoryCache: Cache;

  constructor() {
    // read from the environment variable for initializing caching
    if (env.caching.enabled) {
      this.init();
    }
  }

  private async init() {
    this.memoryCache = await caching('memory', {
      max: 100,
      ttl: 900 * 1000 /* Caching for 15 minute */,
    });
  }

  public setCache<T>(id: string, value: T): Promise<void> {
    // this.memoryCache.store.keys(prefix)
    return this.memoryCache ? this.memoryCache.set(id, value) : Promise.resolve();
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
    return await this.memoryCache.store.mdel(...filteredKeys);
  }

  public resetEntireCache(): void {
    this.memoryCache ? this.memoryCache.reset() : Promise.resolve();
  }

  // Use this to wrap the function that you want to cache
  public wrap<T>(key: string, fn: () => Promise<T>, ttl?: WrapTTL<T>): Promise<T> {
    return this.memoryCache ? this.memoryCache.wrap(key, fn, ttl) : fn();
  }

  public async wrapFunction<T>(prefix, keys: string[], functionToCall: () => Promise<T[]>): Promise<T[]> {
    const cachedData = await Promise.all(
      keys.map(async (key) => {
        return this.getCache<T>(prefix + key);
      })
    );

    const allCachedFound = cachedData.every((cached) => cached);
    if (allCachedFound) {
      return cachedData;
    }

    const data = await functionToCall();

    await Promise.all(
      keys.map((key, index) => {
        return this.setCache(prefix + key, data[index]);
      })
    );
    return data;
  }
}
