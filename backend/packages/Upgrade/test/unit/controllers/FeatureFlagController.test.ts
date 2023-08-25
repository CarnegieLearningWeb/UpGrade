import app from '../../utils/expressApp';
import request from 'supertest';
import { configureLogger } from '../../utils/logger';
import { useContainer as routingUseContainer } from 'routing-controllers';
import { Container } from 'typedi';
import { FeatureFlagService } from '../../../src/api/services/FeatureFlagService';
import FeatureFlagServiceMock from './mocks/FeatureFlagServiceMock';

import { useContainer as classValidatorUseContainer } from 'class-validator';
import { useContainer as ormUseContainer } from 'typeorm';
import uuid from 'uuid';

describe('Feature Flag Controller Testing', () => {
  beforeAll(() => {
    configureLogger();
    routingUseContainer(Container);
    ormUseContainer(Container);
    classValidatorUseContainer(Container);

    Container.set(FeatureFlagService, new FeatureFlagServiceMock());
  });

  afterAll(() => {
    Container.reset();
  });

  test('Post request for /api/flags/paginated', async (done) => {
    await request(app)
      .post('/api/flags/paginated')
      .send({
        skip: 0,
        take: 20,
        sortParams: {
          key: 'name',
          sortAs: 'ASC',
        },
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
    done();
  });

  test('Post request for /api/flags', async (done) => {
    await request(app)
      .post('/api/flags')
      .send({
        id: 'string',
        name: 'string',
        key: 'string',
        description: 'string',
        variationType: 'string',
        status: true,
        variations: [
          {
            id: 'string',
            value: 'string',
            name: 'string',
            description: 'string',
            defaultVariation: [],
          },
        ],
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
    done();
  });

  test('Post request for /api/flags/status', async (done) => {
    await request(app)
      .post('/api/flags/status')
      .send({
        flagId: uuid(),
        status: true
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
    done();
  });

  test('Delete request for /api/flags/id', async (done) => {
    await request(app)
      .delete('/api/flags/' + uuid())
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
    done();
  });

  test('Put request for /api/flags/id', async (done) => {
    await request(app)
      .put('/api/flags/' + uuid())
      .send({
        id: 'string',
        name: 'string',
        key: 'string',
        description: 'string',
        variationType: 'string',
        status: true,
        variations: [
          {
            id: 'string',
            value: 'string',
            name: 'string',
            description: 'string',
            defaultVariation: [],
          },
        ],
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
    done();
  });
});
