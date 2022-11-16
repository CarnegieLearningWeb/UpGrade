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

  const excludedGroups = {
    type: 'schoolId',
    id: 'abc123',
  };

  const user_uuid = uuid();

  test('Get request for /api/explicitExclude/global/user', async (done) => {
    await request(app).get('/api/explicitExclude/global/user').expect('Content-Type', /json/).expect(200);
    done();
  });

  test('Put request for /api/explicitExclude/global/user', async (done) => {
    await request(app)
      .put('/api/explicitExclude/global/user')
      .send(user_uuid)
      .expect('Content-Type', /json/)
      .expect(200);
    done();
  });

  test('Delete request for /api/explicitExclude/global/user/:id', async (done) => {
    await request(app)
      .delete(`/api/explicitExclude/global/user/${user_uuid}`)
      .expect('Content-Type', /json/)
      .expect(200);
    done();
  });

  test('Get request for /api/explicitExclude/global/group', async (done) => {
    await request(app).get('/api/explicitExclude/global/group').expect('Content-Type', /json/).expect(200);
    done();
  });

  test('Put request for /api/explicitExclude/global/group', async (done) => {
    await request(app)
      .put('/api/explicitExclude/global/group')
      .send(excludedGroups)
      .expect('Content-Type', /json/)
      .expect(200);
    done();
  });

  test('Delete request for /api/explicitExclude/global/group/:type/:id', async (done) => {
    await request(app)
      .delete(`/api/explicitExclude/global/group/${excludedGroups.type}/${excludedGroups.id}`)
      .send(excludedGroups)
      .expect('Content-Type', /json/)
      .expect(200);
    done();
  });
});
