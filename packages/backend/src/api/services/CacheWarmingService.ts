import { Service } from 'typedi';
import { env } from '../../env';
import { UpgradeLogger } from '../../lib/logger/UpgradeLogger';
import { ExperimentService } from './ExperimentService';
import { FeatureFlagService } from './FeatureFlagService';
import { FeatureFlagPrecomputedSegmentService } from './FeatureFlagPrecomputedSegmentService';
import { SegmentService } from './SegmentService';

/**
 * Periodically re-reads the queries behind /assign and /getKeys and force-writes the results into
 * this instance's cache.
 *
 * Without this, the caches are warmed only by user traffic, which leaves three gaps: cold caches
 * after a deploy or scale-out, latency spikes when a TTL expires, and drift between instances
 * (an admin write invalidates only the instance that served it — the others stay stale until
 * their own TTL lapses).
 *
 * This has to run in-process on every instance, because the cache is process-local memory: an
 * externally triggered job hitting a load-balanced endpoint would warm one random instance. The
 * upside is that, unlike the other scheduled jobs here, it needs no leader election or locking —
 * every instance independently refreshing its own cache is the desired behavior.
 *
 * Write-path invalidation stays as it is. It gives the writing instance immediate correctness;
 * this job's role is to converge the others within one interval.
 */
@Service()
export class CacheWarmingService {
  private timer: NodeJS.Timeout | undefined;
  private ticking = false;

  constructor(
    private experimentService: ExperimentService,
    private featureFlagService: FeatureFlagService,
    private featureFlagPrecomputedSegmentService: FeatureFlagPrecomputedSegmentService,
    private segmentService: SegmentService
  ) {}

  public start(logger: UpgradeLogger): void {
    const intervalMinutes = env.caching.warmingIntervalMinutes;

    if (!env.caching.enabled) {
      logger.info({ message: 'Cache warming: disabled (CACHING_ENABLED is false)' });
      return;
    }
    if (!intervalMinutes || intervalMinutes <= 0) {
      logger.info({ message: 'Cache warming: disabled (CACHE_WARMING_INTERVAL_MINUTES is 0 or unset)' });
      return;
    }

    const intervalMs = intervalMinutes * 60 * 1000;

    // Stagger the first tick so instances don't all hit the database on the same second.
    const jitterMs = Math.floor(Math.random() * Math.min(intervalMs, 60 * 1000));

    logger.info({
      message: `Cache warming: enabled, every ${intervalMinutes} minute(s), first tick in ${Math.round(
        jitterMs / 1000
      )}s`,
    });

    this.timer = setTimeout(() => {
      void this.tick(logger);
      this.timer = setInterval(() => void this.tick(logger), intervalMs);
      this.timer.unref();
    }, jitterMs);
    this.timer.unref();
  }

  public stop(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  private async tick(logger: UpgradeLogger): Promise<void> {
    // A tick that outruns its interval must not stack on top of itself.
    if (this.ticking) {
      logger.warn({ message: 'Cache warming: previous tick still running, skipping this one' });
      return;
    }
    this.ticking = true;

    const startedAt = Date.now();
    let refreshedKeys = 0;
    let failures = 0;

    // Each entry is refreshed independently. On failure we log and move on, deliberately leaving
    // the existing (stale) value in place — deleting it would turn one database blip into every
    // instance stampeding the same query at once.
    const run = async (label: string, work: () => Promise<number>): Promise<void> => {
      try {
        refreshedKeys += await work();
      } catch (err) {
        failures++;
        logger.error({ message: `Cache warming: failed to refresh ${label}, leaving existing value: ${err}` });
      }
    };

    try {
      // Contexts come from CONTEXT_METADATA, not the database. Contexts with no experiments or
      // flags are warmed anyway — they can start receiving traffic at any time, and caching their
      // empty result is what keeps that first request from paying for a miss.
      const contexts = Object.keys(env.initialization.contextMetadata ?? {});

      for (const context of contexts) {
        await run(`experiments:${context}`, async () => {
          await this.experimentService.refreshCachedValidExperiments(context);
          return 1;
        });

        await run(`globalExcludeSegment:${context}`, async () => {
          await this.segmentService.refreshGlobalExcludeSegmentByContext(context);
          return 1;
        });

        await run(`flags:${context}`, async () => {
          await this.featureFlagService.refreshCachedFlagsFromContext(context);
          return 1;
        });

        // Refreshing the flag keys hands back the fresh flag IDs, so the precomputed segment rows
        // are warmed for the flag set we just read rather than a possibly stale one. Kept in one
        // unit so a failed key refresh skips the precomputed rows instead of warming them blind.
        await run(`flagKeys+precomputedSegments:${context}`, async () => {
          const flagIds = await this.featureFlagService.refreshCachedFlagsForKeys(context);
          await this.featureFlagPrecomputedSegmentService.refreshPrecomputedSets(flagIds);
          return 1 + flagIds.length;
        });
      }

      logger.info({
        message: `Cache warming: refreshed ${refreshedKeys} key(s) across ${contexts.length} context(s) in ${
          Date.now() - startedAt
        }ms, ${failures} failure(s)`,
      });
    } finally {
      // Must always clear, or one unexpected throw wedges the job for the life of the process.
      this.ticking = false;
    }
  }
}
