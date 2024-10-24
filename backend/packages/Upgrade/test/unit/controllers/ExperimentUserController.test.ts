import app from '../../utils/expressApp';
import request from 'supertest';
import { configureLogger } from '../../utils/logger';
import { useContainer as routingUseContainer } from 'routing-controllers';
import { Container } from 'typedi';
import { ExperimentUserService } from '../../../src/api/services/ExperimentUserService';
import ExperimentUserServiceMock from './mocks/ExperimentUserServiceMock';

import { useContainer as classValidatorUseContainer } from 'class-validator';
import { v4 as uuid } from 'uuid';

describe('Experiment User Controller Testing', () => {
  beforeAll(() => {
    configureLogger();
    routingUseContainer(Container);
    classValidatorUseContainer(Container);

    Container.set(ExperimentUserService, new ExperimentUserServiceMock());
  });

  afterAll(() => {
    Container.reset();
  });

  test('Get request for /api/experimentusers', () => {
    return request(app)
      .get('/api/experimentusers')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
  });

  test('Get request for /api/experimentusers/id', () => {
    return request(app)
      .get('/api/experimentusers/' + uuid())
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
  });

  test('Get request for /api/experimentusers/id with bad id', () => {
    return request(app)
      .get('/api/experimentusers/u22')
      .set('Accept', 'application/json')
      .expect('Content-Type', 'text/html; charset=utf-8')
      .expect(500);
  });

  test('Post request for /api/experimentusers/', () => {
    return request(app)
      .post('/api/experimentusers/')
      .send({
        users: [
          {
            id: 'u21',
            group: {
              school: ['testschool'],
              class: ['testclass'],
              instructor: ['testteacher'],
            },
            workingGroup: {
              school: 'testschool',
              class: 'testclass',
              instructor: 'testteacher',
            },
          },
        ],
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
  });

  test('Put request for /api/experimentusers/id', () => {
    return request(app)
      .put('/api/experimentusers/u21')
      .send({
        id: 'u21',
        group: {
          school: ['testschool'],
          class: ['testclass'],
          instructor: ['testteacher'],
        },
        workingGroup: {
          school: 'testschool',
          class: 'testclass',
          instructor: 'testteacher',
        },
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
  });
});
