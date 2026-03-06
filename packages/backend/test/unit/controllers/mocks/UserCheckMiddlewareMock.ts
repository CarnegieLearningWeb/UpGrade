import * as express from 'express';

export default class MockUserCheckMiddleware {
  public async use(req: express.Request, res: express.Response, next: express.NextFunction): Promise<any> {
    next();
  }
}
