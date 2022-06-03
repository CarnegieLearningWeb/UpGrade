import app from '../../utils/expressApp';
import request from 'supertest';
import { configureLogger } from '../../utils/logger';
import { useContainer as routingUseContainer } from 'routing-controllers';
import { Container } from 'typedi';
import uuid from 'uuid/v4';
import ExperimentIncludeServiceMock from './mocks/ExperimentIncludeServiceMock';
import { ExperimentIncludeService } from '../../../src/api/services/ExperimentIncludeService';

import { useContainer as classValidatorUseContainer } from 'class-validator';
import { useContainer as ormUseContainer } from 'typeorm';

describe('Experiment Include Controller Testing', () => {
  beforeAll(() => {
    configureLogger();
    routingUseContainer(Container);
    ormUseContainer(Container);
    classValidatorUseContainer(Container);

    // set mock container
    Container.set(ExperimentIncludeService, new ExperimentIncludeServiceMock());
  });

  afterAll(() => {
    Container.reset();
  });

  const includedUsers = {
    "userIds": [
      uuid(),
      uuid(),
      uuid()
    ],
    "experimentId": uuid()
  }

  const includedGroups = {
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

  test('Get request for /api/explicitInclude/experiment/user', async done => {
    await request(app)
      .get('/api/explicitInclude/experiment/user')
      .expect('Content-Type', /json/)
      .expect(200);
    done();
  });

  test('Post request for /api/explicitInclude/experiment/user', async done => {
    await request(app)
      .post('/api/explicitInclude/experiment/user')
      .send(includedUsers)
      .expect('Content-Type', /json/)
      .expect(200);
    done();
  });

  test('Get request for /api/explicitInclude/experiment/user/:userId/:experimentId', async done => {
    await request(app)
      .get(`/api/explicitInclude/experiment/user/${user_uuid}/${exp_uuid}`)
      .expect('Content-Type', /json/)
      .expect(200);
    done();
  });

  test('Get request expId not UUID for /api/explicitInclude/experiment/user/:userId/:experimentId', async done => {
    await request(app)
      .get(`/api/explicitInclude/experiment/user/${user_uuid}/${exp_not_uuid}`)
      .expect(500);
    done();
  });

  test('Delete request for /api/explicitInclude/experiment/user/:userId/:experimentId', async done => {
    await request(app)
      .delete(`/api/explicitInclude/experiment/user/${user_uuid}/${exp_uuid}`)
      .expect('Content-Type', /json/)
      .expect(200);
    done();
  });

  test('Delete request expId not UUID for /api/explicitInclude/experiment/user/:userId/:experimentId', async done => {
    await request(app)
      .delete(`/api/explicitInclude/experiment/user/${user_uuid}/${exp_not_uuid}`)
      .expect(500);
    done();
  });

  test('Get request for /api/explicitInclude/experiment/group', async done => {
    await request(app)
      .get('/api/explicitInclude/experiment/group')
      .expect('Content-Type', /json/)
      .expect(200);
    done();
  });

  test('Post request for /api/explicitInclude/experiment/group', async done => {
    await request(app)
      .post('/api/explicitInclude/experiment/group')
      .send(includedGroups)
      .expect('Content-Type', /json/)
      .expect(200);
    done();
  });

  test('Get request for /api/explicitInclude/experiment/group/:type/:id/:experimentId', async done => {
    await request(app)
      .get(`/api/explicitInclude/experiment/group/${'schoolId'}/${group_uuid}/${exp_uuid}`)
      .expect('Content-Type', /json/)
      .expect(200);
    done();
  });

  test('Get request expId not UUID for /api/explicitInclude/experiment/group/:type/:id/:experimentId', async done => {
    await request(app)
      .get(`/api/explicitInclude/experiment/group/${'schoolId'}/${group_uuid}/${exp_not_uuid}`)
      .expect(500);
    done();
  });

  test('Delete request for /api/explicitInclude/experiment/group/:type/:id/:experimentId', async done => {
    await request(app)
      .delete(`/api/explicitInclude/experiment/group/${'schoolId'}/${group_uuid}/${exp_uuid}`)
      .expect('Content-Type', /json/)
      .expect(200);
    done();
  });

  test('Delete request expId not UUID for /api/explicitInclude/experiment/group/:type/:id/:experimentId', async done => {
    await request(app)
      .delete(`/api/explicitInclude/experiment/group/${'schoolId'}/${group_uuid}/${exp_not_uuid}`)
      .expect(500);
    done();
  });

  
});
