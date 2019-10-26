import { HttpError } from 'routing-controllers';

export class ExperimentNotFoundError extends HttpError {
  constructor() {
    super(404, 'Experiment not found!');
  }
}
