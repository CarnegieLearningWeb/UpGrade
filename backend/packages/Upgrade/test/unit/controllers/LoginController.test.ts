import app from '../../utils/expressApp';
import request from 'supertest';
import { configureLogger } from '../../utils/logger';
import { useContainer as routingUseContainer } from 'routing-controllers';
import { Container } from 'typedi';
import { UserService } from '../../../src/api/services/UserService';
import { useContainer as classValidatorUseContainer } from 'class-validator';
import { useContainer as ormUseContainer } from 'typeorm';
import UserServiceMock from './mocks/UserServiceMock';

describe('Login Controller Testing', () => {
  beforeAll(() => {
    configureLogger();
    routingUseContainer(Container);
    ormUseContainer(Container);
    classValidatorUseContainer(Container);

    Container.set(UserService, new UserServiceMock());
  });

  afterAll(() => {
    Container.reset();
  });

  test('Post request for /api/login/user when user exists', async (done) => {
    await request(app)
      .post('/api/login/user')
      .send({
        id: 'string',
        email: 'string',
        firstName: 'string',
        lastName: 'string',
        imageUrl: 'string',
        role: 'string',
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
    done();
  });

  test('Post request for /api/login/user when user does not exist', async (done) => {
    await request(app)
      .post('/api/login/user')
      .send({
        id: 'string',
        email: 'string',
        firstName: 'string',
        lastName: 'string',
        imageUrl: 'string',
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
    done();
  });
});
