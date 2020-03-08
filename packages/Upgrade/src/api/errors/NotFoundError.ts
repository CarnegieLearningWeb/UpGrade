import { HttpError } from 'routing-controllers';

export class NotFoundError extends HttpError {
  constructor(type: string) {
    super(404, type + ' not found!');
  }
}
