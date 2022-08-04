import { Middleware, ExpressMiddlewareInterface } from 'routing-controllers';
import * as express from 'express';
import { json } from 'body-parser';

@Middleware({ type: 'before' })
export class BodyParserMiddleware implements ExpressMiddlewareInterface {
  public use(req: express.Request, res: express.Response, next: express.NextFunction): any {
    return json({ limit: '5mb' })(req as any, res as any, next);
  }
}
