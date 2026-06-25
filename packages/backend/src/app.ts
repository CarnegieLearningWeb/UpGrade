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
import { CreateSystemUsers } from './init/seed/systemUser';
import { enableMetricFiltering } from './init/seed/EnableMetricFiltering';
import { InitMetrics } from './init/seed/initMetrics';
import { banner } from './lib/banner';
import { createGlobalExcludeSegment } from './init/seed/globalExcludeSegment';
import { backfillPrecomputedSegments } from './init/seed/backfillPrecomputedSegments';

/*
 * EXPRESS TYPESCRIPT BOILERPLATE
 * ----------------------------------------
 */
const logger = new UpgradeLogger();
bootstrapMicroframework({
  loaders: [winstonLoader, iocLoader, typeormLoader, expressLoader, swaggerLoader, homeLoader, publicLoader],
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
    return backfillPrecomputedSegments(logger);
  });
