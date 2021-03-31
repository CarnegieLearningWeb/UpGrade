import { Application } from 'express';
import { MicroframeworkLoader, MicroframeworkSettings } from 'microframework';
import { env } from '../env';
import app from './app';

export const expressLoader: MicroframeworkLoader = (settings: MicroframeworkSettings | undefined) => {
  if (settings) {
    const expressApp: Application = app;

    // Run application to listen on given port
    if (!env.isTest) {
      const server = expressApp.listen(env.app.port);
      settings.setData('express_server', server);
    }

    // Here we can set the data for other loaders
    settings.setData('express_app', expressApp);
  }
};
