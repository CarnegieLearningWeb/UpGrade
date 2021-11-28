import { UpgradeLogger } from './lib/logger/UpgradeLogger';
import { env } from './env';

if (env.isProduction) {
  // tslint:disable-next-line: no-var-requires
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

/*
 * EXPRESS TYPESCRIPT BOILERPLATE
 * ----------------------------------------
 */

bootstrapMicroframework({
  loaders: [winstonLoader, iocLoader, typeormLoader, expressLoader, swaggerLoader, homeLoader, publicLoader],
})
  .then(() => {
    const logger = new UpgradeLogger();
    // logging data after the winston is configured
    logger.info({detail: 'Server starting at ' + Date.now()});
    return CreateSystemUser();
  })
  .then(() => {
    // enable metric filtering
    return enableMetricFiltering();
  })
  .then(() => {
    // metric initalization
    return InitMetrics();
  });

