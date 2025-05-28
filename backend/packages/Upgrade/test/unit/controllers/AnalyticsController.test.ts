import app from '../../utils/expressApp';
import request from 'supertest';
import { configureLogger } from '../../utils/logger';
import { useContainer as routingUseContainer } from 'routing-controllers';
import { Container } from 'typedi';
import { v4 as uuid } from 'uuid';
import AuditServiceMock from './mocks/AuditServiceMock';
import { AnalyticsService } from '../../../src/api/services/AnalyticsService';

import { useContainer as classValidatorUseContainer } from 'class-validator';
import { DATE_RANGE } from '../../../../../../types/src';

describe('Analytics Controller Testing', () => {
  beforeAll(() => {
    configureLogger();
    routingUseContainer(Container);
    classValidatorUseContainer(Container);

    // set mock container
    Container.set(AnalyticsService, new AuditServiceMock());
  });

  afterAll(() => {
    Container.reset();
  });

  test('Post request for /api/stats/enrollment', () => {
    return request(app)
      .post('/api/stats/enrollment')
      .send({ experimentIds: [uuid()] })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(700);
  });

  test('Post request for /api/stats/enrollment/detail', () => {
    return request(app)
      .post('/api/stats/enrollment/detail')
      .send({ experimentId: uuid() })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
  });

  test('Post request for /api/stats/enrollment/date', () => {
    return request(app)
      .post('/api/stats/enrollment/date')
      .send({
        experimentId: uuid(),
        dateEnum: DATE_RANGE.LAST_SEVEN_DAYS,
        clientOffset: 330,
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
  });

  test('Get request for /api/stats/csv', () => {
    return request(app)
      .get('/api/stats/csv')
      .query({
        experimentId: uuid(),
        email: 'xyz@gmail.com',
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
  });
});
