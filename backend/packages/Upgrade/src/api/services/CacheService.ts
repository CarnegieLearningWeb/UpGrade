import { env } from './../../env';
import { Service } from 'typedi';
import cacheManager from 'cache-manager';

@Service()
export class CacheService {
  private memoryCache: cacheManager.Cache;
  constructor() {
    // read from the environment variable for initializing caching
    let store: 'memory' | 'none';
    if (env.caching.enabled) {
      store = 'memory';
    } else {
      store = 'none';
    }
    this.memoryCache = cacheManager.caching({ store, max: 100, ttl: 900 });
  }

  public setCache<T>(id: string, value: T): Promise<T> {
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
    console.log(filteredKeys);
  }

  // Use this to wrap the function that you want to cache
  public wrap<T>(key: string, fn: () => Promise<T>): Promise<T> {
    return this.memoryCache ? this.memoryCache.wrap(key, fn) : fn();
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
