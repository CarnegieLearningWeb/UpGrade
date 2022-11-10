import SplunkStreamEvent from 'winston-splunk-httplogger';
import { MicroframeworkLoader } from 'microframework';
import { configure, format, transports } from 'winston';
import { env } from '../env';
import TransportStream from 'winston-transport';

export const winstonLoader: MicroframeworkLoader = () => {
  const transportConfig: TransportStream[] = [];

  const formatter =
    env.node !== 'development'
      ? format.combine(format.json())
      : format.combine(format.timestamp(), format.json(), format.prettyPrint({ colorize: true }));

  // push console stream
  transportConfig.push(
    new transports.Console({
      level: env.log.level,
      handleExceptions: true,
      format: formatter,
    })
  );

  // push splunk stream
  if (env.splunk.host && env.splunk.token && env.splunk.index) {
    transportConfig.push(
      new SplunkStreamEvent({
        splunk: {
          host: env.splunk.host,
          token: env.splunk.token,
          index: env.splunk.index,
          eventFormatter: (message) => {
            const { meta } = message;
            return { ...meta };
          },
        },
        format: formatter,
      })
    );
  }

  configure({
    transports: transportConfig,
  });
};
