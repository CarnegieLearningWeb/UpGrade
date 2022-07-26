import { Service } from "typedi";

var cacheMemory = require("cache-manager")
var memoryCache = cacheMemory.caching({store: 'memory', max: 100 , ttl: 100/*seconds*/});

@Service()
export class CacheService {
  public async setCache(id: string, value: any): Promise<void> {
    await memoryCache.set(id,value);
  }

  public async getCache(id: string): Promise<any> {
    return await memoryCache.get(id);
  }

  public async delCache(id: string): Promise<void> {
    await memoryCache.del(id);
  }
}