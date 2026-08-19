import { Service } from 'typedi';
import { InjectRepository } from '../../typeorm-typedi-extensions';
import { SettingRepository } from '../repositories/SettingRepository';
import { Setting } from '../models/Setting';
import { UpgradeLogger } from '../../lib/logger/UpgradeLogger';
import { CacheService } from './CacheService';
import { CACHE_PREFIX } from 'upgrade_types';

// The settings row is global — one row, no per-entity key.
const SETTING_CACHE_KEY = CACHE_PREFIX.SETTING_KEY_PREFIX + 'clientCheck';

@Service()
export class SettingService {
  constructor(@InjectRepository() private settingRepository: SettingRepository, private cacheService: CacheService) {}

  public async setClientCheck(
    checkAuth: boolean | null,
    filterMetric: boolean | null,
    logger: UpgradeLogger
  ): Promise<Setting> {
    logger.info({ message: `Update project setting: checkAuth ${checkAuth}, filterMetric ${filterMetric}` });
    const [settingDoc] = await this.settingRepository.find();
    const newDoc = {
      ...settingDoc,
      toCheckAuth: checkAuth === undefined ? (settingDoc && settingDoc.toCheckAuth) || false : checkAuth,
      toFilterMetric: filterMetric === undefined ? (settingDoc && settingDoc.toFilterMetric) || false : filterMetric,
    };
    const saved = await this.settingRepository.save(newDoc);
    // Invalidate after the write lands so the next read cannot repopulate the cache from stale state.
    await this.cacheService.delCache(SETTING_CACHE_KEY);
    return saved;
  }

  /**
   * Reads the global client-check settings.
   *
   * Cached because this sits on the hot path of every client request: ClientLibMiddleware calls it on
   * every v6 endpoint, so a 7-call user journey paid seven round trips for two booleans. The query
   * itself is trivial (a 1-row seq scan, ~0.005ms server-side) — the cost was the round trip and the
   * connection-pool checkout, both of which the cache removes entirely.
   *
   * Invalidated by setClientCheck. The TTL is the backstop for multi-instance deployments, where a
   * write served by one instance does not invalidate the others' caches.
   *
   * The cached value is a shared reference — callers must treat it as read-only.
   */
  public async getClientCheck(logger?: UpgradeLogger): Promise<Setting> {
    if (logger) {
      logger.info({ message: 'Get project setting' });
    }
    return this.cacheService.wrap(SETTING_CACHE_KEY, async () => {
      const setting = await this.settingRepository.find();
      if (setting.length === 0) {
        const defaultSetting = new Setting();
        defaultSetting.toCheckAuth = false;
        defaultSetting.toFilterMetric = false;
        return defaultSetting;
      }
      return setting[0];
    });
  }
}
