import app from '../../utils/expressApp';
import request from 'supertest';
import { configureLogger } from '../../utils/logger';
import { useContainer as routingUseContainer } from 'routing-controllers';
import { Container } from 'typedi';
import uuid from 'uuid/v4';
import ExcludeServiceMock from './mocks/ExcludeServiceMock';
import { ExcludeService } from '../../../src/api/services/ExcludeService';

import { useContainer as classValidatorUseContainer } from 'class-validator';
import { useContainer as ormUseContainer } from 'typeorm';

describe('Exclude Controller Testing', () => {
  beforeAll(() => {
    configureLogger();
    routingUseContainer(Container);
    ormUseContainer(Container);
    classValidatorUseContainer(Container);
  
    // set mock container
    Container.set(ExcludeService, new ExcludeServiceMock());
  });
  
  afterAll(() => {
    Container.reset();
  });
  
  test('Get request for /api/exclude/user', async done => {
    await request(app)
      .get('/api/exclude/user')
      .expect('Content-Type', /json/)
      .expect(200);
    done();
  });

  test('Put request for /api/exclude/user', async done => {
    await request(app)
      .put('/api/exclude/user')
      .send({id: uuid()})
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
    done();
  });

  test('Delete request for /api/exclude/user/:id', async done => {
    await request(app)
      .delete(`/api/exclude/user/${uuid()}`)
      .expect('Content-Type', /json/)
      .expect(200);
    done();
  });

  test('Get request for /api/exclude/group', async done => {
    await request(app)
      .get('/api/exclude/group')
      .expect('Content-Type', /json/)
      .expect(200);
    done();
  });

  test('Put request for /api/exclude/group', async done => {
    await request(app)
      .put('/api/exclude/group')
      .send({
        id: uuid(),
        type: "abs"
      })
      .expect('Content-Type', /json/)
      .expect(200);
    done();
  });

  const type = "abc";
  test('Delete request for /api/group/:type/:id', async done => {
    await request(app)
      .delete(`/api/exclude/group/${type}/${uuid()}`)
      .expect('Content-Type', /json/)
      .expect(200);
    done();
  });
});
