import { HttpError } from 'routing-controllers';

export class UnprocessableEntityError extends HttpError {
  constructor(message: string) {
    super(422, message);
  }
}
