import { env } from './env';

if (env.isProduction) {
  // tslint:disable-next-line: no-var-requires
  require('newrelic/index');
}

import 'reflect-metadata';

import { bootstrapMicroframework } from 'microframework';
import { expressLoader } from './loaders/expressLoader';
// import { banner } from './lib/banner';
// import { Logger } from './lib/logger/Logger';
import { winstonLoader } from './loaders/winstonLoader';
import { homeLoader } from './loaders/homeLoader';
import { publicLoader } from './loaders/publicLoader';
import { iocLoader } from './loaders/iocLoader';
import { typeormLoader } from './loaders/typeormLoader';
import { swaggerLoader } from './loaders/swaggerLoader';
import { CreateSystemUser } from './init/seed/systemUser';
import { enableMetricFiltering } from './init/seed/EnableMetricFiltering';
import winston, { format, transports } from 'winston';
import SplunkStreamEvent from 'winston-splunk-httplogger';
import { SplunkLogger } from './lib/logger/SplunkLogger';


let logger = winston.createLogger({
  transports: [
    new transports.Console({
      level: env.log.level,
      handleExceptions: true,
      format:
        env.node !== 'development'
          ? format.combine(format.json())
          : format.combine(format.colorize(), format.simple()),
    }),
    new SplunkStreamEvent({ splunk: SplunkLogger.splunkSettings})
  ]
});

/*
 * EXPRESS TYPESCRIPT BOILERPLATE
 * ----------------------------------------
 */

// const log = new Logger(__filename);

bootstrapMicroframework({
  loaders: [winstonLoader, iocLoader, typeormLoader, expressLoader, swaggerLoader, homeLoader, publicLoader],
})
  .then(() => {
    // logger = logger.child({requestId: '1'});
    // logging data after the winston is configured
    logger.info('Server starting at ' + Date.now());
    return CreateSystemUser();
  })
  .then(() => {
    // enable metric filtering
    return enableMetricFiltering();
  })
  .then(() => {
    // banner(childLogger);
  });
