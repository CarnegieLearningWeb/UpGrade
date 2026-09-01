/* eslint-disable @typescript-eslint/no-namespace */
import express from 'express';
import morgan from 'morgan';
import { ExpressMiddlewareInterface, Middleware } from 'routing-controllers';
import { UpgradeLogger } from '../../lib/logger/UpgradeLogger';
import { addCustomAttribute } from '../../lib/newrelic';

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
    // add request id in the header
    const headerName = 'x-request-id';
    const oldValue: string = req.get('headerName');
    const id = oldValue === undefined ? crypto.randomUUID() : oldValue;
    res.set(headerName, id);

    // the context the clientlib was configured for, sent on every client request.
    // Older clientlibs don't send it, so report those as 'unknown' rather than dropping the field.
    const clientContext = req.get('Client-Context') || 'unknown';
    const clientVersion = req.get('Client-Version') || 'unknown';

    // child logger creation
    const logger = new UpgradeLogger();
    logger.child({
      request_id: id,
      endpoint: req.url,
      request_method_type: req.method,
      client_context: clientContext,
      client_version: clientVersion,
    });
    req.logger = logger;

    // makes `clientContext`/`clientVersion` available as FACETs on New Relic transactions
    addCustomAttribute('clientContext', clientContext);
    addCustomAttribute('clientVersion', clientVersion);

    return morgan(this.jsonFormat, {
      stream: {
        write: (text: string) => {
          logger.info(JSON.parse(text));
        },
      },
    })(req, res, next);
  }
}
