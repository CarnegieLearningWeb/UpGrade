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
  let mockStore: {
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
    mockStore = {
      get: jest.fn().mockResolvedValue(undefined),
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
    (service as any).cache = mockStore;
  });

  describe('setCache', () => {
    it('returns null and skips set when value is null', async () => {
      const result = await service.setCache('key', null);
      expect(result).toBeNull();
      expect(mockStore.set).not.toHaveBeenCalled();
    });

    it('returns null and skips set when value is undefined', async () => {
      const result = await service.setCache('key', undefined as unknown as string);
      expect(result).toBeNull();
      expect(mockStore.set).not.toHaveBeenCalled();
    });

    it('stores the value and returns it', async () => {
      const value = { id: 'test' };
      const result = await service.setCache('key', value);
      expect(mockStore.set).toHaveBeenCalledWith('key', value);
      expect(result).toBe(value);
    });
  });

  describe('getCache', () => {
    it('returns the cached value', async () => {
      const value = { id: 'test' };
      mockStore.get.mockResolvedValue(value);
      const result = await service.getCache('key');
      expect(result).toBe(value);
      expect(mockStore.get).toHaveBeenCalledWith('key');
    });

    it('returns undefined for an uncached key', async () => {
      const result = await service.getCache('missing');
      expect(result).toBeUndefined();
    });
  });

  describe('delCache', () => {
    it('calls del on the store with the given key', async () => {
      await service.delCache('key');
      expect(mockStore.del).toHaveBeenCalledWith('key');
    });
  });

  describe('resetPrefixCache', () => {
    it('deletes only keys that match the given prefix', async () => {
      mockStore.store.keys.mockResolvedValue(['segments-a', 'segments-b', 'featureFlags-x']);
      await service.resetPrefixCache('segments-');
      expect(mockStore.store.mdel).toHaveBeenCalledWith('segments-a', 'segments-b');
    });

    it('does not call mdel when no keys match the prefix', async () => {
      mockStore.store.keys.mockResolvedValue(['featureFlags-x']);
      await service.resetPrefixCache('segments-');
      expect(mockStore.store.mdel).not.toHaveBeenCalled();
    });
  });

  describe('resetAllCache', () => {
    it('calls reset on the store', async () => {
      await service.resetAllCache();
      expect(mockStore.store.reset).toHaveBeenCalled();
    });
  });

  describe('wrap', () => {
    it('delegates to the store wrap and returns the fn result', async () => {
      const fn = jest.fn().mockResolvedValue('result');
      mockStore.wrap.mockImplementation((_key, fn) => fn());
      const result = await service.wrap('key', fn);
      expect(result).toBe('result');
      expect(fn).toHaveBeenCalled();
    });

    it('returns a cached value without calling fn when the store has one', async () => {
      const fn = jest.fn();
      mockStore.wrap.mockResolvedValue('cached');
      const result = await service.wrap('key', fn);
      expect(result).toBe('cached');
      expect(fn).not.toHaveBeenCalled();
    });
  });

  describe('wrapMany', () => {
    const PREFIX = CACHE_PREFIX.SEGMENT_KEY_PREFIX;

    it('returns empty array immediately without hitting the store when keys is empty', async () => {
      const fetchFn = jest.fn();
      const result = await service.wrapMany(PREFIX, [], fetchFn);
      expect(result).toEqual([]);
      expect(mockStore.store.mget).not.toHaveBeenCalled();
      expect(fetchFn).not.toHaveBeenCalled();
    });

    it('returns all cached values without calling fetchFn on a full cache hit', async () => {
      const seg1 = { id: 'a' };
      const seg2 = { id: 'b' };
      mockStore.store.mget.mockResolvedValue([seg1, seg2]);
      const fetchFn = jest.fn();

      const result = await service.wrapMany(PREFIX, ['a', 'b'], fetchFn);

      expect(fetchFn).not.toHaveBeenCalled();
      expect(result).toEqual([seg1, seg2]);
    });

    it('calls fetchFn with all keys and caches results on a full cache miss', async () => {
      const seg1 = { id: 'a' };
      const seg2 = { id: 'b' };
      mockStore.store.mget.mockResolvedValue([undefined, undefined]);
      const fetchFn = jest.fn().mockResolvedValue([seg1, seg2]);

      const result = await service.wrapMany(PREFIX, ['a', 'b'], fetchFn);

      expect(fetchFn).toHaveBeenCalledWith(['a', 'b']);
      expect(mockStore.store.mset).toHaveBeenCalledWith([
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
      mockStore.store.mget.mockResolvedValue([seg1, undefined, undefined]);
      const fetchFn = jest.fn().mockResolvedValue([seg2, seg3]);

      const result = await service.wrapMany(PREFIX, ['a', 'b', 'c'], fetchFn);

      expect(fetchFn).toHaveBeenCalledWith(['b', 'c']);
      expect(mockStore.store.mset).toHaveBeenCalledWith([
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
      mockStore.store.mget.mockResolvedValue([undefined, seg2, undefined]);
      const fetchFn = jest.fn().mockResolvedValue([seg1, seg3]);

      const result = await service.wrapMany(PREFIX, ['a', 'b', 'c'], fetchFn);

      expect(fetchFn).toHaveBeenCalledWith(['a', 'c']);
      expect(result).toEqual([seg1, seg2, seg3]);
    });

    it('does not cache null or undefined values returned by fetchFn', async () => {
      const seg1 = { id: 'a' };
      mockStore.store.mget.mockResolvedValue([undefined, undefined]);
      const fetchFn = jest.fn().mockResolvedValue([seg1, undefined]);

      await service.wrapMany(PREFIX, ['a', 'b'], fetchFn);

      expect(mockStore.store.mset).toHaveBeenCalledWith([[PREFIX + 'a', seg1]]);
    });

    it('uses the prefixed key when calling mget', async () => {
      mockStore.store.mget.mockResolvedValue([undefined]);
      const fetchFn = jest.fn().mockResolvedValue([{ id: 'a' }]);

      await service.wrapMany(CACHE_PREFIX.SEGMENT_KEY_PREFIX, ['a'], fetchFn);

      expect(mockStore.store.mget).toHaveBeenCalledWith(CACHE_PREFIX.SEGMENT_KEY_PREFIX + 'a');
    });
  });
});
