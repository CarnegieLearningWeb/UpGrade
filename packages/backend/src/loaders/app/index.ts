import { Application } from 'express';
import { createExpressServer } from 'routing-controllers';
import { env } from '../../env';
import { authorizationChecker } from '../../auth/authorizationChecker';
import { currentUserChecker } from '../../auth/currentUserChecker';
import { CorsOptions } from 'cors';

const ourCors: CorsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (non-browser requests)
    if (!origin) {
      callback(null, true);
      return;
    }
    // Ignore the protocol, subdomains, and port
    const strippedOrigin = origin.match(
      /^(?:https?:\/\/)?(?:[^.]+\.)*(([^.]+\.[^./:]+)|localhost)(?::(\d+))?(?:\/.*)?$/
    );
    if (strippedOrigin && env.app.corsWhitelist.indexOf(strippedOrigin[1]) !== -1) {
      callback(null, true);
      return;
    }
    callback(new Error(`Request from unauthorized origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  maxAge: 86400, // 24 hours in seconds
};

const expressApp: Application = createExpressServer({
  cors: ourCors,
  classTransformer: true,
  validation: { validationError: { target: false, value: false } },
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
