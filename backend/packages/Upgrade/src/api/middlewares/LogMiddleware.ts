import express from 'express';
import morgan from 'morgan';
import { ExpressMiddlewareInterface, Middleware } from 'routing-controllers';
import { SplunkLogger } from '../../lib/logger/SplunkLogger';
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
    const logger = new SplunkLogger();
    logger.child({
      http_request_id: uuid(),
      endpoint: req.url,
      client_session_id: null,
      api_request_type: null,
      filename: __filename,
      function_name: 'use',
      testingLocal: true,
    });
    req.logger = logger;

    return morgan(this.jsonFormat, {
      stream: {
        write: (text: string) => {
          logger.info(JSON.parse(text));
        },
      },
    })(req, res, next);
  }
}
