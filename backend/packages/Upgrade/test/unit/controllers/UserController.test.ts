import app from '../../utils/expressApp';
import { Container } from 'typedi';
import { configureLogger } from '../../utils/logger';
import { useContainer as routingUseContainer } from 'routing-controllers';
import request from 'supertest';
import { UserService } from '../../../src/api/services/UserService';
import UserServiceMock from './mocks/UserServiceMock';

describe('User Controller Testing', () => {
  beforeAll(() => {
    configureLogger();
    routingUseContainer(Container);

    // set mock container
    Container.set(UserService, new UserServiceMock());
  });

  afterAll(() => {
    Container.reset();
  });

  test('Post request for /api/users/paginated', () => {
    return request(app)
      .post('/api/users/paginated')
      .send({
        skip: 0,
        take: 0,
        searchParams: {
          key: 'all',
          string: 'string',
        },
        sortParams: {
          key: 'firstName',
          sortAs: 'ASC',
        },
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
  });

  test('Post request for /api/users/paginated with no params', () => {
    return request(app).post('/api/users/paginated').set('Accept', 'application/json').expect(500);
  });

  test('Get request for /api/users/:email', () => {
    return request(app)
      .get('/api/users/email@email.com')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
  });

  test('Post request for /api/users/', () => {
    return request(app)
      .post('/api/users/')
      .send({
        email: 'email@email.com',
        firstName: 'firstname',
        lastName: 'lastname',
        imageUrl: 'https://image.com',
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
  });

  test('Post request for /api/users/details', () => {
    return request(app)
      .post('/api/users/details')
      .send({
        firstName: 'firstname',
        lastName: 'lastname',
        email: 'email@email.com',
        role: 'admin',
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
  });

  test('Delete request for /api/users/:email', () => {
    return request(app)
      .delete('/api/users/email@email.com')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
  });
});
