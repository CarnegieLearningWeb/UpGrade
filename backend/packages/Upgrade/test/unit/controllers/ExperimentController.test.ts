import app from '../../utils/expressApp';
import request from 'supertest';
import { configureLogger } from '../../utils/logger';
import { useContainer as routingUseContainer } from 'routing-controllers';
import { Container } from 'typedi';
import uuid from 'uuid/v4';
import ExperimentServieMock from './mocks/ExperimentServiceMock';
import { ExperimentService } from '../../../src/api/services/ExperimentService';

import { useContainer as classValidatorUseContainer } from 'class-validator';
import { useContainer as ormUseContainer } from 'typeorm';

describe('Experiment Controller Testing', () => {
  beforeAll(() => {
    configureLogger();
    routingUseContainer(Container);
    ormUseContainer(Container);
    classValidatorUseContainer(Container);

    // set mock container
    Container.set(ExperimentService, new ExperimentServieMock());
  });

  afterAll(() => {
    Container.reset();
  });

  const experimentData = {
    id: "string",
    name: "string",
    description: "string",
    state: "inactive",
    startOn: "2021-08-11T05:41:51.655Z",
    consistencyRule: "individual",
    assignmentUnit: "individual",
    postExperimentRule: "continue",
    enrollmentCompleteCondition: {
      userCount: 0,
      groupCount: 0
    },
    endOn: "2021-08-11T05:41:51.655Z",
    revertTo: "string",
    tags: [
      "string"
    ],
    group: "string",
    conditions: [
      {
        name: "string",
        assignmentWeight: 0,
        description: "string"
      }
    ],
    partitions: [
      {
        point: "string",
        name: "string",
        description: "string"
      }
    ],
    metrics: [
      {}
    ]
  }

  test('Get request for /api/experiments', async done => {
    await request(app)
      .get('/api/experiments')
      .expect('Content-Type', /json/)
      .expect(200);
    done();
  });

  test('Post request for /api/experiments', async done => {
    await request(app)
      .post('/api/experiments')
      .send(experimentData)
      .expect('Content-Type', /json/)
      .expect(200);
    done();
  });

  test('Get request for /api/experiments/names', async done => {
    await request(app)
      .get('/api/experiments/names')
      .expect('Content-Type', /json/)
      .expect(200);
    done();
  });

  test('Get request for /api/experiments/contextMetaData', async done => {
    await request(app)
      .get('/api/experiments/contextMetaData')
      .expect('Content-Type', /json/)
      .expect(200);
    done();
  });

  test('Post request for /api/experiments/paginated', async done => {
    await request(app)
      .post('/api/experiments/paginated')
      .send({
        skip: 0,
        take: 20,
        sortParams: {key: "name", sortAs: "ASC"}
      })
      .set('Accept', 'application/json')
      .expect(200);
    done();
  });

  test('Get request for /api/experiments/partitions', async done => {
    await request(app)
      .get('/api/experiments/partitions')
      .expect('Content-Type', /json/)
      .expect(200);
    done();
  });

  test('Get request for /api/experiments/single/:id', async done => {
    await request(app)
      .get(`/api/experiments/single/${uuid()}`)
      .expect('Content-Type', /json/)
      .expect(200)
    done();
  });

  const expIdNotTypeUUID = 'abc';
  test('Get request for /api/experiments/single/:id', async done => {
    await request(app)
      .get(`/api/experiments/single/${expIdNotTypeUUID}`)
      .expect(500)
    done();
  });

  test('Get request for /api/experiments/conditions/:id', async done => {
    await request(app)
      .get(`/api/experiments/conditions/${uuid()}`)
      .expect('Content-Type', /json/)
      .expect(200);
    done();
  });

  test('Get request for /api/experiments/conditions/:id', async done => {
    await request(app)
    .get(`/api/experiments/single/${expIdNotTypeUUID}`)
      .expect(500);
    done();
  });

  test('Post request for /api/experiments/batch', async done => {
    await request(app)
      .post('/api/experiments/batch')
      .send(experimentData)
      .expect('Content-Type', /json/)
      .expect(200);
      done();
  });

  test('Delete request for /api/experiments/:id', async done => {
    await request(app)
      .delete(`/api/experiments/${uuid()}`)
      .expect('Content-Type', /json/)
      .expect(200);
    done();
  });

  test('Put request for /api/experiments/:id', async done => {
    await request(app)
      .put(`/api/experiments/${uuid()}`)
      .expect(200);
    done();
  });

  test('Put request for /api/experiments/:id', async done => {
    await request(app)
      .put(`/api/experiments/${expIdNotTypeUUID}`)
      .expect(500);
    done();
  });

  test('Post request for /api/experiments/state', async done => {
    await request(app)
      .post('/api/experiments/state')
      .send({id: uuid(), state: "enrollmentComplete"})
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
    done();
  });

  test('Post request for /api/experiments/import', async done => {
    await request(app)
      .post('/api/experiments/import')
      .send(experimentData)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
    done();
  });
});
