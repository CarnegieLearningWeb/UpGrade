import { ExperimentNotFoundError } from '../../../src/api/errors/ExperimentNotFoundError';

describe('ExperimentNotFound Error Testing', () => {
  it('instantiates ExperimentNotFoundError with all properties', () => {
    const error = new ExperimentNotFoundError();
    expect(error.message).toBe('Experiment not found!'); // Test if super call worked
    expect(error.httpCode).toBe(404);
  });
});
