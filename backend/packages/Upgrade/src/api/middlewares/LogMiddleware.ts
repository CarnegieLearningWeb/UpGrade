import express from 'express';
import morgan from 'morgan';
import { ExpressMiddlewareInterface, Middleware } from 'routing-controllers';
import uuid from 'uuid';
import winston, { format, transports } from 'winston';
import SplunkStreamEvent from 'winston-splunk-httplogger';
import { env } from '../../env';
// import { Logger } from '../../lib/logger';
import { SplunkLogger } from '../../lib/logger/SplunkLogger';

// var httpRequestId = require('express-request-id')();
// console.log("express request id: ", httpRequestId);

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
declare global {
  namespace Express {
    interface Request {
      logger: any
    }
  }
}

@Middleware({ type: 'before' })
export class LogMiddleware implements ExpressMiddlewareInterface {
  // private log = new Logger(__dirname);
  
  public use(req: express.Request, res: express.Response, next: express.NextFunction): any {
    //childlogger creation
    logger = logger.child({ http_request_id: uuid(), endpoint: req.url, client_session_id: uuid(), api_request_type: "Server Side"});
    logger.info('In log middleware:' + Date.now(), logger);
    // logger.info('In log middleware:' + Date.now(), SplunkLogger.payload_json);
    // adding logger instance to the request to pass it to all other requests:
    req.logger = logger;
    // console.log("req: ", req);

    return morgan(env.log.output, {
      stream: {
        write: logger.info.bind(logger),
      },
    })(req, res, next);
  }
}
