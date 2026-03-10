import { NotFoundError } from './NotFoundError';

export class UserNotFoundError extends NotFoundError {
  constructor() {
    super('User');
  }
}
