import { env } from './../../env';
import { Service } from 'typedi';
import cacheManager from 'cache-manager';
import { redisStore, RedisCache } from 'cache-manager-ioredis-yet';
import { CACHE_PREFIX } from 'upgrade_types';

async function createMemoryCache() {
  const store = 'memory';
  return cacheManager.caching({ store, ttl: 900 });
}

async function createNoCache() {
  const store = 'none';
  return cacheManager.caching({ store, ttl: 900 });
}

async function createRedisCache() {
  const redisCache: RedisCache = cacheManager.caching({
    store: await redisStore({
      host: env.caching.redisHost,
      port: env.caching.redisPort,
      password: env.caching.redisPassword,
    }),
    ttl: 900,
  }) as any; // TODO: After updating the version of cache manager remove any

  // Add event listener for connection to redis
  const redisClient = redisCache.store.client;
  redisClient.on('error', (err) => {
    console.error('Redis error: ', err);
  });

  return redisCache;
}

async function createCache() {
  let cache: cacheManager.Cache | RedisCache;
  if (env.caching.enabled) {
    if (env.caching.redisHost && env.caching.redisPort) {
      cache = await createRedisCache();
    } else {
      cache = await createMemoryCache();
    }
  } else {
    cache = await createNoCache();
  }
  return cache;
}

@Service()
export class CacheService {
  private cache: cacheManager.Cache | RedisCache;
  constructor() {
    this.init();
  }

  private async init() {
    this.cache = await createCache();
  }

  public setCache<T>(id: string, value: T): Promise<T> {
    return this.cache ? this.cache.set(id, value) : Promise.resolve(null);
  }

  public getCache<T>(id: string): Promise<T> {
    return this.cache ? this.cache.get(id) : Promise.resolve(null);
  }

  public delCache(id: string): Promise<void> {
    return this.cache ? this.cache.del(id) : Promise.resolve();
  }

  public async resetPrefixCache(prefix: string): Promise<void> {
    const keys = this.cache ? await this.cache.store.keys() : [];
    const filteredKeys = keys.filter((str) => str.startsWith(prefix));
    if (filteredKeys && filteredKeys.length > 0) {
      this.cache.store.del(filteredKeys);
    }
  }

  // Use this to wrap the function that you want to cache
  public async wrap<T>(key: string, fn: () => Promise<T>): Promise<T> {
    // TODO redis cache manager is not working properly
    // try wrap function after updating the cache manager to latest manger
    // return this.cache ? this.cache.wrap(key, fn) : fn();

    // TODO: Remove this after implementation of above TODO
    const cachedData = await (this.cache ? this.cache.get(key) : Promise.resolve(null));
    // if cached data return cached data
    if (cachedData) {
      return cachedData;
    }
    // Execute function and set cache
    const data = await fn();
    this.cache && (await this.cache.set(key, data));
    return data;
  }

  public async wrapFunction<T>(prefix: CACHE_PREFIX, keys: string[], functionToCall: () => Promise<T[]>): Promise<T[]> {
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
