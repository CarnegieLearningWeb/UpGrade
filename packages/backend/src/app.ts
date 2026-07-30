import 'reflect-metadata';
import { UpgradeLogger } from './lib/logger/UpgradeLogger';
import { env } from './env';

if (env.useNewRelic) {
  require('newrelic/index');
}

import { bootstrapMicroframework } from 'microframework';
import { expressLoader } from './loaders/expressLoader';
import { winstonLoader } from './loaders/winstonLoader';
import { homeLoader } from './loaders/homeLoader';
import { publicLoader } from './loaders/publicLoader';
import { iocLoader } from './loaders/iocLoader';
import { typeormLoader } from './loaders/typeormLoader';
import { swaggerLoader } from './loaders/swaggerLoader';
import { cacheWarmingLoader } from './loaders/cacheWarmingLoader';
import { CreateSystemUsers } from './init/seed/systemUser';
import { enableMetricFiltering } from './init/seed/EnableMetricFiltering';
import { InitMetrics } from './init/seed/initMetrics';
import { banner } from './lib/banner';
import { createGlobalExcludeSegment } from './init/seed/globalExcludeSegment';
import { backfillFeatureFlagPrecomputedSegments } from './init/seed/backfillFeatureFlagPrecomputedSegments';

/*
 * EXPRESS TYPESCRIPT BOILERPLATE
 * ----------------------------------------
 */
const logger = new UpgradeLogger();
bootstrapMicroframework({
  loaders: [
    winstonLoader,
    iocLoader,
    typeormLoader,
    expressLoader,
    swaggerLoader,
    homeLoader,
    publicLoader,
    cacheWarmingLoader,
  ],
})
  .then(() => {
    // logging data after the winston is configured
    logger.info({ detail: 'Server starting at ' + Date.now() });
    return CreateSystemUsers();
  })
  .then(() => {
    // enable metric filtering
    return enableMetricFiltering();
  })
  .then(() => {
    // metric initalization
    return InitMetrics(logger);
  })
  .then(() => {
    banner(logger);
  })
  .then(() => {
    // Create global exclude segment
    return createGlobalExcludeSegment(logger);
  })
  .then(() => {
    // Best-effort: if the feature_flag_precomputed_segment table hasn't been migrated yet (or the
    // backfill otherwise fails), log and continue instead of crashing startup with an unhandled
    // rejection. The assignment read path falls back to on-the-fly segment resolution when a
    // precomputed row — or the whole table — is unavailable, so the server stays fully functional;
    // rows self-heal on a later restart (backfill) or list mutation (recompute).
    return backfillFeatureFlagPrecomputedSegments(logger).catch((err) => {
      logger.error({
        message: `feature_flag_precomputed_segment backfill failed at startup; continuing with on-the-fly fallback: ${err}`,
      });
    });
  });
