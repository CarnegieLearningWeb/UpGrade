import { UserNotFoundError } from '../../../src/api/errors/UserNotFoundError';

describe('UserNotFoundError Error Testing', () => {
  it('instantiates UserNotFoundError with all properties', () => {
    const error = new UserNotFoundError();
    expect(error.message).toBe('User not found!'); // Test if super call worked
    expect(error.httpCode).toBe(404);
  });
});
