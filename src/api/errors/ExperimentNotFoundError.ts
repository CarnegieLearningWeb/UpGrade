import { NotFoundError } from './NotFoundError';

export class ExperimentNotFoundError extends NotFoundError {
  constructor() {
    super('Experiment');
  }
}
