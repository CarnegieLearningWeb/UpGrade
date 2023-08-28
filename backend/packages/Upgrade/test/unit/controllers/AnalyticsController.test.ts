import app from '../../utils/expressApp';
import request from 'supertest';
import { configureLogger } from '../../utils/logger';
import { useContainer as routingUseContainer } from 'routing-controllers';
import { Container } from 'typedi';
import uuid from 'uuid/v4';
import AuditServiceMock from './mocks/AuditServiceMock';
import { AnalyticsService } from '../../../src/api/services/AnalyticsService';

import { useContainer as classValidatorUseContainer } from 'class-validator';
import { DATE_RANGE } from '../../../../../../types/src';

describe('Analytics Controller Testing', () => {
  beforeAll(() => {
    configureLogger();
    routingUseContainer(Container);
    //ormUseContainer(Container);
    classValidatorUseContainer(Container);

    // set mock container
    Container.set(AnalyticsService, new AuditServiceMock());
  });

  afterAll(() => {
    Container.reset();
  });

  test('Post request for /api/stats/enrollment', async (done) => {
    await request(app)
      .post('/api/stats/enrollment')
      .send({ experimentIds: [uuid()] })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
    done();
  });

  test('Post request for /api/stats/enrollment/detail', async (done) => {
    await request(app)
      .post('/api/stats/enrollment/detail')
      .send({ experimentId: uuid() })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
    done();
  });

  test('Post request for /api/stats/enrollment/date', async (done) => {
    await request(app)
      .post('/api/stats/enrollment/date')
      .send({
        experimentId: uuid(),
        dateEnum: DATE_RANGE.LAST_SEVEN_DAYS,
        clientOffset: 330,
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
    done();
  });

  test('Post request for /api/stats/csv', async (done) => {
    await request(app)
      .post('/api/stats/csv')
      .send({
        experimentId: uuid(),
        email: 'xyz@gmail.com',
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
    done();
  });
});
