import { Action } from 'routing-controllers';
import { Container } from 'typedi';
import { Connection } from 'typeorm';

import { Logger } from '../lib/logger';
import { AuthService } from './AuthService';

export function authorizationChecker(
  connection: Connection
): (action: Action, roles: any[]) => Promise<boolean> | boolean {
  const log = new Logger(__filename);
  const authService = Container.get<AuthService>(AuthService);

  return async function innerAuthorizationChecker(action: Action, roles: string[]): Promise<boolean> {
    // here you can use request/response objects from action
    // also if decorator defines roles it needs to access the action
    // you can use them to provide granular access check
    // checker must return either boolean (true or false)
    // either promise that resolves a boolean value
    const token = authService.parseBasicAuthFromRequest(action.request);

    if (token === undefined) {
      log.warn('No token provided');
      return false;
    }
    try {
      const userDoc = await authService.validateUser(token);
      action.request.user = userDoc;
      return true;
    } catch (error) {
      return false;
    }
  };
}
