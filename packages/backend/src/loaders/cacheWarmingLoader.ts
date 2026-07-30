import { MicroframeworkLoader, MicroframeworkSettings } from 'microframework';
import { Container } from 'typedi';
import { CacheWarmingService } from '../api/services/CacheWarmingService';
import { UpgradeLogger } from '../lib/logger/UpgradeLogger';

/**
 * Starts the per-instance cache-warming job. A loader rather than a step in app.ts's promise chain
 * specifically so the interval can be torn down via settings.onShutdown.
 *
 * Self-disables when CACHING_ENABLED is false or CACHE_WARMING_INTERVAL_MINUTES is 0/unset, so it
 * is inert unless deliberately turned on.
 */
export const cacheWarmingLoader: MicroframeworkLoader = (settings: MicroframeworkSettings | undefined) => {
  const logger = new UpgradeLogger();
  const cacheWarmingService = Container.get(CacheWarmingService);

  cacheWarmingService.start(logger);

  if (settings) {
    settings.onShutdown(() => cacheWarmingService.stop());
  }
};
