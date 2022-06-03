import app from '../../utils/expressApp';
import request from 'supertest';
import { configureLogger } from '../../utils/logger';
import { useContainer as routingUseContainer } from 'routing-controllers';
import { Container } from 'typedi';
import uuid from 'uuid/v4';
import ExperimentExcludeServiceMock from './mocks/ExperimentExcludeServiceMock';
import { ExperimentExcludeService } from '../../../src/api/services/ExperimentExcludeService';

import { useContainer as classValidatorUseContainer } from 'class-validator';
import { useContainer as ormUseContainer } from 'typeorm';

describe('Experiment Exclude Controller Testing', () => {
  beforeAll(() => {
    configureLogger();
    routingUseContainer(Container);
    ormUseContainer(Container);
    classValidatorUseContainer(Container);

    // set mock container
    Container.set(ExperimentExcludeService, new ExperimentExcludeServiceMock());
  });

  afterAll(() => {
    Container.reset();
  });

  const excludedUsers = {
    "userIds": [
      uuid(),
      uuid(),
      uuid()
    ],
    "experimentId": uuid()
  }

  const excludedGroups = {
    "groups": [
      {
        "type": "schoolId",
        "groupId": "abc123"
      }
    ],
    "experimentId": uuid()
  }

  const user_uuid = uuid();
  const exp_uuid = uuid();
  const group_uuid = uuid();
  const exp_not_uuid = 'exp01';

  test('Get request for /api/explicitExclude/experiment/user', async done => {
    await request(app)
      .get('/api/explicitExclude/experiment/user')
      .expect('Content-Type', /json/)
      .expect(200);
    done();
  });

  test('Post request for /api/explicitExclude/experiment/user', async done => {
    await request(app)
      .post('/api/explicitExclude/experiment/user')
      .send(excludedUsers)
      .expect('Content-Type', /json/)
      .expect(200);
    done();
  });

  test('Get request for /api/explicitExclude/experiment/user/:userId/:experimentId', async done => {
    await request(app)
      .get(`/api/explicitExclude/experiment/user/${user_uuid}/${exp_uuid}`)
      .expect('Content-Type', /json/)
      .expect(200);
    done();
  });

  test('Get request expId not UUID for /api/explicitExclude/experiment/user/:userId/:experimentId', async done => {
    await request(app)
      .get(`/api/explicitExclude/experiment/user/${user_uuid}/${exp_not_uuid}`)
      .expect(500);
    done();
  });

  test('Delete request for /api/explicitExclude/experiment/user/:userId/:experimentId', async done => {
    await request(app)
      .delete(`/api/explicitExclude/experiment/user/${user_uuid}/${exp_uuid}`)
      .expect('Content-Type', /json/)
      .expect(200);
    done();
  });

  test('Delete request expId not UUID for /api/explicitExclude/experiment/user/:userId/:experimentId', async done => {
    await request(app)
      .delete(`/api/explicitExclude/experiment/user/${user_uuid}/${exp_not_uuid}`)
      .expect(500);
    done();
  });

  test('Get request for /api/explicitExclude/experiment/group', async done => {
    await request(app)
      .get('/api/explicitExclude/experiment/group')
      .expect('Content-Type', /json/)
      .expect(200);
    done();
  });

  test('Post request for /api/explicitExclude/experiment/group', async done => {
    await request(app)
      .post('/api/explicitExclude/experiment/group')
      .send(excludedGroups)
      .expect('Content-Type', /json/)
      .expect(200);
    done();
  });

  test('Get request for /api/explicitExclude/experiment/group/:type/:id/:experimentId', async done => {
    await request(app)
      .get(`/api/explicitExclude/experiment/group/${'schoolId'}/${group_uuid}/${exp_uuid}`)
      .expect('Content-Type', /json/)
      .expect(200);
    done();
  });

  test('Get request expId not UUID for /api/explicitExclude/experiment/group/:type/:id/:experimentId', async done => {
    await request(app)
      .get(`/api/explicitExclude/experiment/group/${'schoolId'}/${group_uuid}/${exp_not_uuid}`)
      .expect(500);
    done();
  });

  test('Delete request for /api/explicitExclude/experiment/group/:type/:id/:experimentId', async done => {
    await request(app)
      .delete(`/api/explicitExclude/experiment/group/${'schoolId'}/${group_uuid}/${exp_uuid}`)
      .expect('Content-Type', /json/)
      .expect(200);
    done();
  });

  test('Delete request expId not UUID for /api/explicitExclude/experiment/group/:type/:id/:experimentId', async done => {
    await request(app)
      .delete(`/api/explicitExclude/experiment/group/${'schoolId'}/${group_uuid}/${exp_not_uuid}`)
      .expect(500);
    done();
  });

  
});
