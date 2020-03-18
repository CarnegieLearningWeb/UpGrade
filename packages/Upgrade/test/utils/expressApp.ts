import { createExpressServer } from 'routing-controllers';
import { env } from '../../src/env';
import { Application } from 'express';

const app: Application = createExpressServer({
  cors: true,
  classTransformer: true,
  routePrefix: env.app.routePrefix,
  defaultErrorHandler: false,
  controllers: env.app.dirs.controllers,
  middlewares: env.app.dirs.middlewares,
});

export default app;
