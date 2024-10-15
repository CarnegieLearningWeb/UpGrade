import 'reflect-metadata';

// Global mocks for authorizationChecker
jest.mock('../../../src/auth/authorizationChecker', () => ({
  authorizationChecker: () => async () => true,
}));
