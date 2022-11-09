/* eslint-disable @typescript-eslint/no-namespace */
import express from 'express';
import morgan from 'morgan';
import { ExpressMiddlewareInterface, Middleware } from 'routing-controllers';
import { UpgradeLogger } from '../../lib/logger/UpgradeLogger';
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
      remote_address: tokens['remote-addr'](req, res),
      time: tokens['date'](req, res, 'iso'),
      'total-time': tokens['total-time'](req, res),
      method: tokens['method'](req, res),
      url: tokens['url'](req, res),
      http_version: tokens['http-version'](req, res),
      status_code: tokens['status'](req, res),
      content_length: tokens['res'](req, res, 'content-length'),
      referrer: tokens['referrer'](req, res),
      user_agent: tokens['user-agent'](req, res),
    });
  }
  public use(req: express.Request, res: express.Response, next: express.NextFunction): any {
    // child logger creation
    const logger = new UpgradeLogger();
    logger.child({
      http_request_id: uuid(),
      endpoint: req.url,
      request_method_type: req.method,
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
