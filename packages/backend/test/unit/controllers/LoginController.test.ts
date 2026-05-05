import app from '../../utils/expressApp';
import request from 'supertest';
import { configureLogger } from '../../utils/logger';
import { useContainer as routingUseContainer } from 'routing-controllers';
import { Container } from 'typedi';
import { UserService } from '../../../src/api/services/UserService';
import { useContainer as classValidatorUseContainer } from 'class-validator';
import UserServiceMock from './mocks/UserServiceMock';
import { env } from '../../../src/env';
import { DEV_USER_EMAIL } from '../../../src/auth/auth.constants';

const mockDevUser = {
  email: DEV_USER_EMAIL,
  firstName: 'Dev',
  lastName: 'User',
  role: 'admin',
  imageUrl: 'https://example.com/image.png',
};

describe('Login Controller Testing', () => {
  beforeAll(() => {
    configureLogger();
    routingUseContainer(Container);
    classValidatorUseContainer(Container);

    Container.set(UserService, new UserServiceMock());
  });

  afterAll(() => {
    Container.reset();
  });

  test('Post request for /api/login/user when user exists', () => {
    return request(app)
      .post('/api/login/user')
      .send({
        email: 'string@email.com',
        firstName: 'string',
        lastName: 'string',
        imageUrl: 'https://image.com',
        role: 'reader',
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
  });

  test('Post request for /api/login/user when user does not exist', () => {
    return request(app)
      .post('/api/login/user')
      .send({
        email: 'string@email.com',
        firstName: 'string',
        lastName: 'string',
        imageUrl: 'https://image.com',
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
  });

  describe('GET /api/login/check-auth', () => {
    test('returns googleAuthRequired: true when auth token is required', () => {
      (env.google as any).authTokenRequired = true;

      return request(app)
        .get('/api/login/check-auth')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .then((response) => {
          expect(response.body.googleAuthRequired).toBe(true);
          expect(response.body.devUser).toBeUndefined();
        });
    });

    test('returns googleAuthRequired: false with devUser when auth is disabled', async () => {
      (env.google as any).authTokenRequired = false;
      const mockUserService = Container.get(UserService);
      jest.spyOn(mockUserService, 'getUserByEmail').mockResolvedValueOnce([mockDevUser] as any);

      const response = await request(app)
        .get('/api/login/check-auth')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.googleAuthRequired).toBe(false);
      expect(response.body.devUser).toMatchObject({ email: DEV_USER_EMAIL });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });
  });
});
