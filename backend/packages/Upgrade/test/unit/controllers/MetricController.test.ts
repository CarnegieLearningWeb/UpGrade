import app from '../../utils/expressApp';
import request from 'supertest';
import { configureLogger } from '../../utils/logger';
import { useContainer as routingUseContainer } from 'routing-controllers';
import { Container } from 'typedi';
import { MetricService } from '../../../src/api/services/MetricService';
import { useContainer as classValidatorUseContainer } from 'class-validator';
import { useContainer as ormUseContainer } from 'typeorm';
import { v4 as uuid } from 'uuid';
import MetricServiceMock from './mocks/MetricServiceMock';

describe('Metric Controller Testing', () => {
  beforeAll(() => {
    configureLogger();
    routingUseContainer(Container);
    ormUseContainer(Container);
    classValidatorUseContainer(Container);

    Container.set(MetricService, new MetricServiceMock());
  });

  afterAll(() => {
    Container.reset();
  });

  test('Get request for /api/metric', () => {
    return request(app).get('/api/metric').set('Accept', 'application/json').expect('Content-Type', /json/).expect(200);
  });

  test('Post request for /api/metric/save', () => {
    return request(app)
      .post('/api/metric/save')
      .send({
        metricUnit: [],
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
  });

  test('Delete request for /api/metric/:key', () => {
    return request(app)
      .delete(`/api/metric/${uuid()}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
  });
});
