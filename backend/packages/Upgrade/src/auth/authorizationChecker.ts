import { Action } from 'routing-controllers';
import { Container } from 'typedi';
import { AuthService } from './AuthService';
import { UpgradeLogger } from '../lib/logger/UpgradeLogger';

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
      log.warn({ message: 'No token provided' });
      return false;
    }
    try {
      const userDoc = await authService.validateUser(token, action.request);
      log.info({ message: `User document in database ${JSON.stringify(userDoc, null, 2)}` });
      action.request.user = userDoc;
      return true;
    } catch (error) {
      return false;
    }
  };
}
