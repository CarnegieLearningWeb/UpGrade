import { Action } from 'routing-controllers';
import { User } from '../api/models/User';

export function currentUserChecker(action: Action): Promise<User> {
  // here you can use request/response objects from action
  // you need to provide a user object that will be injected in controller actions
  // demo code:
  console.log('action.request.user', action.request.user);
  return action.request.user;
}
