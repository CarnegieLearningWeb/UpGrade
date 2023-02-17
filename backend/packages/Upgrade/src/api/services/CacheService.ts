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
    return this.memoryCache.set(id, value);
  }

  public getCache<T>(id: string): Promise<T> {
    return this.memoryCache.get(id);
  }

  public delCache<T>(id: string): Promise<T> {
    return this.memoryCache.del(id);
  }

  public resetCache(): void {
    this.memoryCache.reset();
  }

  public async wrapFunction<T>(keys: string[], functionToCall: () => Promise<T[]>): Promise<T[]> {
    const cachedData = await Promise.all(
      keys.map(async (key) => {
        return this.getCache<T>(key);
      })
    );

    const allCachedFound = cachedData.every((cached) => cached);
    if (allCachedFound) {
      return cachedData;
    }

    const data = await functionToCall();

    await Promise.all(
      keys.map((key, index) => {
        return this.setCache(key, data[index]);
      })
    );
    return data;
  }
}
