// import { SplunkLogger } from './../../lib/logger/SplunkLogger';
import express from 'express';
import morgan from 'morgan';
import { ExpressMiddlewareInterface, Middleware } from 'routing-controllers';
import * as winston from 'winston';
import uuid from 'uuid';
declare global {
  namespace Express {
    interface Request {
      logger: any;
    }
  }
}

@Middleware({ type: 'before' })
export class LogMiddleware implements ExpressMiddlewareInterface {
  // private log = new Logger(__dirname);
  jsonFormat(tokens, req, res) {
    return JSON.stringify({
      'remote-address': tokens['remote-addr'](req, res),
      time: tokens['date'](req, res, 'iso'),
      method: tokens['method'](req, res),
      url: tokens['url'](req, res),
      'http-version': tokens['http-version'](req, res),
      'status-code': tokens['status'](req, res),
      'content-length': tokens['res'](req, res, 'content-length'),
      referrer: tokens['referrer'](req, res),
      'user-agent': tokens['user-agent'](req, res),
    });
  }
  public use(req: express.Request, res: express.Response, next: express.NextFunction): any {
    //childlogger creation
    // TODO Need to use SplunkLogger Here
    const logger = winston.info({
      http_request_id: uuid(),
      endpoint: req.url,
      client_session_id: null,
      api_request_type: null,
      filename: __filename,
      function_name: 'use',
      testingLocal: true
    });
    // logger = logger.child({ http_request_id: uuid(), endpoint: req.url, client_session_id: null, api_request_type: null, filename: __filename, function_name: "use"});
    // logger.info({ stdout: 'In the log middleware', stack_trace: null });
    // logger.info('In log middleware:' + Date.now(), SplunkLogger.payload_json);
    // adding logger instance to the request to pass it to all other requests:
    req.logger = logger;
    // console.log("req: ", req);

    return morgan(this.jsonFormat, {
      stream: {
        write: logger.info.bind(logger),
      },
    })(req, res, next);
  }
}
