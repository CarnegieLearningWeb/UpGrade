import { CacheService } from '../../../src/api/services/CacheService';
import { CACHE_PREFIX } from 'upgrade_types';

jest.mock('../../../src/env', () => ({
  env: {
    caching: {
      enabled: false,
      ttl: 60,
      maxKeys: 500,
    },
  },
}));

describe('CacheService', () => {
  let service: CacheService;
  let mockMemoryCache: {
    get: jest.Mock;
    set: jest.Mock;
    del: jest.Mock;
    wrap: jest.Mock;
    store: {
      mget: jest.Mock;
      mset: jest.Mock;
      mdel: jest.Mock;
      keys: jest.Mock;
      reset: jest.Mock;
    };
  };

  beforeEach(() => {
    service = new CacheService();
    mockMemoryCache = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
      del: jest.fn().mockResolvedValue(undefined),
      wrap: jest.fn().mockImplementation((_key, fn) => fn()),
      store: {
        mget: jest.fn().mockResolvedValue([]),
        mset: jest.fn().mockResolvedValue(undefined),
        mdel: jest.fn().mockResolvedValue(undefined),
        keys: jest.fn().mockResolvedValue([]),
        reset: jest.fn().mockResolvedValue(undefined),
      },
    };
    (service as any).memoryCache = mockMemoryCache;
  });

  describe('wrapMany', () => {
    const PREFIX = CACHE_PREFIX.SEGMENT_KEY_PREFIX;

    it('returns empty array immediately without hitting the store when keys is empty', async () => {
      const fetchFn = jest.fn();
      const result = await service.wrapMany(PREFIX, [], fetchFn);
      expect(result).toEqual([]);
      expect(mockMemoryCache.store.mget).not.toHaveBeenCalled();
      expect(fetchFn).not.toHaveBeenCalled();
    });

    it('returns all cached values without calling fetchFn on a full cache hit', async () => {
      const seg1 = { id: 'a' };
      const seg2 = { id: 'b' };
      mockMemoryCache.store.mget.mockResolvedValue([seg1, seg2]);
      const fetchFn = jest.fn();

      const result = await service.wrapMany(PREFIX, ['a', 'b'], fetchFn);

      expect(fetchFn).not.toHaveBeenCalled();
      expect(result).toEqual([seg1, seg2]);
    });

    it('calls fetchFn with all keys and caches results on a full cache miss', async () => {
      const seg1 = { id: 'a' };
      const seg2 = { id: 'b' };
      mockMemoryCache.store.mget.mockResolvedValue([undefined, undefined]);
      const fetchFn = jest.fn().mockResolvedValue([seg1, seg2]);

      const result = await service.wrapMany(PREFIX, ['a', 'b'], fetchFn);

      expect(fetchFn).toHaveBeenCalledWith(['a', 'b']);
      expect(mockMemoryCache.store.mset).toHaveBeenCalledWith([
        [PREFIX + 'a', seg1],
        [PREFIX + 'b', seg2],
      ]);
      expect(result).toEqual([seg1, seg2]);
    });

    it('calls fetchFn with only the missing keys on a partial cache hit', async () => {
      const seg1 = { id: 'a' };
      const seg2 = { id: 'b' };
      const seg3 = { id: 'c' };
      // 'a' is cached; 'b' and 'c' are not
      mockMemoryCache.store.mget.mockResolvedValue([seg1, undefined, undefined]);
      const fetchFn = jest.fn().mockResolvedValue([seg2, seg3]);

      const result = await service.wrapMany(PREFIX, ['a', 'b', 'c'], fetchFn);

      expect(fetchFn).toHaveBeenCalledWith(['b', 'c']);
      expect(mockMemoryCache.store.mset).toHaveBeenCalledWith([
        [PREFIX + 'b', seg2],
        [PREFIX + 'c', seg3],
      ]);
      expect(result).toEqual([seg1, seg2, seg3]);
    });

    it('preserves original key ordering when cached and fetched items are interleaved', async () => {
      const seg1 = { id: 'a' };
      const seg2 = { id: 'b' };
      const seg3 = { id: 'c' };
      // 'b' is cached; 'a' and 'c' are not
      mockMemoryCache.store.mget.mockResolvedValue([undefined, seg2, undefined]);
      const fetchFn = jest.fn().mockResolvedValue([seg1, seg3]);

      const result = await service.wrapMany(PREFIX, ['a', 'b', 'c'], fetchFn);

      expect(fetchFn).toHaveBeenCalledWith(['a', 'c']);
      expect(result).toEqual([seg1, seg2, seg3]);
    });

    it('does not cache null or undefined values returned by fetchFn', async () => {
      const seg1 = { id: 'a' };
      mockMemoryCache.store.mget.mockResolvedValue([undefined, undefined]);
      const fetchFn = jest.fn().mockResolvedValue([seg1, undefined]);

      await service.wrapMany(PREFIX, ['a', 'b'], fetchFn);

      expect(mockMemoryCache.store.mset).toHaveBeenCalledWith([[PREFIX + 'a', seg1]]);
    });

    it('uses the prefixed key when calling mget', async () => {
      mockMemoryCache.store.mget.mockResolvedValue([undefined]);
      const fetchFn = jest.fn().mockResolvedValue([{ id: 'a' }]);

      await service.wrapMany(CACHE_PREFIX.SEGMENT_KEY_PREFIX, ['a'], fetchFn);

      expect(mockMemoryCache.store.mget).toHaveBeenCalledWith(CACHE_PREFIX.SEGMENT_KEY_PREFIX + 'a');
    });
  });
});
