import { Action } from 'routing-controllers';
import { Container } from 'typedi';
import { AuthService } from './AuthService';
import { UpgradeLogger } from '../lib/logger/UpgradeLogger';
import { env } from '../env';
import { FAKE_DEV_CREDENTIAL } from './auth.constants';

export function authorizationChecker(): (action: Action, roles: any[]) => Promise<boolean> | boolean {
  const log = new UpgradeLogger();

  return async function innerAuthorizationChecker(action: Action): Promise<boolean> {
    // here you can use request/response objects from action
    // also if decorator defines roles it needs to access the action
    // you can use them to provide granular access check
    // checker must return either boolean (true or false)
    // either promise that resolves a boolean value

    const authService = Container.get<AuthService>(AuthService);
    const token = authService.parseBasicAuthFromRequest(action.request);

    if (token === undefined) {
      if (env.google.authTokenRequired) {
        log.warn({ message: 'No token provided' });
        return false;
      }
      // No token and auth is off: attribute to system user
      action.request.user = await authService.getUserForNoAuth(null);
      return true;
    }

    // Fake dev credential: bypass Google validation, attach dev user
    if (!env.google.authTokenRequired && token === FAKE_DEV_CREDENTIAL) {
      action.request.user = await authService.getUserForNoAuth(token);
      return true;
    }

    try {
      const userDoc = await authService.validateUser(token, action.request);
      log.info({ message: `User document in database ${JSON.stringify(userDoc, null, 2)}` });
      action.request.user = userDoc;
      return true;
    } catch (error) {
      if (env.google.authTokenRequired) {
        log.error({ message: 'User validation failed', error });
        return false;
      }
      // Invalid token but auth is off: attribute to system user
      action.request.user = await authService.getUserForNoAuth(null);
      return true;
    }
  };
}
