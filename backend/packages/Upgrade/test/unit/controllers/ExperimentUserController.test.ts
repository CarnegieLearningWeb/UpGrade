import app from '../../utils/expressApp';
import request from 'supertest';
import { configureLogger } from '../../utils/logger';
import { useContainer as routingUseContainer } from 'routing-controllers';
import { Container } from 'typedi';
import { ExperimentUserService } from '../../../src/api/services/ExperimentUserService';
import ExperimentUserServiceMock from './mocks/ExperimentUserServiceMock';

import { useContainer as classValidatorUseContainer } from 'class-validator';
import { useContainer as ormUseContainer } from 'typeorm';
import uuid from 'uuid';

describe('Experiment User Controller Testing', () => {
  beforeAll(() => {
    configureLogger();
    routingUseContainer(Container);
    ormUseContainer(Container);
    classValidatorUseContainer(Container);

    Container.set(ExperimentUserService, new ExperimentUserServiceMock());
  });

  afterAll(() => {
    Container.reset();
  });

  test('Get request for /api/experimentusers', async (done) => {
    await request(app)
      .get('/api/experimentusers')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
    done();
  });

  test('Get request for /api/experimentusers/id', async (done) => {
    await request(app)
      .get('/api/experimentusers/' + uuid())
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
    done();
  });

  test('Get request for /api/experimentusers/id with bad id', async (done) => {
    await request(app)
      .get('/api/experimentusers/u22')
      .set('Accept', 'application/json')
      .expect('Content-Type', 'text/html; charset=utf-8')
      .expect(500);
    done();
  });

  test('Post request for /api/experimentusers/', async (done) => {
    await request(app)
      .post('/api/experimentusers/')
      .send( {
        users: [{
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
        }]
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
    done();
  });

  test('Put request for /api/experimentusers/id', async (done) => {
    await request(app)
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
    done();
  });
});
