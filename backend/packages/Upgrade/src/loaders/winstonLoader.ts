import { MicroframeworkLoader, MicroframeworkSettings } from 'microframework';
import { configure, format, transports } from 'winston';
// import { v4 as uuidv4 } from "uuid";
import { env } from '../env';

import SplunkStreamEvent from 'winston-splunk-httplogger';

const splunkSettings = {
  host : 'prd-p-er3fp.splunkcloud.com',
  token : '0eb04d30-5e39-4832-a7fa-ff353adc8794',
  index : 'ppl_upgrade',

};

export const winstonLoader: MicroframeworkLoader = (settings: MicroframeworkSettings | undefined) => {
  
  // Define the payload to send to HTTP Event Collector
  var payload_json = {
    // Message can be anything, it doesn't have to be an object
    message: {
        temperature: "70F",
        chickenCount: 500
    },
    // Metadata is optional
    metadata: {
        source: "chicken coop",
        sourcetype: "httpevent",
        // index: "main",
        // host: "farm.local"
    },
    // Severity is also optional
    severity: "pratik"
  };

  configure({
    transports: [
      new transports.Console({
        level: env.log.level,
        handleExceptions: true,
        format:
          env.node !== 'development'
            ? format.combine(format.json())
            : format.combine(format.colorize(), format.simple()),
      }),
      // new SplunkStreamEvent({splunk: splunkSettings,
      //   level: 'pratik'
      // })
      new SplunkStreamEvent({ splunk: splunkSettings, payload: payload_json })
    ],
  });
};
