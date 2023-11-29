import { UpgradeLogger } from './lib/logger/UpgradeLogger';
import { env } from './env';

if (env.isProduction && !env?.app.demo) {
  require('newrelic/index');
}

import 'reflect-metadata';

import { bootstrapMicroframework } from 'microframework';
import { expressLoader } from './loaders/expressLoader';
import { winstonLoader } from './loaders/winstonLoader';
import { homeLoader } from './loaders/homeLoader';
import { publicLoader } from './loaders/publicLoader';
import { iocLoader } from './loaders/iocLoader';
import { typeormLoader } from './loaders/typeormLoader';
import { swaggerLoader } from './loaders/swaggerLoader';
import { CreateSystemUser } from './init/seed/systemUser';
import { enableMetricFiltering } from './init/seed/EnableMetricFiltering';
import { InitMetrics } from './init/seed/initMetrics';
import { banner } from './lib/banner';
import { createGlobalExcludeSegment } from './init/seed/globalExcludeSegment';

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
    return CreateSystemUser();
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
  });
