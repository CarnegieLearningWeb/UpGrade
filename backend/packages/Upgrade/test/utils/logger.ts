import { configure, transports, format } from 'winston';
import { env } from '../../src/env';

export const configureLogger = () => {
  configure({
    transports: [
      new transports.Console({
        level: env.log.level,
        handleExceptions: true,
        format: format.combine(format.json(), format.prettyPrint({ colorize: true })),
      }),
    ],
  });
};
