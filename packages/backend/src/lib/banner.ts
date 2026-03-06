import { env } from '../env';
import { UpgradeLogger } from './logger/UpgradeLogger';

export function banner(log: UpgradeLogger): void {
  if (env.app.banner) {
    const route = () => `${env.app.schema}://${env.app.host}:${env.app.port}`;
    log.info({ message: `Aloha, your app is ready on ${route()}${env.app.routePrefix}` });
    log.info({ message: `To shut it down, press <CTRL> + C at any time.` });
    log.info({ message: `Environment  : ${env.node}` });
    log.info({ message: `Version      : ${env.app.version}` });
    log.info({ message: `API Info     : ${route()}${env.app.routePrefix}` });
    if (env.swagger.enabled) {
      log.info({ message: `Swagger      : ${route()}${env.swagger.route}` });
    }
    // if (env.monitor.enabled) {
    //   log.info(`Monitor      : ${route()}${env.monitor.route}`);
    // }
  } else {
    log.info({ message: `Application is up and running.` });
  }
}
