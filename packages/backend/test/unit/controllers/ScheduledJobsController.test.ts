import app from '../../utils/expressApp';
import { Container } from 'typedi';
import { configureLogger } from '../../utils/logger';
import { useContainer as routingUseContainer } from 'routing-controllers';
import request from 'supertest';
import { v4 as uuid } from 'uuid';
import { ScheduledJobService } from '../../../src/api/services/ScheduledJobService';
import ScheduledJobServiceMock from './mocks/ScheduledJobServiceMock';
import { ScheduleJobMiddleware } from '../../../src/api/middlewares/ScheduleJobMiddleware';
import ScheduleJobMiddlewareMock from './mocks/ScheduleJobMiddlewareMock';

describe('Scheduled Job Controller Testing', () => {
  beforeAll(() => {
    configureLogger();
    routingUseContainer(Container);

    // set mock container
    Container.set(ScheduledJobService, new ScheduledJobServiceMock());
    Container.set(ScheduleJobMiddleware, new ScheduleJobMiddlewareMock());
  });

  afterAll(() => {
    Container.reset();
  });

  test('Post request for /api/scheduledJobs/start', () => {
    // creating express app here
    return request(app)
      .post('/api/scheduledJobs/start')
      .send({ id: uuid() })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
  });

  test('Post request for /api/scheduledJobs/end', () => {
    return request(app)
      .post('/api/scheduledJobs/end')
      .send({ id: uuid() })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
  });

  test('Post request for /api/scheduledJobs/clearLogs', () => {
    return request(app)
      .post('/api/scheduledJobs/clearLogs')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
  });
});
