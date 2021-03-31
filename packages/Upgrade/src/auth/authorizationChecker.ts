import { Action } from 'routing-controllers';
import { Container } from 'typedi';

import { Logger } from '../lib/logger';
import { AuthService } from './AuthService';
import { env } from '../env';

export function authorizationChecker(): (action: Action, roles: any[]) => Promise<boolean> | boolean {
  const log = new Logger(__filename);

  return async function innerAuthorizationChecker(action: Action, roles: string[]): Promise<boolean> {
    // here you can use request/response objects from action
    // also if decorator defines roles it needs to access the action
    // you can use them to provide granular access check
    // checker must return either boolean (true or false)
    // either promise that resolves a boolean value

    // for testing don't check authorization
    if (env.isTest) {
      return true;
    }

    const authService = Container.get<AuthService>(AuthService);
    const token = authService.parseBasicAuthFromRequest(action.request);
    log.info(`Token found ${token}`);
    if (token === undefined) {
      log.warn('No token provided');
      return env.auth.authCheck ? false : true;
    }
    try {
      const userDoc = await authService.validateUser(token);
      log.info(`User document in database ${JSON.stringify(userDoc, null, 2)}`);
      action.request.user = userDoc;
      return true;
    } catch (error) {
      return env.auth.authCheck ? false : true;
    }
  };
}
