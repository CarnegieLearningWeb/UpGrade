import { Middleware, ExpressMiddlewareInterface } from 'routing-controllers';
import * as express from 'express';
import compression from 'compression';

@Middleware({ type: 'before' })
export class CompressionMiddleware implements ExpressMiddlewareInterface {
  public use(req: express.Request, res: express.Response, next: express.NextFunction): any {
    return compression()(req, res, next);
  }
}
