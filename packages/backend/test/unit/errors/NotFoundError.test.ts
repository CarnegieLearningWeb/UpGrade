import { NotFoundError } from 'routing-controllers';

describe('NotFoundError Testing', () => {
  it('instantiates NotFoundError with all properties', () => {
    const error = new NotFoundError('Type');
    expect(error.message).toBe('Type'); // Test if super call worked
    expect(error.httpCode).toBe(404);
  });
});
