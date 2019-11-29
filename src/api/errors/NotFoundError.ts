import { HttpError } from 'routing-controllers';

export class NotFoundError extends HttpError {
  constructor(type: string) {
    super(404, 'Experiment not found!');
  }
}
