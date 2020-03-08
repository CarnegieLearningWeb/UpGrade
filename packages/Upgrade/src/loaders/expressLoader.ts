import { Application } from 'express';
import { MicroframeworkLoader, MicroframeworkSettings } from 'microframework';
import { createExpressServer } from 'routing-controllers';

import { env } from '../env';
import { authorizationChecker } from '../auth/authorizationChecker';
import { currentUserChecker } from '../auth/currentUserChecker';

export const expressLoader: MicroframeworkLoader = (settings: MicroframeworkSettings | undefined) => {
  if (settings) {
    const connection = settings.getData('connection');
    const expressApp: Application = createExpressServer({
      cors: true,
      classTransformer: true,
      defaultErrorHandler: false,
      routePrefix: env.app.routePrefix,
      controllers: env.app.dirs.controllers,
      middlewares: env.app.dirs.middlewares,
      interceptors: env.app.dirs.interceptors,

      /**
       * Authorization features
       */
      authorizationChecker: authorizationChecker(connection),
      currentUserChecker,
    });

    // Run application to listen on given port
    if (!env.isTest) {
      const server = expressApp.listen(env.app.port);
      settings.setData('express_server', server);
    }

    // Here we can set the data for other loaders
    settings.setData('express_app', expressApp);
  }
};
