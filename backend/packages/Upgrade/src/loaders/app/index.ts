import { Application } from 'express';
import { createExpressServer } from 'routing-controllers';
import { env } from '../../env';
import { authorizationChecker } from '../../auth/authorizationChecker';
import { currentUserChecker } from '../../auth/currentUserChecker';

const expressApp: Application = createExpressServer({
  cors: true,
  classTransformer: true,
  validation: { validationError: { target: false , value: false }},
  // validation: { whitelist: true, forbidNonWhitelisted: true, validationError: { target: false, value: false } },
  defaultErrorHandler: false,
  routePrefix: env.app.routePrefix,
  controllers: env.app.dirs.controllers,
  middlewares: env.app.dirs.middlewares,
  interceptors: env.app.dirs.interceptors,

  /**
   * Authorization features
   */
  authorizationChecker: authorizationChecker(),
  currentUserChecker,
});

export default expressApp;
