import { Application } from 'express';
import { MicroframeworkLoader, MicroframeworkSettings } from 'microframework';
import { env } from '../env';
import app from './app';
import { UpgradeLogger } from '../lib/logger/UpgradeLogger';

export const expressLoader: MicroframeworkLoader = (settings: MicroframeworkSettings | undefined) => {
  if (settings) {
    const expressApp: Application = app;
    const log = new UpgradeLogger();

    // Run application to listen on given port
    if (!env.isTest) {
      const server = expressApp.listen(env.app.port);

      // Log authorization status on startup
      if (!env.google.authTokenRequired) {
        log.warn({
          message:
            'Google user authorization is disabled, tokens will not be required for UI/administrative API calls.',
        });
      } else {
        log.info({ message: 'Google user authorization is enabled for UI/administrative API calls.' });
      }

      settings.setData('express_server', server);
    }

    // Here we can set the data for other loaders
    settings.setData('express_app', expressApp);
  }
};
