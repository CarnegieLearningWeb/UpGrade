import { SplunkLogger } from './lib/logger/SplunkLogger';
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

/*
 * EXPRESS TYPESCRIPT BOILERPLATE
 * ----------------------------------------
 */

// const log = new Logger(__filename);

bootstrapMicroframework({
  loaders: [winstonLoader, iocLoader, typeormLoader, expressLoader, swaggerLoader, homeLoader, publicLoader],
})
  .then((data) => {
    const logger = new SplunkLogger();
    logger.info({detail: 'Hello world', from: "app"});

    logger.child({path: 'Upgrade'});
    logger.error({detail: 'Hello world Seconf', from: "app"})
    // logger = logger.child({requestId: '1'});
    // logging data after the winston is configured
    // logger.info('Server starting at ' + Date.now());
    return CreateSystemUser();
  })
  .then(() => {
    // enable metric filtering
    return enableMetricFiltering();
  })
  .then(() => {
    // banner(childLogger);
  });
