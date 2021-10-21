import { MicroframeworkLoader, MicroframeworkSettings } from 'microframework';
import { configure, format, transports } from 'winston';
import { env } from '../env';

import { SplunkLogger } from '../lib/logger/SplunkLogger';
import SplunkStreamEvent from 'winston-splunk-httplogger';

export const winstonLoader: MicroframeworkLoader = (settings: MicroframeworkSettings | undefined) => {

  configure({
    transports: [
      new transports.Console({
        level: env.log.level,
        handleExceptions: true,
        format:
          env.node !== 'development'
            ? format.combine(format.json())
            : format.combine(format.simple()),
      }),
      new SplunkStreamEvent({ splunk: SplunkLogger.splunkSettings })
    ],
  });
};
