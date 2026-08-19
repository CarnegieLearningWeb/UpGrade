import { SettingService } from '../../../src/api/services/SettingService';
import { Repository } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SettingRepository } from '../../../src/api/repositories/SettingRepository';
import { Setting } from '../../../src/api/models/Setting';
import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';
import { configureLogger } from '../../utils/logger';
import { CacheService } from '../../../src/api/services/CacheService';

const setting = new Setting();
const settingArr = [setting];
const logger = new UpgradeLogger();

describe('Setting Service Testing', () => {
  let service: SettingService;
  let repo: Repository<SettingRepository>;
  let module: TestingModule;
  let cache: Map<string, unknown>;
  let cacheService: { wrap: jest.Mock; delCache: jest.Mock };

  beforeAll(() => {
    configureLogger();
  });

  beforeEach(async () => {
    // Minimal stand-in for the real cache so the wrap/invalidate contract is exercised rather than
    // stubbed away — a no-op mock would let a missing delCache in setClientCheck pass unnoticed.
    cache = new Map();
    cacheService = {
      wrap: jest.fn(async (key: string, fn: () => Promise<unknown>) => {
        if (!cache.has(key)) {
          cache.set(key, await fn());
        }
        return cache.get(key);
      }),
      delCache: jest.fn(async (key: string) => {
        cache.delete(key);
      }),
    };

    module = await Test.createTestingModule({
      providers: [
        SettingService,
        SettingRepository,
        {
          provide: getRepositoryToken(SettingRepository),
          useValue: {
            findOne: jest.fn().mockResolvedValue(setting),
            save: jest.fn().mockResolvedValue(setting),
            find: jest.fn().mockResolvedValue(settingArr),
          },
        },
        { provide: CacheService, useValue: cacheService },
      ],
    }).compile();

    service = module.get<SettingService>(SettingService);
    repo = module.get<Repository<SettingRepository>>(getRepositoryToken(SettingRepository));
  });

  it('should be defined', async () => {
    expect(service).toBeDefined();
  });

  it('should have the repo mocked', async () => {
    expect(await repo.find()).toEqual(settingArr);
  });

  it('should return a setting', async () => {
    const flags = await service.setClientCheck(false, true, logger);
    expect(flags).toEqual(setting);
  });

  it('should return a setting', async () => {
    const flags = await service.setClientCheck(undefined, undefined, logger);
    expect(flags).toEqual(setting);
  });

  it('should return a setting', async () => {
    const flags = await service.getClientCheck(logger);
    expect(flags).toEqual(setting);
  });

  it('should return a setting without logger', async () => {
    const flags = await service.getClientCheck(null);
    expect(flags).toEqual(setting);
  });

  it('should return a setting when no setting found', async () => {
    repo.find = jest.fn().mockReturnValue([]);
    const setting = await service.getClientCheck(logger);
    const defaultSetting = new Setting();
    defaultSetting.toCheckAuth = false;
    defaultSetting.toFilterMetric = false;
    expect(setting).toEqual(defaultSetting);
  });

  describe('getClientCheck caching', () => {
    it('should hit the repository once across repeated reads', async () => {
      await service.getClientCheck(logger);
      await service.getClientCheck(logger);
      await service.getClientCheck(logger);

      expect(repo.find).toHaveBeenCalledTimes(1);
    });

    it('should re-read from the repository after setClientCheck invalidates', async () => {
      await service.getClientCheck(logger);
      expect(repo.find).toHaveBeenCalledTimes(1);

      await service.setClientCheck(true, true, logger);
      expect(cacheService.delCache).toHaveBeenCalled();

      // setClientCheck itself reads once; the point is that the *next* read is not served stale.
      const callsAfterWrite = (repo.find as jest.Mock).mock.calls.length;
      await service.getClientCheck(logger);
      expect((repo.find as jest.Mock).mock.calls.length).toBe(callsAfterWrite + 1);
    });

    it('should not serve a stale value once the cache is invalidated', async () => {
      const before = await service.getClientCheck(logger);
      expect(before.toCheckAuth).toBeFalsy();

      const updated = new Setting();
      updated.toCheckAuth = true;
      repo.find = jest.fn().mockResolvedValue([updated]);

      // Still cached, so the old value is expected here.
      expect((await service.getClientCheck(logger)).toCheckAuth).toBeFalsy();

      await service.setClientCheck(true, false, logger);

      expect((await service.getClientCheck(logger)).toCheckAuth).toBe(true);
    });
  });
});
